// Página de regreso de Bold: muestra el estado y arma el mensaje de WhatsApp con la referencia del pago.
// El estado que llega en la URL es informativo: la tienda confirma el pago en el panel de Bold antes de despachar.
(function(){
  const WHATSAPP = "573103790554", L = document.documentElement.lang === "en" ? "en" : "es";
  const T = {
    es:{ok:["¡Pago aprobado!","Gracias. Ahora envíanos el pedido por WhatsApp para coordinar la entrega."],
        wait:["Pago en proceso","Bold aún está confirmando tu pago. Envíanos el pedido por WhatsApp y te avisamos apenas se apruebe."],
        no:["El pago no se completó","No se hizo ningún cobro. Puedes intentarlo de nuevo o elegir otra forma de pago."],
        none:["Resultado del pago","No encontramos información del pago. Si pagaste, escríbenos por WhatsApp con la referencia de Bold."],
        ref:"Referencia Bold",paid:"✅ Pagado con Bold (PSE o tarjeta). Referencia",pend:"⏳ Pago con Bold en proceso. Referencia",
        retry:"Intentar de nuevo",hello:"Hola Variedades Delfín, hice un pago con Bold."},
    en:{ok:["Payment approved!","Thank you. Now send us your order on WhatsApp to arrange delivery."],
        wait:["Payment processing","Bold is still confirming your payment. Send us your order on WhatsApp and we'll let you know once it's approved."],
        no:["Payment not completed","You were not charged. You can try again or choose another payment method."],
        none:["Payment result","We couldn't find payment details. If you paid, message us on WhatsApp with your Bold reference."],
        ref:"Bold reference",paid:"✅ Paid with Bold (PSE or card). Reference",pend:"⏳ Bold payment processing. Reference",
        retry:"Try again",hello:"Hi Variedades Delfín, I made a payment with Bold."}
  }[L];
  const $ = id => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  const ref = (q.get("bold-order-id") || "").replace(/[^\w-]/g, "").slice(0, 60);
  const st = (q.get("bold-tx-status") || "").toLowerCase();
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem("delfin-bold") || "null"); } catch(e) {}
  if (saved && ref && saved.orderId !== ref) saved = null;

  const kind = !ref ? "none" : st === "approved" ? "ok" : (st === "rejected" || st === "failed") ? "no" : "wait";
  $("ptitle").textContent = T[kind][0]; $("pmsg").textContent = T[kind][1];
  if (ref) { $("pref").hidden = false; $("pref").textContent = `${T.ref}: ${ref}${saved ? " · $" + Number(saved.amount).toLocaleString("es-CO") : ""}`; }

  if (kind === "ok" || kind === "wait" || kind === "none") {
    const line = ref ? `${kind === "ok" ? T.paid : T.pend}: ${ref}` : "";
    const msg = saved ? `${String(saved.msg).trim()}\n\n${line}` : [T.hello, line].filter(Boolean).join("\n");
    $("pwa").href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`; $("pwa").hidden = false;
  }
  if (kind === "no") $("pback").textContent = T.retry;
  if (kind === "ok") { try { localStorage.removeItem("delfin-cart"); } catch(e) {} }
  if (ref && (kind === "ok" || kind === "no")) {
    $("pwa").addEventListener("click", () => { try { localStorage.removeItem("delfin-bold"); } catch(e) {} });
  }
  window.dataLayer && dataLayer.push({event: "bold_payment_result", status: st || "none", transaction_id: ref, value: saved ? saved.amount : undefined, currency: "COP"});
})();
