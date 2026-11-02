#!/usr/bin/env python3
"""Arma el catálogo de la web a partir de datos/productos/*.json (un archivo por producto, lo edita el panel).

- Ajusta las fotos subidas desde el celular: WebP cuadrado y parejo (img/p/*.webp, 600 px y
  1000 px para la galería) y reduce los originales muy pesados.
- Optimiza los videos (img/v/*.mp4, H.264 720p, máx. 30 s, con portada) con ffmpeg.
- Escribe assets/productos.js (lo lee assets/tienda.js).
- Actualiza en index.html y en/index.html: filtros, tarjetas prerenderizadas (SEO y
  velocidad), el JSON-LD ItemList y la versión de productos.js para el caché.

Solo entran a la web los productos con "publicado": true, nombre y precio. Orden: destacados y luego los más nuevos.
Uso: python3 scripts/catalogo.py   (desde la raíz del repo)
"""
import hashlib, html, json, os, re, shutil, subprocess, sys, time

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


VERSION_FOTOS = "2"  # subirlo obliga a regenerar todas las fotos de img/p
GRANDE = 1000  # px de las fotos de la galería
ORIGINAL_MAX = 1600  # las fotos subidas más grandes se reducen en su sitio (repo liviano)
VIDEO_SEG = 30  # los videos se recortan a esta duración
VIDEO_MB = 12  # tope por video ya optimizado
EXT_VIDEO = (".mp4", ".mov", ".webm", ".m4v", ".3gp")


def _claro(px):
    return min(px) >= 222 and max(px) - min(px) <= 30


def ajustar(im):
    """Deja la foto cuadrada y pareja: recorta bordes blancos, centra el producto y rellena."""
    from PIL import Image, ImageChops, ImageFilter
    w, h = im.size
    esquinas = [im.getpixel(p) for p in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))]
    if sum(_claro(c) for c in esquinas) >= 3:
        # Fondo blanco: recortar al producto y dejar un margen parejo.
        dif = ImageChops.difference(im, Image.new("RGB", im.size, (255, 255, 255))).convert("L")
        caja = dif.point(lambda v: 255 if v > 28 else 0).getbbox()
        if caja and (caja[2] - caja[0]) * (caja[3] - caja[1]) > 0.05 * w * h:
            im = im.crop(caja)
        lado = int(max(im.size) * 1.12)
        fondo = Image.new("RGB", (lado, lado), "white")
        fondo.paste(im, ((lado - im.width) // 2, (lado - im.height) // 2))
        return fondo
    r = w / h
    if 0.95 <= r <= 1.05:
        lado = min(w, h)  # casi cuadrada: recorte centrado
        return im.crop(((w - lado) // 2, (h - lado) // 2, (w - lado) // 2 + lado, (h - lado) // 2 + lado))
    # Foto alargada con fondo de color: el producto completo sobre la misma foto desenfocada.
    lado = max(w, h)
    fondo = im.resize((lado, lado)).filter(ImageFilter.GaussianBlur(lado / 18))
    fondo = Image.blend(fondo, Image.new("RGB", fondo.size, "white"), 0.35)
    fondo.paste(im, ((lado - w) // 2, (lado - h) // 2))
    return fondo


def _version_fotos():
    marca = os.path.join(ROOT, "img", "p", ".version")
    try:
        with open(marca) as f:
            return f.read().strip()
    except OSError:
        return ""


HECHAS = {}
VIEJAS = None  # True si las fotos de img/p se hicieron con otra versión del ajuste


def foto_web(foto):
    """Devuelve {"s": foto 600 px, "l": foto grande} en WebP cuadrado, convirtiéndola si hace falta."""
    global VIEJAS
    if not foto:
        return None
    rel = foto.lstrip("/")
    src = os.path.join(ROOT, rel)
    if not os.path.isfile(src):
        print(f"  ! foto no encontrada: {foto}", file=sys.stderr)
        return None
    if VIEJAS is None:
        VIEJAS = _version_fotos() != VERSION_FOTOS
    base = slug(os.path.splitext(os.path.basename(rel))[0])
    if src in HECHAS:
        return HECHAS[src]
    chica, grande = f"img/p/{base}.webp", f"img/p/{base}-g.webp"
    outs = [os.path.join(ROOT, chica), os.path.join(ROOT, grande)]
    if not VIEJAS and os.path.isfile(outs[0]) and not os.path.isfile(outs[1]) and os.path.getmtime(outs[0]) >= os.path.getmtime(src):
        grande = chica  # foto pequeña: la galería usa la misma
    elif VIEJAS or any(not os.path.isfile(o) or os.path.getmtime(o) < os.path.getmtime(src) for o in outs):
        from PIL import Image, ImageFilter, ImageOps
        im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
        # Original muy grande (foto de celular): se reduce en su sitio para no llenar el repositorio.
        if rel.startswith("img/subidas/") and max(im.size) > ORIGINAL_MAX:
            im.thumbnail((ORIGINAL_MAX, ORIGINAL_MAX), Image.LANCZOS)
            fmt = {".png": "PNG", ".webp": "WEBP"}.get(os.path.splitext(src)[1].lower(), "JPEG")
            im.save(src, fmt, **({"quality": 85, "optimize": True} if fmt != "PNG" else {"optimize": True}))
            print(f"  original reducido: {rel}")
        cuadro = ajustar(im)
        os.makedirs(os.path.dirname(outs[0]), exist_ok=True)
        for out, lado in zip(outs, (LADO, GRANDE)):
            if lado == GRANDE and cuadro.width <= LADO:
                grande = chica  # foto pequeña: no vale la pena una versión grande
                if os.path.isfile(out):
                    os.remove(out)
                break
            c = cuadro.copy()
            if c.width > lado:
                c = c.resize((lado, lado), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1, 40, 2))
            c.save(out, "WEBP", quality=80, method=6)
        print(f"  foto ajustada: {chica}")
    HECHAS[src] = {"s": "/" + chica, "l": "/" + grande}
    return HECHAS[src]


def video_web(video):
    """Optimiza un video subido (H.264, 720p, máx. 30 s) y saca su portada. Devuelve (ruta_json, item)."""
    if not video:
        return None, None
    rel = video.lstrip("/")
    src = os.path.join(ROOT, rel)
    base = slug(os.path.splitext(os.path.basename(rel))[0])
    if rel.startswith("img/v/"):
        poster = f"img/v/{base}.webp"
        if os.path.isfile(src):
            return video, {"src": "/" + rel, "poster": "/" + poster if os.path.isfile(os.path.join(ROOT, poster)) else ""}
        print(f"  ! video no encontrado: {video}", file=sys.stderr)
        return video, None
    if not os.path.isfile(src):
        print(f"  ! video no encontrado: {video}", file=sys.stderr)
        return video, None
    if not shutil.which("ffmpeg"):
        print(f"  ! falta ffmpeg; el video {video} queda pendiente", file=sys.stderr)
        return video, None
    os.makedirs(os.path.join(ROOT, "img", "v"), exist_ok=True)
    n, out_rel = 1, f"img/v/{base}.mp4"
    while os.path.exists(os.path.join(ROOT, out_rel)):
        n += 1; out_rel = f"img/v/{base}-{n}.mp4"
    base = os.path.splitext(os.path.basename(out_rel))[0]
    out = os.path.join(ROOT, out_rel)
    escala = "scale='trunc(min(1,720/min(iw,ih))*iw/2)*2':'trunc(min(1,720/min(iw,ih))*ih/2)*2'"
    for crf in (28, 32, 36):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-t", str(VIDEO_SEG), "-vf", escala + ",fps=30",
                        "-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-profile:v", "main", "-pix_fmt", "yuv420p",
                        "-c:a", "aac", "-b:a", "96k", "-ac", "2", "-movflags", "+faststart", out], check=True)
        if os.path.getsize(out) <= VIDEO_MB * 1024 * 1024:
            break
    poster_rel = f"img/v/{base}.webp"
    jpg = os.path.join(ROOT, "img", "v", base + ".jpg")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "0.3", "-i", out, "-frames:v", "1", jpg], check=True)
    from PIL import Image
    im = Image.open(jpg).convert("RGB")
    im.thumbnail((720, 720), Image.LANCZOS)
    im.save(os.path.join(ROOT, poster_rel), "WEBP", quality=75, method=6)
    os.remove(jpg)
    os.remove(src)  # el original pesado ya no hace falta
    mb = os.path.getsize(out) / 1048576
    print(f"  video optimizado: {out_rel} ({mb:.1f} MB)")
    return "/" + out_rel, {"src": "/" + out_rel, "poster": "/" + poster_rel}


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
        # Antes había una sola "foto"; ahora "fotos" es una lista (hasta 8).
        if "foto" in d:
            vieja = d.pop("foto")
            d["fotos"] = ([vieja] if vieja else []) + [f for f in (d.get("fotos") or []) if f and f != vieja]
            cambio = True
        if isinstance(d.get("fotos"), str):
            d["fotos"] = [d["fotos"]] if d["fotos"] else []; cambio = True
        if isinstance(d.get("videos"), str):
            d["videos"] = [d["videos"]] if d["videos"] else []; cambio = True
        # Videos nuevos: se optimizan y el archivo del panel pasa a la versión liviana.
        vids, nuevas = [], []
        for v in d.get("videos") or []:
            ruta_v, item = video_web(v)
            if ruta_v:
                nuevas.append(ruta_v)
            if item:
                vids.append(item)
        if nuevas != (d.get("videos") or []) and "videos" in d:
            d["videos"] = nuevas; cambio = True
        d["_vids"] = vids
        if not d.get("id"):
            while str(sig) in usados:
                sig += 1
            d["id"] = str(sig); usados.add(d["id"]); cambio = True
        if not d.get("creado"):
            d["creado"] = ahora; cambio = True
        if cambio:
            guardar(ruta, {k: v for k, v in d.items() if k != "_vids"})
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
            "img": "",
            "n": {"es": nombre, "en": (d.get("nombre_en") or "").strip() or nombre},
            "d": {"es": desc, "en": (d.get("descripcion_en") or "").strip() or desc},
            "f": {"es": car, "en": car_en or car},
        }
        fotos = [f for f in (foto_web(x) for x in (d.get("fotos") or [])) if f]
        if fotos:
            p["img"] = fotos[0]["s"]
        if len(fotos) > 1 or d["_vids"]:
            p["g"] = [f["l"] for f in fotos]  # galería del detalle
        if d["_vids"]:
            p["v"] = d["_vids"]
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
        pic += media_pill(p, lang)
        out.append(
            '<article class="card"><button type="button" class="pic" data-detail="%s" aria-label="%s %s">%s%s</button>'
            '<div class="info"><h3><button type="button" data-detail="%s">%s</button></h3><p>%s</p>'
            '<button type="button" class="more" data-detail="%s">%s</button><div class="row">%s'
            '<button type="button" class="add" data-id="%s">%s</button></div></div></article>' % (
                pid, "Ver detalle de" if es else "See details of", e(n), tag, pic, pid, e(n), e(d), pid,
                "Ver detalle" if es else "See details", price, pid, "Agregar" if es else "Add"))
    return "".join(out)


def media_pill(p, lang):
    """Etiqueta en la tarjeta cuando el producto tiene varias fotos o video (igual que tienda.js)."""
    nf, nv = len(p.get("g", [])), len(p.get("v", []))
    partes = []
    if nf > 1:
        partes.append("%d %s" % (nf, "fotos" if lang == "es" else "photos"))
    if nv:
        partes.append("video")
    return '<span class="nmedia">%s</span>' % " · ".join(partes) if partes else ""


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
            prod["image"] = [SITE + u for u in p.get("g") or [p["img"]]]
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
    # Fotos ajustadas que ya ningún producto usa: se borran para no llenar el repositorio.
    usadas = {os.path.basename(u) for p in items for u in [p["img"]] + p.get("g", []) if u}
    usadas |= {u.replace("-g.webp", ".webp") for u in usadas} | {u.replace(".webp", "-g.webp") for u in usadas}
    carpeta = os.path.join(ROOT, "img", "p")
    if os.path.isdir(carpeta):
        for fn in os.listdir(carpeta):
            if fn.endswith(".webp") and fn not in usadas:
                os.remove(os.path.join(carpeta, fn))
        with open(os.path.join(carpeta, ".version"), "w") as f:
            f.write(VERSION_FOTOS + "\n")
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
