# Variedades Delfín · variedadesdelfin.com

Tienda web estática (GitHub Pages) de Variedades Delfín, Calle 63 #61-23, BellaVista, Bello.
Catálogo con pedido por WhatsApp, español (/) e inglés (/en/), páginas legales (Ley 1581 de 2012),
banner de cookies con Google Consent Mode v2 y PWA instalable.

- Productos: `assets/tienda.js` (precio de venta; los costos NO van aquí).
- Pagos PSE/tarjeta con Bold: `bold/` (Worker que firma el cobro; ver `bold/README.md`) y página de regreso `/pago/`.
- Estilos: `assets/site.css`. Cookies, WhatsApp y PWA: `assets/app.js`, `sw.js`.

## Identidad "Celeste y cercana"
- Colores: celeste #54C5F5, cian #20B9D5, azul pálido #EAF8FF, blanco #FFFFFF, amarillo #FFE080 (60 % blanco/pálido, 35 % celeste/cian, 5 % amarillo). Texto y botones usan `--ink` #0B76A6 para cumplir contraste AA.
- Tipografía: Nunito autoalojada (`assets/fonts/nunito.woff2`, variable 400–800, OFL) con `font-display: swap` y respaldo de métricas ajustadas.
- Logo web: `assets/logo.svg` y `assets/simbolo.svg` (optimizados). Originales vectoriales en `brand/`.
