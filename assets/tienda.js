// Catálogo y pedido por WhatsApp. Precio = costo ÷ 0,6 redondeado arriba a $100 (costos fuera de la web, en costos.csv).
const WHATSAPP = "573103790554";
const DCTO_FLASH = 0.20;
const L = document.documentElement.lang === "en" ? "en" : "es";

const CAT = {
  tech:{es:"Tecnología",en:"Electronics"}, tools:{es:"Herramientas",en:"Tools"},
  home:{es:"Hogar y cocina",en:"Home & kitchen"}, toys:{es:"Juguetes",en:"Toys"}, care:{es:"Cuidado personal",en:"Personal care"}
};
const TV_F = {es:["Smart TV con Whale TV: Netflix, YouTube, Prime Video y más","Conexión Bluetooth con dispositivos externos","Entrada USB y HDMI","Sonido Hi-Fi","Doble control universal","Modelo 2026"],
              en:["Smart TV with Whale TV: Netflix, YouTube, Prime Video and more","Bluetooth connection to external devices","USB and HDMI inputs","Hi-Fi sound","Two universal remotes","2026 model"]};
const TV_D = {es:"Whale TV con Netflix, YouTube y más. Bluetooth, USB, HDMI, sonido Hi-Fi y doble control universal.",
              en:"Whale TV with Netflix, YouTube and more. Bluetooth, USB, HDMI, Hi-Fi sound and two universal remotes."};
const PRODUCTS = [
 {id:105,c:"tech",p:833400,img:"tv",n:{es:'Smart TV 32" HD Premium Gold',en:'32" HD Smart TV Premium Gold'},d:TV_D,f:TV_F},
 {id:106,c:"tech",p:1333400,img:"tv",n:{es:'Smart TV 40" Full HD Premium Gold',en:'40" Full HD Smart TV Premium Gold'},d:TV_D,f:TV_F},
 {id:107,c:"tech",p:1475000,img:"tv",n:{es:'Smart TV 43" Full HD Premium Gold',en:'43" Full HD Smart TV Premium Gold'},d:TV_D,f:TV_F},
 {id:108,c:"tech",p:366700,img:"tablet",n:{es:"Tablet infantil Nodizz NPAD702",en:"Nodizz NPAD702 kids tablet"},
  d:{es:'Pantalla de 7", 2 GB RAM, 32 GB, Android 13, Wi-Fi, control parental y forro protector. Incluye accesorios.',en:'7" screen, 2 GB RAM, 32 GB, Android 13, Wi-Fi, parental controls and protective case. Accessories included.'},
  f:{es:["Pantalla de 7 pulgadas","2 GB de RAM y 32 GB de almacenamiento","Android 13 y Wi-Fi","Cámara frontal y trasera","Apps y juegos infantiles","Control parental","Forro protector con soporte","Incluye pistola de juguete, lápiz táctil, stickers, regla y correa"],
     en:["7-inch screen","2 GB RAM and 32 GB storage","Android 13 and Wi-Fi","Front and rear camera","Kids' apps and games","Parental controls","Protective case with stand","Includes toy gun, stylus, stickers, ruler and strap"]}},
 {id:109,c:"tech",p:200000,img:"parlante",n:{es:"Parlante Booms Box 3",en:"Booms Box 3 speaker"},
  d:{es:"Bluetooth, USB y micro SD, doble bajo, resistente a salpicaduras, batería de larga duración.",en:"Bluetooth, USB and micro SD, dual bass, splash resistant, long-lasting battery."},
  f:{es:["Conexión Bluetooth","Entrada USB y micro SD","Doble bajo incorporado","Panel de control de volumen y música","Resistente a salpicaduras","Batería recargable de larga duración"],
     en:["Bluetooth connection","USB and micro SD input","Built-in dual bass","Volume and music controls","Splash resistant","Long-lasting rechargeable battery"]}},
 {id:110,c:"tools",p:200000,img:"kit",n:{es:"Kit de herramientas multifuncional",en:"Multi-purpose tool kit"},
  d:{es:"Taladro inalámbrico con baterías, martillo, alicates, llave ajustable, destornilladores, brocas y más, en estuche.",en:"Cordless drill with batteries, hammer, pliers, adjustable wrench, screwdrivers, drill bits and more, in a case."},
  f:{es:["Taladro inalámbrico con baterías","Martillo, alicates y llave ajustable","Destornilladores, brocas, puntas y copas","Cinta métrica, serrucho y probador de corriente","Tornillos y tacos","Estuche resistente y organizado"],
     en:["Cordless drill with batteries","Hammer, pliers and adjustable wrench","Screwdrivers, drill bits, tips and sockets","Tape measure, saw and voltage tester","Screws and wall plugs","Sturdy, organised case"]}},
 {id:111,c:"tools",p:80000,img:"hidrolavadora",n:{es:"Hidrolavadora portátil doble batería 48V",en:"Portable 48V pressure washer, two batteries"},
  d:{es:"Dos baterías recargables, cargador, manguera de extensión, boquillas y maleta.",en:"Two rechargeable batteries, charger, extension hose, nozzles and carry case."},
  f:{es:["Dos baterías recargables de 48 V","Cargador de baterías","Manguera de extensión","Boquillas y accesorios","Uso portátil, sin conexión a la llave","Maleta de guardado"],
     en:["Two 48 V rechargeable batteries","Battery charger","Extension hose","Nozzles and accessories","Portable, no tap connection needed","Storage case"]}},
 {id:112,c:"tools",p:146700,img:"pulidora",n:{es:"Pulidora inalámbrica Thwjiang",en:"Thwjiang cordless angle grinder"},
  d:{es:'Batería extraíble, discos de corte de 3", cargador y maletín. Para metal, madera y más.',en:'Removable battery, 3" cutting discs, charger and case. For metal, wood and more.'},
  f:{es:["Inalámbrica, con batería extraíble","Discos de corte de 3 pulgadas incluidos","Cargador incluido","Maletín de transporte","Mango ergonómico y protector de disco","Para metal, madera y otros materiales"],
     en:["Cordless, removable battery","3-inch cutting discs included","Charger included","Carry case","Ergonomic handle and disc guard","For metal, wood and other materials"]}},
 {id:113,c:"home",p:150000,img:"cafetera",n:{es:"Cafetera Sokany 6 tazas",en:"Sokany 6-cup coffee maker"},
  d:{es:"750 ml, 650 W, jarra de vidrio, programable y temperatura constante.",en:"750 ml, 650 W, glass carafe, programmable, keeps coffee warm."},
  f:{es:["Capacidad de 750 ml, 6 tazas","Potencia de 650 W","Jarra de vidrio","Función de programación","Temperatura constante","Fácil de usar"],
     en:["750 ml capacity, 6 cups","650 W","Glass carafe","Programmable","Keeps a constant temperature","Easy to use"]}},
 {id:114,c:"home",p:33400,img:"balanza",n:{es:"Balanza digital de cocina Hoklee",en:"Hoklee digital kitchen scale"},
  d:{es:"Hasta 10 kg con precisión de 1 g, pantalla LCD y función tara. Funciona con 2 pilas AAA.",en:"Up to 10 kg with 1 g precision, LCD display and tare function. Runs on 2 AAA batteries."},
  f:{es:["Capacidad máxima de 10 kg","Precisión de 1 g","Pantalla LCD de fácil lectura","Función tara para descontar el recipiente","Funciona con 2 pilas AAA","Diseño delgado y fácil de limpiar"],
     en:["10 kg maximum capacity","1 g precision","Easy-to-read LCD display","Tare function","Runs on 2 AAA batteries","Slim, easy-to-clean design"]}},
 {id:115,c:"home",p:16700,img:"hidrogel",n:{es:"Bolas de hidrogel decorativas",en:"Decorative water beads"},
  d:{es:"Crecen al hidratarse. Para floreros, centros de mesa y manualidades. Varios colores.",en:"They grow in water. For vases, centrepieces and crafts. Assorted colours."},
  f:{es:["Bolitas que absorben agua y crecen","Para floreros, centros de mesa y manualidades","Varios colores disponibles","Fáciles de usar"],
     en:["Beads absorb water and grow","For vases, centrepieces and crafts","Assorted colours","Easy to use"]}},
 {id:101,c:"toys",p:2166700,img:"moto",n:{es:"Moto eléctrica infantil 36V 800W",en:"Kids' electric motorbike 36V 800W"},
  d:{es:"Hasta 20 km/h con selector de velocidad, batería 12Ah (unos 15 km por carga), frenos de disco y amortiguación. Soporta 80 kg. 4 colores.",en:"Up to 20 km/h with speed selector, 12Ah battery (about 15 km per charge), disc brakes and suspension. Holds 80 kg. 4 colours."},
  f:{es:["Motor de 36 V y 800 W","Velocidad máxima de 20 km/h, con selector de 3 velocidades para principiantes","Batería de 36 V 12 Ah, hasta 15 km por carga","Carga completa en unas 4,5 horas","Soporta hasta 80 kg","Rines 2.5-10, frenos de disco mecánicos y amortiguación","Disponible en 4 colores"],
     en:["36 V, 800 W motor","Top speed 20 km/h, 3-speed selector for beginners","36 V 12 Ah battery, up to 15 km per charge","Full charge in about 4.5 hours","Holds up to 80 kg","2.5-10 rims, mechanical disc brakes and suspension","Available in 4 colours"]}},
 {id:102,c:"toys",p:150000,icon:true,n:{es:"Rifle eléctrico de bolas de gel",en:"Electric gel blaster"},
  d:{es:"Batería de litio 7,4 V, negro y rojo, con accesorios. Para mayores de 14 años.",en:"7.4 V lithium battery, black and red, with accessories. Ages 14+."},
  f:{es:["Funcionamiento eléctrico","Dispara bolas de gel","Batería de litio de 7,4 V","Diseño en negro y rojo","Incluye accesorios","Recomendado para mayores de 14 años"],
     en:["Electric operation","Shoots gel beads","7.4 V lithium battery","Black and red design","Accessories included","Recommended for ages 14+"]}},
 {id:103,c:"care",p:46700,img:"vgr",n:{es:"Máquina para cortar cabello VGR V-052",en:"VGR V-052 hair clipper"},
  d:{es:"Cuchillas de acero, ajuste de longitud, batería recargable, uso con o sin cable USB. Incluye 4 peines guía.",en:"Steel blades, length adjustment, rechargeable battery, corded (USB) or cordless. 4 guide combs included."},
  f:{es:["Cuchillas de acero inoxidable para un corte preciso","Ajuste de longitud para diferentes estilos","Batería recargable","Uso con cable USB o inalámbrico","Diseño ergonómico","Incluye cable USB, cepillo de limpieza, aceite lubricante y 4 peines guía"],
     en:["Stainless steel blades for a precise cut","Length adjustment for different styles","Rechargeable battery","Corded (USB) or cordless","Ergonomic design","Includes USB cable, cleaning brush, oil and 4 guide combs"]}},
 {id:104,c:"toys",p:37500,img:"sup",n:{es:"Consola SUP Mini 400 juegos",en:"SUP Mini console, 400 games"},
  d:{es:'Pantalla de 3", modo 2 jugadores con control incluido, batería recargable y cable para TV.',en:'3" screen, 2-player mode with extra controller, rechargeable battery and TV cable.'},
  f:{es:["Pantalla LED de 3 pulgadas","400 juegos clásicos","Modo para 2 jugadores, incluye control","Batería recargable","Se conecta al TV, incluye cable AV y cable de carga","Compacta y fácil de llevar"],
     en:["3-inch LED screen","400 classic games","2-player mode, controller included","Rechargeable battery","Connects to the TV, AV and charging cables included","Compact and portable"]}}
];
PRODUCTS.forEach(p => { p.flash = true; if (DCTO_FLASH) { p.antes = p.p; p.p = Math.ceil(p.p*(1-DCTO_FLASH)/100)*100; } });

const S = {
  es:{all:"Todo",flash:"Ofertas flash",add:"Agregar",inCart:n=>`En pedido (${n})`,addMore:n=>`En pedido (${n}) · agregar otro`,addLong:"Agregar al pedido",detail:"Ver detalle",see:"Ver detalle de",
      tag:`Flash −${Math.round(DCTO_FLASH*100)}%`,catFlash:"Oferta flash · ",confirm:"Confirmamos disponibilidad y colores por WhatsApp.",each:"c/u",less:"Quitar uno",more:"Agregar uno",
      hello:"Hola Variedades Delfín, quiero hacer este pedido:",proof:"📎 Adjunto el comprobante de pago para validarlo con el banco.",proofHint:"Paga primero y adjunta aquí el pantallazo o comprobante. Es obligatorio para enviar el pedido: lo verificamos con el banco y te confirmamos el despacho.",errProof:"Adjunta el comprobante de pago (foto o PDF) para enviar el pedido.",errBig:"El archivo pesa más de 10 MB. Envía un pantallazo más liviano.",shareTip:"Elige WhatsApp y el chat de Variedades Delfín (310 379 0554). El comprobante va junto al pedido.",manual:"Tu dispositivo no permite adjuntar desde la web: se abrirá el chat con el pedido; adjunta ahí el comprobante con el clip 📎 antes de enviar.",tot:"Total productos",name:"Nombre",noname:"(sin nombre)",del:"Entrega",pay:"Pago",note:"Nota",
      errName:"Escribe tu nombre para enviar el pedido.",errDir:"Escribe la dirección para el domicilio.",
      ship:{pickup:"Recoges en Calle 63 #61-23, BellaVista, Bello, todos los días de 9 a.m. a 8 p.m. Te avisamos por WhatsApp cuando esté listo.",
            home:"El valor del domicilio depende de la zona y la hora y se suma al total. Te lo confirmamos por WhatsApp antes de enviar.",
            app:"Tú pides el servicio en DiDi Moto u otra app y pagas su tarifa directamente. Te avisamos cuando el pedido esté listo para recoger."},
      locale:"es-CO"},
  en:{all:"All",flash:"Flash deals",add:"Add",inCart:n=>`In order (${n})`,addMore:n=>`In order (${n}) · add another`,addLong:"Add to order",detail:"See details",see:"See details of",
      tag:`Flash −${Math.round(DCTO_FLASH*100)}%`,catFlash:"Flash deal · ",confirm:"We confirm stock and colours on WhatsApp.",each:"each",less:"Remove one",more:"Add one",
      hello:"Hi Variedades Delfín, I'd like to place this order:",proof:"📎 Payment receipt attached for bank verification.",proofHint:"Pay first and attach the screenshot or receipt here. It is required to send the order: we verify it with the bank and confirm dispatch.",errProof:"Attach the payment receipt (photo or PDF) to send the order.",errBig:"The file is larger than 10 MB. Please send a lighter screenshot.",shareTip:"Choose WhatsApp and the Variedades Delfín chat (+57 310 379 0554). The receipt goes with the order.",manual:"Your device can't attach from the web: the chat will open with your order; attach the receipt there with the 📎 clip before sending.",tot:"Products total",name:"Name",noname:"(no name)",del:"Delivery",pay:"Payment",note:"Note",
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
const picHTML = (p, eager) => p.icon ? GIFT : `<img src="/img/${p.img}.webp" alt="${esc(N(p))}" width="400" height="400" ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;

let cart = {};
try { cart = JSON.parse(localStorage.getItem("delfin-cart") || "{}") || {}; } catch(e) {}
const save = () => { try { localStorage.setItem("delfin-cart", JSON.stringify(cart)); } catch(e) {} };
const cats = ["all","flash",...new Set(PRODUCTS.map(p=>p.c))];
let cat = "all";
const catLabel = c => c==="all"?S.all : c==="flash"?S.flash : CAT[c][L];

function renderFilters(){ $("filters").innerHTML = cats.map(c=>`<button type="button" aria-pressed="${c===cat}" data-c="${c}">${catLabel(c)}</button>`).join(""); }
function renderGrid(){
  $("grid").innerHTML = PRODUCTS.filter(p => cat==="all" || p.c===cat || (cat==="flash" && p.flash)).map((p,i) => `
    <article class="card">
      <button type="button" class="pic" data-detail="${p.id}" aria-label="${S.see} ${esc(N(p))}">${p.antes?`<span class="tag">${S.tag}</span>`:""}${picHTML(p, i<2)}</button>
      <div class="info"><h3><button type="button" data-detail="${p.id}">${esc(N(p))}</button></h3><p>${esc(D(p))}</p>
        <button type="button" class="more" data-detail="${p.id}">${S.detail}</button>
        <div class="row">${priceHTML(p)}<button type="button" class="add${cart[p.id]?" done":""}" data-id="${p.id}">${cart[p.id]?S.inCart(cart[p.id]):S.add}</button></div>
      </div>
    </article>`).join("");
}
function openDetail(id){
  const p = PRODUCTS.find(x=>x.id==id); if(!p) return;
  $("dpic").innerHTML = picHTML(p, true);
  $("dbody").innerHTML = `<span class="cat">${p.antes?S.catFlash:""}${CAT[p.c][L]}</span><h3 id="dtitle">${esc(N(p))}</h3><p class="hint" style="font-size:15px">${esc(D(p))}</p>
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
$("detail").addEventListener("click",e=>{ if(e.target.id==="detail"){ $("detail").close(); return; } const b=e.target.closest(".add"); if(b){ bump(b.dataset.id); openDetail(b.dataset.id); } });
renderFilters(); renderGrid(); renderCart();
