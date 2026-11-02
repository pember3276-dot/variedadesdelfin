// Firma de pagos Bold para variedadesdelfin.com (Cloudflare Worker).
// La página no puede guardar la llave secreta de Bold, así que este Worker:
//  1. recibe el carrito ({id: cantidad}),
//  2. recalcula el total con los precios publicados en /assets/tienda.js (el cliente no puede cambiar el monto),
//  3. crea una referencia única y devuelve la firma SHA-256 de {referencia}{monto}{COP}{llave secreta}.
// Secretos/variables (Cloudflare → Worker → Settings → Variables): BOLD_SECRET_KEY (secreto), BOLD_API_KEY (llave de identidad).
const SITE = "https://variedadesdelfin.com";
const ORIGINS = [SITE, "https://www.variedadesdelfin.com", "https://pember3276-dot.github.io"];
const MIN = 1000, MAX_QTY = 20;

const cors = o => ({
  "Access-Control-Allow-Origin": ORIGINS.includes(o) ? o : SITE,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin"
});
const json = (o, body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors(o) } });

// Lee los precios de venta tal como los calcula tienda.js: {id:N,c:"…",p:PRECIO …} y el descuento flash DCTO_FLASH.
export async function precios(fetcher = fetch) {
  const r = await fetcher(`${SITE}/assets/tienda.js`, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!r.ok) throw new Error("catalogo");
  const js = await r.text();
  const d = Number((js.match(/const DCTO_FLASH\s*=\s*([\d.]+)/) || [])[1] || 0);
  const out = {};
  for (const m of js.matchAll(/\{id:(\d+),c:"[^"]*",p:(\d+)/g)) {
    const p = Number(m[2]);
    out[m[1]] = d ? Math.ceil(p * (1 - d) / 100) * 100 : p; // igual que PRODUCTS.forEach en tienda.js
  }
  return out;
}

export async function firma(orderId, amount, currency, secret) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${orderId}${amount}${currency}${secret}`));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export default {
  async fetch(req, env) {
    const o = req.headers.get("Origin") || "";
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(o) });
    if (req.method !== "POST") return json(o, { error: "method" }, 405);
    if (!ORIGINS.includes(o)) return json(o, { error: "origin" }, 403);
    if (!env.BOLD_SECRET_KEY || !env.BOLD_API_KEY) return json(o, { error: "config" }, 500);

    let body;
    try { body = await req.json(); } catch { return json(o, { error: "body" }, 400); }
    const items = body && body.items;
    if (!items || typeof items !== "object") return json(o, { error: "items" }, 400);

    let lista;
    try { lista = await precios(); } catch { return json(o, { error: "catalogo" }, 502); }
    let amount = 0;
    for (const [id, q] of Object.entries(items)) {
      const n = Number(q);
      if (!(id in lista) || !Number.isInteger(n) || n < 1 || n > MAX_QTY) return json(o, { error: "item", id }, 400);
      amount += lista[id] * n;
    }
    if (amount < MIN) return json(o, { error: "min" }, 400);
    // Si el total que ve el cliente no coincide (precios cambiaron), que recargue la página.
    if (body.amount !== undefined && Number(body.amount) !== amount) return json(o, { error: "precio", amount }, 409);

    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const orderId = `VD-${fecha}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const currency = "COP";
    return json(o, { orderId, amount, currency, apiKey: env.BOLD_API_KEY, signature: await firma(orderId, amount, currency, env.BOLD_SECRET_KEY) });
  }
};
