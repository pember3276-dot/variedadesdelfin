#!/usr/bin/env python3
"""Sugiere descripción, características, traducción y un precio de referencia para los
productos nuevos de datos/productos.json, mirando la foto y buscando precios en la web.

Solo procesa productos con "pedir_sugerencia": true y foto. Nunca cambia el precio de
venta ni publica nada: el precio encontrado queda en "sugerencia" como referencia y la
propietaria decide su valor. Llena descripción y textos solo si están vacíos.

Necesita la variable ANTHROPIC_API_KEY; si no está, no hace nada.
Uso: python3 scripts/sugerir.py   (desde la raíz del repo)
"""
import base64, io, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "datos", "productos.json")
MODEL = "claude-opus-5-5"
CATS = ["gifts", "stationery", "sweets", "plush", "season", "toys", "tech", "home", "tools", "care", "misc"]

PROMPT = """Eres el asistente de Variedades Delfín, una tienda de barrio en Bello (Antioquia, Colombia) que vende regalos, papelería, dulcería, peluches, juguetes, tecnología y artículos de temporada.

La dueña acaba de subir la foto de un producto para su tienda en línea.
Nombre que escribió: {nombre}
Categoría que eligió: {categoria}

1. Mira la foto e identifica el producto (marca y modelo si se ven).
2. Busca en la web el precio de ese producto, nuevo, en tiendas de Colombia (por ejemplo MercadoLibre Colombia, Falabella, Éxito, Alkosto, Homecenter, Panamericana). Usa precios en pesos colombianos. Si no encuentras el mismo modelo, usa productos muy parecidos y dilo en la nota.
3. Toma como precio de referencia la mediana de los precios que encontraste, en pesos, entero. Si no encontraste ninguno confiable, usa null.

Escribe en español de Colombia, claro y sin exagerar. No inventes datos técnicos que no se vean en la foto ni aparezcan en las fuentes. Al final responde SOLO con un bloque ```json con este formato:
{{
  "nombre": "nombre comercial corto, con marca y modelo si se conocen",
  "categoria": "una de: {cats}",
  "descripcion": "una o dos frases, máximo 160 caracteres",
  "caracteristicas": ["4 a 7 puntos cortos"],
  "nombre_en": "...", "descripcion_en": "...", "caracteristicas_en": ["..."],
  "precio_referencia": 123456,
  "fuentes": ["Tienda – $precio – URL"],
  "nota": "una frase: qué tan parecido es lo encontrado y cualquier duda"
}}"""


def imagen_b64(ruta):
    from PIL import Image, ImageOps
    im = ImageOps.exif_transpose(Image.open(ruta)).convert("RGB")
    im.thumbnail((1200, 1200))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=85)
    return base64.standard_b64encode(buf.getvalue()).decode()


def extraer_json(texto):
    m = re.findall(r"```json\s*(\{.*?\})\s*```", texto, re.S)
    cand = m[-1] if m else texto[texto.find("{"): texto.rfind("}") + 1]
    return json.loads(cand)


def pedir(client, d, ruta):
    messages = [{"role": "user", "content": [
        {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": imagen_b64(ruta)}},
        {"type": "text", "text": PROMPT.format(nombre=d.get("nombre") or "(sin nombre)",
                                              categoria=d.get("categoria") or "(sin elegir)", cats=", ".join(CATS))},
    ]}]
    tools = [{"type": "web_search_20260209", "name": "web_search", "max_uses": 4,
              "user_location": {"type": "approximate", "country": "CO", "city": "Medellín",
                                "region": "Antioquia", "timezone": "America/Bogota"}}]
    for _ in range(4):  # la búsqueda puede pausar el turno; se reanuda reenviando
        resp = client.beta.messages.create(
            model=MODEL, max_tokens=16000, messages=messages, tools=tools,
            output_config={"effort": "medium"},
            betas=["server-side-fallback-2026-07-01"], fallbacks="default")
        if resp.stop_reason == "pause_turn":
            messages = messages[:1] + [{"role": "assistant", "content": resp.content}]
            continue
        break
    if resp.stop_reason == "refusal":
        raise RuntimeError("el modelo no quiso procesar esta foto")
    texto = "".join(b.text for b in resp.content if getattr(b, "type", "") == "text")
    return extraer_json(texto)


def vacio(v):
    return not v or (isinstance(v, list) and not any(str(x).strip() for x in v))


def main():
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("Sin ANTHROPIC_API_KEY: no se generan sugerencias.")
        return
    import anthropic
    client = anthropic.Anthropic()
    with open(DATA, encoding="utf-8") as f:
        datos = json.load(f)
    cambios = 0
    for d in datos:
        if not d.get("pedir_sugerencia"):
            continue
        ruta = os.path.join(ROOT, (d.get("foto") or "").lstrip("/"))
        if not d.get("foto") or not os.path.isfile(ruta):
            continue  # espera a que suba la foto
        print(f"Sugerencia para: {d.get('nombre')}")
        try:
            s = pedir(client, d, ruta)
            for k in ("descripcion", "caracteristicas", "nombre_en", "descripcion_en", "caracteristicas_en"):
                if vacio(d.get(k)) and not vacio(s.get(k)):
                    d[k] = s[k]
            if vacio(d.get("nombre")) and s.get("nombre"):
                d["nombre"] = s["nombre"]
            if d.get("categoria") in (None, "", "misc") and s.get("categoria") in CATS:
                d["categoria"] = s["categoria"]
            ref = s.get("precio_referencia")
            d["sugerencia"] = {
                "precio_referencia": int(ref) if isinstance(ref, (int, float)) and ref > 0 else None,
                "fuentes": [str(x) for x in (s.get("fuentes") or [])][:6],
                "nota": str(s.get("nota") or ""),
            }
        except Exception as e:  # no reintentar en bucle: se apaga y se deja la nota
            print(f"  ! {e}", file=sys.stderr)
            d["sugerencia"] = {"precio_referencia": None, "fuentes": [],
                               "nota": f"No se pudo generar la sugerencia ({type(e).__name__}). Vuelve a activar la casilla para intentar de nuevo."}
        d["pedir_sugerencia"] = False
        cambios += 1
    if cambios:
        with open(DATA, "w", encoding="utf-8") as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
            f.write("\n")
    print(f"Sugerencias generadas: {cambios}")


if __name__ == "__main__":
    main()
