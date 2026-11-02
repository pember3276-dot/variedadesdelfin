#!/usr/bin/env python3
"""Arma el catálogo de la web a partir de datos/productos/*.json (un archivo por producto, lo edita el panel).

- Convierte las fotos subidas desde el celular a WebP cuadrado (img/p/*.webp).
- Escribe assets/productos.js (lo lee assets/tienda.js).
- Actualiza en index.html y en/index.html: filtros, tarjetas prerenderizadas (SEO y
  velocidad), el JSON-LD ItemList y la versión de productos.js para el caché.

Solo entran a la web los productos con "publicado": true, nombre y precio. Orden: destacados y luego los más nuevos.
Uso: python3 scripts/catalogo.py   (desde la raíz del repo)
"""
import hashlib, html, json, os, re, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "datos", "productos")
SITE = "https://variedadesdelfin.com"
LADO = 600  # px de las fotos convertidas

CAT = {
    "tech": {"es": "Tecnología", "en": "Electronics"},
    "tools": {"es": "Herramientas", "en": "Tools"},
    "home": {"es": "Hogar y cocina", "en": "Home & kitchen"},
    "toys": {"es": "Juguetes", "en": "Toys"},
    "care": {"es": "Cuidado personal", "en": "Personal care"},
    "gifts": {"es": "Regalos y detalles", "en": "Gifts"},
    "stationery": {"es": "Papelería", "en": "Stationery"},
    "sweets": {"es": "Dulcería", "en": "Sweets"},
    "plush": {"es": "Peluches", "en": "Plush toys"},
    "season": {"es": "Temporada", "en": "Seasonal"},
    "misc": {"es": "Variedades", "en": "Variety"},
}
GIFT_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="26" width="44" height="30" rx="3" fill="#c2332b"/><rect x="7" y="18" width="50" height="10" rx="3" fill="#a52a23"/><rect x="29" y="18" width="6" height="38" fill="#e3a72f"/><path d="M32 18c-6-10-16-8-12-2 2 3 12 2 12 2zm0 0c6-10 16-8 12-2-2 3-12 2-12 2z" fill="#e3a72f"/></svg>'


def slug(t):
    t = t.lower()
    for a, b in zip("áéíóúüñ", "aeiouun"):
        t = t.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:60] or "foto"


def foto_web(foto):
    """Devuelve la ruta pública WebP de la foto, convirtiéndola si hace falta."""
    if not foto:
        return ""
    rel = foto.lstrip("/")
    src = os.path.join(ROOT, rel)
    if rel.endswith(".webp") and os.path.isfile(src):
        return "/" + rel
    if not os.path.isfile(src):
        print(f"  ! foto no encontrada: {foto}", file=sys.stderr)
        return ""
    out_rel = f"img/p/{slug(os.path.splitext(os.path.basename(rel))[0])}.webp"
    out = os.path.join(ROOT, out_rel)
    if not os.path.isfile(out) or os.path.getmtime(out) < os.path.getmtime(src):
        from PIL import Image, ImageOps
        im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
        im.thumbnail((LADO, LADO), Image.LANCZOS)
        lienzo = Image.new("RGB", (LADO, LADO), "white")
        lienzo.paste(im, ((LADO - im.width) // 2, (LADO - im.height) // 2))
        os.makedirs(os.path.dirname(out), exist_ok=True)
        lienzo.save(out, "WEBP", quality=80, method=6)
        print(f"  foto convertida: {out_rel}")
    return "/" + out_rel


def entero(v):
    try:
        return int(round(float(v)))
    except (TypeError, ValueError):
        return 0


def guardar(ruta, d):
    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
        f.write("\n")


def cargar():
    datos = []
    for fn in sorted(os.listdir(DATA)):
        if fn.endswith(".json"):
            ruta = os.path.join(DATA, fn)
            with open(ruta, encoding="utf-8") as f:
                datos.append((ruta, json.load(f)))
    # Código fijo (lo usa el carrito) y fecha de creación para cada producto nuevo.
    usados = {str(d.get("id")) for _, d in datos if d.get("id")}
    sig = max([int(i) for i in usados if i.isdigit()] + [100]) + 1
    ahora = time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime())
    for ruta, d in datos:
        cambio = False
        if not d.get("id"):
            while str(sig) in usados:
                sig += 1
            d["id"] = str(sig); usados.add(d["id"]); cambio = True
        if not d.get("creado"):
            d["creado"] = ahora; cambio = True
        if cambio:
            guardar(ruta, d)
    # Destacados primero; dentro de cada grupo, los más nuevos arriba.
    datos = sorted((d for _, d in datos), key=lambda d: str(d.get("creado")), reverse=True)
    datos = [d for d in datos if d.get("destacado")] + [d for d in datos if not d.get("destacado")]
    items = []
    for d in datos:
        nombre = (d.get("nombre") or "").strip()
        precio = entero(d.get("precio"))
        if not d.get("publicado") or not nombre or precio <= 0:
            continue
        cat = d.get("categoria") if d.get("categoria") in CAT else "misc"
        antes = entero(d.get("precio_antes"))
        desc = (d.get("descripcion") or "").strip()
        car = [c.strip() for c in (d.get("caracteristicas") or []) if c and c.strip()]
        car_en = [c.strip() for c in (d.get("caracteristicas_en") or []) if c and c.strip()]
        p = {
            "id": str(d["id"]),
            "c": cat,
            "p": precio,
            "img": foto_web(d.get("foto")),
            "n": {"es": nombre, "en": (d.get("nombre_en") or "").strip() or nombre},
            "d": {"es": desc, "en": (d.get("descripcion_en") or "").strip() or desc},
            "f": {"es": car, "en": car_en or car},
        }
        if antes > precio:
            p["antes"] = antes
        items.append(p)
    return items


def fmtp(n):
    return "$" + f"{n:,}".replace(",", ".")


def pct(p):
    return round((1 - p["p"] / p["antes"]) * 100)


def tarjetas(items, lang):
    es, e = lang == "es", html.escape
    out = []
    for i, p in enumerate(items):
        n, d = p["n"][lang], p["d"][lang]
        if p["img"]:
            pic = '<img src="%s" alt="%s" width="400" height="400" %s decoding="async">' % (
                p["img"], e(n), 'fetchpriority="high"' if i < 2 else 'loading="lazy"')
        else:
            pic = GIFT_SVG
        if p.get("antes"):
            price = '<span class="price"><s class="was"><span class="sr">%s </span>%s</s>%s</span>' % (
                "Antes" if es else "Before", fmtp(p["antes"]), fmtp(p["p"]))
            tag = '<span class="tag">Flash −%d%%</span>' % pct(p)
        else:
            price, tag = '<span class="price">%s</span>' % fmtp(p["p"]), ""
        pid = e(p["id"])
        out.append(
            '<article class="card"><button type="button" class="pic" data-detail="%s" aria-label="%s %s">%s%s</button>'
            '<div class="info"><h3><button type="button" data-detail="%s">%s</button></h3><p>%s</p>'
            '<button type="button" class="more" data-detail="%s">%s</button><div class="row">%s'
            '<button type="button" class="add" data-id="%s">%s</button></div></div></article>' % (
                pid, "Ver detalle de" if es else "See details of", e(n), tag, pic, pid, e(n), e(d), pid,
                "Ver detalle" if es else "See details", price, pid, "Agregar" if es else "Add"))
    return "".join(out)


def filtros(items, lang):
    es = lang == "es"
    cats = ["all"] + (["flash"] if any(p.get("antes") for p in items) else []) + list(dict.fromkeys(p["c"] for p in items))
    lab = lambda c: ("Todo" if es else "All") if c == "all" else ("Ofertas flash" if es else "Flash deals") if c == "flash" else CAT[c][lang]
    return "".join('<button type="button" aria-pressed="%s" data-c="%s">%s</button>' % (
        "true" if c == "all" else "false", c, lab(c)) for c in cats)


def itemlist(items, lang):
    es = lang == "es"
    els = []
    for i, p in enumerate(items, 1):
        prod = {"@type": "Product", "name": p["n"][lang], "description": p["d"][lang]}
        if p["img"]:
            prod["image"] = SITE + p["img"]
        url = SITE + ("/" if es else "/en/") + "#tienda"
        prod["offers"] = {"@type": "Offer", "priceCurrency": "COP", "price": p["p"],
                          "availability": "https://schema.org/InStock",
                          "seller": {"@id": SITE + "/#tienda"}, "url": url}
        els.append({"@type": "ListItem", "position": i, "item": prod})
    ld = {"@context": "https://schema.org", "@type": "ItemList",
          "name": "Productos" if es else "Products", "itemListElement": els}
    return json.dumps(ld, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def sub1(pat, repl, s, que):
    s2, n = re.subn(pat, lambda m: repl(m), s, count=1, flags=re.S)
    if n != 1:
        sys.exit(f"No encontré {que} en la página; no se cambió nada.")
    return s2


def main():
    items = cargar()
    js = ("// Generado por scripts/catalogo.py desde datos/productos/. No editar a mano.\n"
          "window.CATALOGO=" + json.dumps({"cat": CAT, "items": items}, ensure_ascii=False, separators=(",", ":")) + ";\n")
    with open(os.path.join(ROOT, "assets", "productos.js"), "w", encoding="utf-8") as f:
        f.write(js)
    ver = hashlib.sha1(js.encode()).hexdigest()[:8]
    # Precios finales para el Worker de Bold (bold/worker.js lee {id:N,c:"…",p:N} y DCTO_FLASH de tienda.js).
    tj = os.path.join(ROOT, "assets", "tienda.js")
    with open(tj, encoding="utf-8") as f:
        t = f.read()
    bloque = ("// PRECIOS:inicio (generado por scripts/catalogo.py; no editar a mano)\nconst DCTO_FLASH = 0;\n"
              + "".join('// {id:%s,c:"%s",p:%d}\n' % (p["id"], p["c"], p["p"]) for p in items if p["id"].isdigit())
              + "// PRECIOS:fin")
    t2, n = re.subn(r"// PRECIOS:inicio.*?// PRECIOS:fin", lambda m: bloque, t, count=1, flags=re.S)
    if n != 1:
        sys.exit("No encontré el bloque PRECIOS en assets/tienda.js; no se cambió nada.")
    with open(tj, "w", encoding="utf-8") as f:
        f.write(t2)
    for lang, rel in (("es", "index.html"), ("en", "en/index.html")):
        path = os.path.join(ROOT, rel)
        with open(path, encoding="utf-8") as f:
            s = f.read()
        s = sub1(r'(id="filters"[^>]*>).*?(</div>)', lambda m: m.group(1) + filtros(items, lang) + m.group(2), s, "los filtros")
        s = sub1(r'(<div class="grid" id="grid"[^>]*>)(?:\s*<article class="card">.*?</article>)*',
                 lambda m: m.group(1) + tarjetas(items, lang), s, "la cuadrícula")
        s = sub1(r'<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"ItemList".*?</script>',
                 lambda m: '<script type="application/ld+json">' + itemlist(items, lang) + "</script>", s, "el ItemList")
        tag = f'<script src="/assets/productos.js?v={ver}" defer></script>'
        if "/assets/productos.js" in s:
            s = re.sub(r'<script src="/assets/productos\.js[^"]*" defer></script>', tag, s)
        else:
            s = sub1(r'<script src="/assets/tienda\.js', lambda m: tag + "\n" + m.group(0), s, "tienda.js")
        with open(path, "w", encoding="utf-8") as f:
            f.write(s)
    print(f"Catálogo listo: {len(items)} productos publicados (productos.js v={ver}).")


if __name__ == "__main__":
    main()
