# Variedades Delfín · variedadesdelfin.com

Tienda web estática (GitHub Pages) de Variedades Delfín, Calle 63 #61-23, BellaVista, Bello.
Catálogo con pedido por WhatsApp, español (/) e inglés (/en/), páginas legales (Ley 1581 de 2012),
banner de cookies con Google Consent Mode v2 y PWA instalable.

- Productos: `datos/productos.json`, editado desde el panel [Pages CMS](https://app.pagescms.org) (config en `.pages.yml`).
  El Action `Catálogo` (`.github/workflows/catalogo.yml`) sugiere descripción y precio de referencia con IA
  (`scripts/sugerir.py`, secreto `ANTHROPIC_API_KEY`) y regenera `assets/productos.js`, las fotos `img/p/` y las
  tarjetas de `index.html` / `en/index.html` (`scripts/catalogo.py`). No editar esas partes a mano. Los costos NO van en el repo.
- Estilos: `assets/site.css`. Cookies, WhatsApp y PWA: `assets/app.js`, `sw.js`.
