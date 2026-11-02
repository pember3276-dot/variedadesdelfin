// Catálogo y pedido por WhatsApp. Los productos vienen de assets/productos.js (generado desde datos/productos/).
const WHATSAPP = "573103790554";
// Pago con Bold (PSE y tarjeta). URL del Worker que firma el cobro (bold/worker.js). Vacía = opción oculta.
// El Worker lee los precios del bloque PRECIOS de abajo (lo genera scripts/catalogo.py desde datos/productos/).
const BOLD_FIRMA = "https://bold-firma.arelly3276.workers.dev/";
const L = document.documentElement.lang === "en" ? "en" : "es";

// PRECIOS:inicio (generado por scripts/catalogo.py; no editar a mano)
const DCTO_FLASH = 0;
// {id:105,c:"tech",p:666800}
// {id:106,c:"tech",p:1066800}
// {id:107,c:"tech",p:1180000}
// {id:108,c:"tech",p:293400}
// {id:109,c:"tech",p:160000}
// {id:110,c:"tools",p:160000}
// {id:111,c:"tools",p:64000}
// {id:112,c:"tools",p:117400}
// {id:113,c:"home",p:120000}
// {id:114,c:"home",p:26800}
// {id:115,c:"home",p:13400}
// {id:101,c:"toys",p:1733400}
// {id:102,c:"toys",p:120000}
// {id:103,c:"care",p:37400}
// {id:104,c:"toys",p:30000}
// {id:999,c:"home",p:5000}
// PRECIOS:fin
const CATALOGO = window.CATALOGO || {cat:{},items:[]};
const CAT = CATALOGO.cat;
const PRODUCTS = CATALOGO.items;
PRODUCTS.forEach(p => { p.flash = !!p.antes; });
const pct = p => Math.round((1 - p.p/p.antes)*100);

const S = {
  es:{all:"Todo",flash:"Ofertas flash",add:"Agregar",inCart:n=>`En pedido (${n})`,addMore:n=>`En pedido (${n}) · agregar otro`,addLong:"Agregar al pedido",photos:"fotos",photoN:(i,n)=>`Foto ${i} de ${n}`,videoN:i=>`Video ${i}`,detail:"Ver detalle",see:"Ver detalle de",
      catFlash:"Oferta flash · ",confirm:"Confirmamos disponibilidad y colores por WhatsApp.",each:"c/u",less:"Quitar uno",more:"Agregar uno",
      hello:"Hola Variedades Delfín, quiero hacer este pedido:",proof:"📎 Adjunto el comprobante de pago para validarlo con el banco.",proofHint:"Paga primero y adjunta aquí el pantallazo o comprobante. Es obligatorio para enviar el pedido: lo verificamos con el banco y te confirmamos el despacho.",errProof:"Adjunta el comprobante de pago (foto o PDF) para enviar el pedido.",errBig:"El archivo pesa más de 10 MB. Envía un pantallazo más liviano.",shareTip:"Elige WhatsApp y el chat de Variedades Delfín (310 379 0554). El comprobante va junto al pedido.",manual:"Tu dispositivo no permite adjuntar desde la web: se abrirá el chat con el pedido; adjunta ahí el comprobante con el clip 📎 antes de enviar.",tot:"Total productos",
      boldPay:"Continuar al pago con PSE o tarjeta",boldWait:"Abriendo la pasarela segura de Bold…",boldReady:"Te llevamos a Bold para pagar con PSE o tarjeta. Si no se abre, pulsa el botón de Bold. Al terminar vuelves aquí para enviar el pedido por WhatsApp.",
      boldHome:"Con Bold pagas ahora los productos. El domicilio se paga aparte al recibir (te confirmamos el valor por WhatsApp).",boldHint:"Pagas en la pasarela segura de Bold por el valor exacto del pedido. La tienda no ve los datos de tu tarjeta.",
      boldErr:"No pudimos preparar el pago. Intenta de nuevo o elige otra forma de pago.",boldPrice:"Los precios cambiaron. Recarga la página e inténtalo de nuevo.",boldDesc:"Pedido Variedades Delfín",boldBack:"/pago/",name:"Nombre",noname:"(sin nombre)",del:"Entrega",pay:"Pago",note:"Nota",
      errName:"Escribe tu nombre para enviar el pedido.",errDir:"Escribe la dirección para el domicilio.",
      ship:{pickup:"Recoges en Calle 63 #61-23, BellaVista, Bello, todos los días de 9 a.m. a 8 p.m. Te avisamos por WhatsApp cuando esté listo.",
            home:"El valor del domicilio depende de la zona y la hora y se suma al total. Te lo confirmamos por WhatsApp antes de enviar.",
            app:"Tú pides el servicio en DiDi Moto u otra app y pagas su tarifa directamente. Te avisamos cuando el pedido esté listo para recoger."},
      locale:"es-CO"},
  en:{all:"All",flash:"Flash deals",add:"Add",inCart:n=>`In order (${n})`,addMore:n=>`In order (${n}) · add another`,addLong:"Add to order",photos:"photos",photoN:(i,n)=>`Photo ${i} of ${n}`,videoN:i=>`Video ${i}`,detail:"See details",see:"See details of",
      catFlash:"Flash deal · ",confirm:"We confirm stock and colours on WhatsApp.",each:"each",less:"Remove one",more:"Add one",
      hello:"Hi Variedades Delfín, I'd like to place this order:",proof:"📎 Payment receipt attached for bank verification.",proofHint:"Pay first and attach the screenshot or receipt here. It is required to send the order: we verify it with the bank and confirm dispatch.",errProof:"Attach the payment receipt (photo or PDF) to send the order.",errBig:"The file is larger than 10 MB. Please send a lighter screenshot.",shareTip:"Choose WhatsApp and the Variedades Delfín chat (+57 310 379 0554). The receipt goes with the order.",manual:"Your device can't attach from the web: the chat will open with your order; attach the receipt there with the 📎 clip before sending.",tot:"Products total",
      boldPay:"Continue to PSE or card payment",boldWait:"Opening the secure Bold checkout…",boldReady:"Taking you to Bold to pay with PSE or card. If it doesn't open, tap the Bold button. You'll come back here to send your order on WhatsApp.",
      boldHome:"With Bold you pay for the products now. Delivery is paid separately on arrival (we confirm the cost on WhatsApp).",boldHint:"You pay on Bold's secure checkout for the exact order amount. The store never sees your card details.",
      boldErr:"We couldn't prepare the payment. Try again or choose another payment method.",boldPrice:"Prices have changed. Reload the page and try again.",boldDesc:"Variedades Delfin order",boldBack:"/en/payment/",name:"Name",noname:"(no name)",del:"Delivery",pay:"Payment",note:"Note",
      errName:"Please enter your name to send the order.",errDir:"Please enter the delivery address.",
      ship:{pickup:"Pick up at Calle 63 #61-23, BellaVista, Bello, every day 9 a.m.–8 p.m. We'll message you on WhatsApp when it's ready.",
            home:"Delivery cost depends on the area and time and is added to the total. We confirm it on WhatsApp before sending.",
            app:"You book DiDi Moto or another app and pay its fare directly. We'll let you know when your order is ready for pickup."},
      locale:"es-CO"}
}[L];

const GIFT = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="26" width="44" height="30" rx="3" fill="#c2332b"/><rect x="7" y="18" width="50" height="10" rx="3" fill="#a52a23"/><rect x="29" y="18" width="6" height="38" fill="#e3a72f"/><path d="M32 18c-6-10-16-8-12-2 2 3 12 2 12 2zm0 0c6-10 16-8 12-2-2 3-12 2-12 2z" fill="#e3a72f"/></svg>';
const $ = id => document.getElementById(id);
const fmt = n => "$" + n.toLocaleString("es-CO");
const esc = t => String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
const N = p => p.n[L], D = p => p.d[L];
const priceHTML = p => p.antes ? `<span class="price"><s class="was"><span class="sr">${L==="en"?"Before":"Antes"} </span>${fmt(p.antes)}</s>${fmt(p.p)}</span>` : `<span class="price">${fmt(p.p)}</span>`;
const picHTML = (p, eager) => !p.img ? GIFT : `<img src="${p.img}" alt="${esc(N(p))}" width="400" height="400" ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
// Etiqueta "4 fotos · video" en la tarjeta (igual que scripts/catalogo.py).
const pillHTML = p => { const a=[]; if((p.g||[]).length>1) a.push(`${p.g.length} ${S.photos}`); if((p.v||[]).length) a.push("video"); return a.length?`<span class="nmedia">${a.join(" · ")}</span>`:""; };
// Galería del detalle: fotos y videos que se deslizan con el dedo; miniaturas debajo.
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z"/></svg>';
function galHTML(p){
  const fotos = p.g || (p.img ? [p.img] : []), vids = p.v || [];
  const n = fotos.length + vids.length;
  if(n < 2 && !vids.length) return picHTML(p, true);
  const alt = esc(N(p));
  const slides = fotos.map((u,i)=>`<li class="slide"><img src="${u}" alt="${i?S.photoN(i+1,fotos.length)+" · ":""}${alt}" width="1000" height="1000" ${i?'loading="lazy"':'fetchpriority="high"'} decoding="async"></li>`)
    .concat(vids.map((v,i)=>`<li class="slide"><video controls playsinline preload="none"${v.poster?` poster="${v.poster}"`:""} aria-label="${S.videoN(i+1)} · ${alt}"><source src="${v.src}" type="video/mp4"></video></li>`));
  const thumbs = fotos.map((u,i)=>`<button type="button" data-i="${i}" aria-label="${S.photoN(i+1,fotos.length)}"><img src="${u.replace(/-g\.webp$/,".webp")}" alt="" loading="lazy" decoding="async"></button>`)
    .concat(vids.map((v,i)=>`<button type="button" data-i="${fotos.length+i}" aria-label="${S.videoN(i+1)}">${v.poster?`<img src="${v.poster}" alt="" loading="lazy" decoding="async">`:""}<span class="play">${PLAY}</span></button>`));
  return `<ul class="gal" id="gal">${slides.join("")}</ul><div class="thumbs" id="thumbs">${thumbs.join("")}</div>`;
}
let galId = null, galObs = null;
function galSetup(){
  const g = $("gal"), t = $("thumbs"); if(!g) return;
  const marcar = i => t.querySelectorAll("button").forEach((b,k)=>b.setAttribute("aria-current", k===i ? "true" : "false"));
  marcar(0);
  t.onclick = e => { const b=e.target.closest("button"); if(!b) return;
    const slide = g.children[+b.dataset.i];
    g.scrollTo({left: slide.offsetLeft, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"}); };
  if(galObs) galObs.disconnect();
  if("IntersectionObserver" in window){
    galObs = new IntersectionObserver(es => es.forEach(en => {
      const i = [...g.children].indexOf(en.target);
      if(en.isIntersecting && en.intersectionRatio > .6) marcar(i);
      else { const v = en.target.querySelector("video"); if(v && !v.paused) v.pause(); }  // video fuera de vista: pausa
    }), {root: g, threshold: [0, .6]});
    [...g.children].forEach(li => galObs.observe(li));
  }
}
const galStop = () => document.querySelectorAll("#gal video").forEach(v => v.pause());

let cart = {};
try { cart = JSON.parse(localStorage.getItem("delfin-cart") || "{}") || {}; } catch(e) {}
const save = () => { try { localStorage.setItem("delfin-cart", JSON.stringify(cart)); } catch(e) {} };
const cats = ["all",...(PRODUCTS.some(p=>p.flash)?["flash"]:[]),...new Set(PRODUCTS.map(p=>p.c))];
let cat = "all";
const catLabel = c => c==="all"?S.all : c==="flash"?S.flash : (CAT[c]||{})[L];

function renderFilters(){ $("filters").innerHTML = cats.map(c=>`<button type="button" aria-pressed="${c===cat}" data-c="${c}">${catLabel(c)}</button>`).join(""); }
function renderGrid(){
  $("grid").innerHTML = PRODUCTS.filter(p => cat==="all" || p.c===cat || (cat==="flash" && p.flash)).map((p,i) => `
    <article class="card">
      <button type="button" class="pic" data-detail="${p.id}" aria-label="${S.see} ${esc(N(p))}">${p.antes?`<span class="tag">Flash −${pct(p)}%</span>`:""}${picHTML(p, i<2)}${pillHTML(p)}</button>
      <div class="info"><h3><button type="button" data-detail="${p.id}">${esc(N(p))}</button></h3><p>${esc(D(p))}</p>
        <button type="button" class="more" data-detail="${p.id}">${S.detail}</button>
        <div class="row">${priceHTML(p)}<button type="button" class="add${cart[p.id]?" done":""}" data-id="${p.id}">${cart[p.id]?S.inCart(cart[p.id]):S.add}</button></div>
      </div>
    </article>`).join("");
}
function openDetail(id){
  const p = PRODUCTS.find(x=>x.id==id); if(!p) return;
  if(galId !== p.id || !$("detail").open){ galStop(); $("dpic").innerHTML = galHTML(p); $("dpic").classList.toggle("multi", !!$("gal")); galId = p.id; galSetup(); }
  $("dbody").innerHTML = `<span class="cat">${p.antes?S.catFlash:""}${(CAT[p.c]||{})[L]}</span><h3 id="dtitle">${esc(N(p))}</h3><p class="hint" style="font-size:15px">${esc(D(p))}</p>
    <ul>${p.f[L].map(t=>`<li>${esc(t)}</li>`).join("")}</ul>${priceHTML(p)}
    <button type="button" class="add${cart[p.id]?" done":""}" data-id="${p.id}" style="padding:12px 16px;font-size:16px">${cart[p.id]?S.addMore(cart[p.id]):S.addLong}</button>
    <p class="hint">${S.confirm}</p>`;
  const d=$("detail"); if(!d.open){ try{ d.showModal(); }catch(e){ d.setAttribute("open",""); } }
}
function renderCart(){
  const items = Object.entries(cart).filter(([id,q])=>q>0 && PRODUCTS.some(p=>p.id==id)).map(([id,q])=>({...PRODUCTS.find(p=>p.id==id),q}));
  const total = items.reduce((s,it)=>s+it.p*it.q,0);
  $("count").textContent = items.reduce((s,it)=>s+it.q,0);
  $("empty").hidden = items.length>0; $("totalrow").hidden = !items.length; $("total").textContent = fmt(total);
  $("lines").innerHTML = items.map(it=>`<li><span class="n">${esc(N(it))}</span><span class="s">${fmt(it.p*it.q)}</span>
    <span class="qty"><button type="button" data-d="-1" data-id="${it.id}" aria-label="${S.less}">−</button>${it.q}<button type="button" data-d="1" data-id="${it.id}" aria-label="${S.more}">+</button> · ${fmt(it.p)} ${S.each}</span></li>`).join("");
  const sel=$("entrega"), delivery=sel.value, label=sel.options[sel.selectedIndex].dataset.msg||delivery;
  $("dirwrap").hidden = delivery!=="home";
  $("linkhint").hidden = $("pago").value!=="link";
  const isBold = $("pago").value==="bold";
  if (BOLD_FIRMA) {
    $("boldhint").hidden = !isBold; $("boldhint").textContent = delivery==="home" ? S.boldHome : S.boldHint;
    const key = isBold ? JSON.stringify(items.map(it=>[it.id,it.q])) : "";
    if (key !== boldKey) { boldKey = key; resetBold(); }
    sendLabel.textContent = isBold ? S.boldPay : sendText;
  }
  const needsProof = ["nequi","davi","bank"].includes($("pago").value);
  $("proofhint").hidden = !needsProof; $("proofhint").textContent = S.proofHint; $("compwrap").hidden = !needsProof;
  $("shiphint").textContent = S.ship[delivery];
  const send=$("send"); send.setAttribute("aria-disabled", items.length?"false":"true");
  const payLabel = $("pago").options[$("pago").selectedIndex].text;
  const msg = [S.hello,"",...items.map(it=>`• ${it.q} x ${N(it)} — ${fmt(it.p*it.q)}`),"",`${S.tot}: ${fmt(total)}`,
    `${S.name}: ${$("nombre").value||S.noname}`,`${S.del}: ${label}${delivery==="home"&&$("dir").value?" — "+$("dir").value:""}`,
    `${S.pay}: ${payLabel}`, $("nota").value?`${S.note}: ${$("nota").value}`:"", needsProof?"":null, needsProof?S.proof:null].filter(l=>l!==null).filter((l,i,a)=>l!==""||a[i-1]!=="").join("\n");
  send.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`; lastMsg = msg;
}
let lastMsg = "";

// ---- Bold: el Worker recalcula el total y firma; aquí solo se pinta el botón oficial de Bold.
let boldKey = "", boldRun = 0, sendLabel = null, sendText = "";
function resetBold(){ boldRun++; const b=$("boldbox"); if(b){ b.hidden=true; b.textContent=""; } }
async function startBold(){
  const run = ++boldRun, box = $("boldbox");
  const items = {}; let total = 0;
  Object.entries(cart).forEach(([id,q])=>{ const p=PRODUCTS.find(x=>x.id==id); if(p&&q>0){ items[id]=q; total+=p.p*q; } });
  box.hidden=false; box.innerHTML=`<p class="hint">${S.boldWait}</p>`;
  let r;
  try {
    const res = await fetch(BOLD_FIRMA,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items,amount:total})});
    r = await res.json().catch(()=>({}));
    if (res.status===409) throw new Error("precio");
    if (!res.ok || !r.signature) throw new Error("firma");
  } catch(x) { if(run===boldRun){ box.innerHTML=`<p class="err" role="alert">${x.message==="precio"?S.boldPrice:S.boldErr}</p>`; } return; }
  if (run!==boldRun) return;
  const name = $("nombre").value.trim();
  try { localStorage.setItem("delfin-bold", JSON.stringify({orderId:r.orderId,amount:r.amount,msg:lastMsg,lang:L,t:Date.now()})); } catch(e) {}
  box.innerHTML = `<p class="hint">${S.boldReady}</p>`;
  const btn = document.createElement("script");
  const attrs = {"data-bold-button":"light-L","data-api-key":r.apiKey,"data-order-id":r.orderId,"data-currency":r.currency,"data-amount":String(r.amount),
    "data-integrity-signature":r.signature,"data-description":`${S.boldDesc} ${r.orderId}`.slice(0,100),
    "data-redirection-url":location.origin+S.boldBack,"data-origin-url":location.origin+location.pathname};
  if (name) attrs["data-customer-data"] = JSON.stringify({fullName:name.slice(0,60)});
  Object.entries(attrs).forEach(([k,v])=>btn.setAttribute(k,v));
  box.appendChild(btn);
  // La librería de Bold convierte los <script data-bold-button> que ya están en la página; se carga después del botón.
  document.querySelectorAll("script[data-bold-lib]").forEach(x=>x.remove());
  const lib = document.createElement("script");
  lib.src = "https://checkout.bold.co/library/boldPaymentButton.js" + (run>1 ? "?r="+run : ""); lib.dataset.boldLib = "";
  lib.onerror = () => { if(run===boldRun) box.innerHTML=`<p class="err" role="alert">${S.boldErr}</p>`; };
  document.head.appendChild(lib);
  // Abre la pasarela sin un segundo clic: cuando Bold pinta su botón, lo pulsamos. Si no se puede, queda visible para pulsarlo.
  const t0 = Date.now();
  (function abrir(){
    if (run!==boldRun) return;
    const el = box.querySelector("bold-payment-button"), bt = el && el.shadowRoot && el.shadowRoot.querySelector("button");
    if (bt) { box.scrollIntoView({block:"center",behavior:"smooth"}); bt.click(); return; }
    if (Date.now()-t0 < 8000) setTimeout(abrir, 150); else box.scrollIntoView({block:"center"});
  })();
  window.dataLayer&&dataLayer.push({event:"begin_checkout",payment_type:"bold",value:r.amount,currency:"COP"});
}
if (BOLD_FIRMA) {
  const sel = $("pago"), o = new Option(L==="en"?"PSE or card with Bold (pay now)":"PSE o tarjeta con Bold (pago inmediato)","bold");
  sel.insertBefore(o, sel.firstChild); sel.value = "bold";
  const lk = sel.querySelector('option[value="link"]'); if (lk) lk.text = L==="en" ? "Payment link on WhatsApp (delivery included)" : "Link de pago por WhatsApp (con domicilio)";
  const send = $("send");
  sendLabel = [...send.childNodes].reverse().find(n=>n.nodeType===3); sendText = sendLabel.textContent;
  const hint = document.createElement("p"); hint.className="hint"; hint.id="boldhint"; hint.hidden=true;
  $("linkhint").before(hint);
  const box = document.createElement("div"); box.id="boldbox"; box.className="boldbox"; box.hidden=true; box.setAttribute("aria-live","polite");
  send.after(box);
}
function bump(id){ cart[id]=(cart[id]||0)+1; save(); renderGrid(); renderCart(); window.dataLayer&&dataLayer.push({event:"add_to_cart",item_id:String(id)}); }

$("filters").addEventListener("click",e=>{const b=e.target.closest("button"); if(!b) return; cat=b.dataset.c; renderFilters(); renderGrid();});
$("grid").addEventListener("click",e=>{const t=e.target.closest("[data-detail]"); if(t){openDetail(t.dataset.detail);return;} const b=e.target.closest(".add"); if(b) bump(b.dataset.id);});
$("lines").addEventListener("click",e=>{const b=e.target.closest("button[data-d]"); if(!b) return; const id=b.dataset.id; cart[id]=Math.max(0,(cart[id]||0)+Number(b.dataset.d)); if(!cart[id]) delete cart[id]; save(); renderGrid(); renderCart();});
["nombre","entrega","dir","pago","nota"].forEach(id=>$(id).addEventListener("input",renderCart));
$("comp").addEventListener("change",()=>{$("err").hidden=true;});
$("form").addEventListener("submit",e=>e.preventDefault());
$("send").addEventListener("click",e=>{
  const noName=!$("nombre").value.trim(), needsDir=$("entrega").value==="home"&&!$("dir").value.trim();
  if(noName||needsDir){ e.preventDefault(); $("err").textContent=noName?S.errName:S.errDir; $("err").hidden=false; (noName?$("nombre"):$("dir")).focus(); return; }
  const needsProof=["nequi","davi","bank"].includes($("pago").value), f=$("comp").files[0];
  const fail=t=>{ e.preventDefault(); $("err").textContent=t; $("err").hidden=false; $("comp").focus(); };
  if(needsProof && !f) return fail(S.errProof);
  if(needsProof && f.size>10*1024*1024) return fail(S.errBig);
  if($("pago").value==="bold"){ e.preventDefault(); $("err").hidden=true; startBold(); return; }
  $("err").hidden=true; window.dataLayer&&dataLayer.push({event:"order_whatsapp",with_receipt:needsProof});
  if(needsProof){
    if(navigator.canShare && navigator.canShare({files:[f]})){
      e.preventDefault();
      $("proofhint").textContent=S.shareTip;
      navigator.share({files:[f],text:lastMsg}).catch(()=>{});
    } else { $("proofhint").textContent=S.manual; }
  }
});
$("dclose").addEventListener("click",()=>$("detail").close());
$("detail").addEventListener("close",()=>{ galStop(); galId = null; });
$("detail").addEventListener("click",e=>{ if(e.target.id==="detail"){ $("detail").close(); return; } const b=e.target.closest(".add"); if(b){ bump(b.dataset.id); openDetail(b.dataset.id); } });
renderFilters(); renderGrid(); renderCart();
