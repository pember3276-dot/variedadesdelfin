# Pagos con Bold (PSE y tarjeta)

La tienda es estática (GitHub Pages) y Bold exige una **firma de integridad** hecha con la **llave secreta**,
que no puede ir en la página. Por eso un Cloudflare Worker gratuito (`worker.js`) firma cada cobro:

1. La página envía el carrito (`{id: cantidad}`) al Worker.
2. El Worker recalcula el total con los precios publicados en `/assets/tienda.js` (el cliente no puede cambiar el monto),
   crea la referencia `VD-AAAAMMDD-XXXXXXXX` y devuelve `SHA256(referencia + monto + "COP" + llave secreta)`.
3. La página pinta el botón oficial de Bold con esos datos. El cliente paga en Bold y vuelve a `/pago/` (o `/en/payment/`),
   que le arma el mensaje de WhatsApp con el pedido y la referencia.

> El estado que llega en la URL de regreso es informativo. **Antes de despachar, confirma el pago en el panel o la app de Bold
> (Historial de ventas)** buscando la referencia `VD-…`.

El domicilio no se cobra en línea (su valor varía): con Bold se pagan los productos y el domicilio se paga al recibir,
o se usa la opción "Link de pago por WhatsApp" con el valor total.

## Puesta en marcha

1. **Bold → Integraciones → Llaves de integración → Botón de pagos → Activar llaves.** Hay llaves de pruebas y de producción.
2. **Cloudflare (gratis) → Workers & Pages → Create → Worker** llamado `bold-firma`. Pegar `worker.js` y publicar.
   - Settings → Variables and Secrets: `BOLD_API_KEY` (llave de identidad, texto) y `BOLD_SECRET_KEY` (llave secreta, tipo *Secret*).
   - Alternativa: guardar `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `BOLD_API_KEY` y `BOLD_SECRET_KEY` como secretos del repositorio
     y ejecutar la acción **Worker de pagos Bold**.
3. Poner la URL del Worker (hoy `https://bold-firma.arelly3276.workers.dev/`) en `BOLD_FIRMA` de `assets/tienda.js`.
   Mientras esté vacía, la opción de Bold no aparece en la tienda.
4. Probar con las llaves de **pruebas** y luego cambiar las dos variables del Worker a las de **producción** (la página no cambia).

Los precios que lee el Worker están en el bloque `PRECIOS` de `tienda.js` (`{id:N,c:"…",p:PRECIO}` y `DCTO_FLASH = 0`, precio final).
Lo regenera `scripts/catalogo.py` desde `datos/productos/` cada vez que se guarda un producto en el panel; no editarlo a mano.
