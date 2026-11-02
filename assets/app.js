// Variedades Delfín: banner de cookies, Consent Mode v2, botón WhatsApp y PWA.
(function(){
  var L = document.documentElement.lang === "en" ? "en" : "es";
  var T = {
    es:{msg:'Usamos cookies necesarias para que la tienda funcione y, si lo aceptas, cookies de analítica y marketing para mejorarla. <a href="/politica-de-cookies/">Política de cookies</a>.',
        ok:"Aceptar todas", no:"Solo necesarias", cfg:"Configurar", cfgUrl:"/configurar-cookies/", saved:"Preferencias guardadas."},
    en:{msg:'We use necessary cookies to run the shop and, if you agree, analytics and marketing cookies to improve it. <a href="/en/cookie-policy/">Cookie policy</a>.',
        ok:"Accept all", no:"Necessary only", cfg:"Settings", cfgUrl:"/en/cookie-settings/", saved:"Preferences saved."}
  }[L];

  function read(){ var m=document.cookie.match(/(?:^|; )delfin_consent=([^;]*)/); if(!m) return null; try{return JSON.parse(decodeURIComponent(m[1]));}catch(e){return null;} }
  function write(c){
    c.t = new Date().toISOString().slice(0,10);
    document.cookie = "delfin_consent="+encodeURIComponent(JSON.stringify(c))+"; Max-Age="+(60*60*24*365)+"; Path=/; SameSite=Lax"+(location.protocol==="https:"?"; Secure":"");
    window.gtag && gtag("consent","update",{
      analytics_storage:c.a?"granted":"denied",
      ad_storage:c.m?"granted":"denied", ad_user_data:c.m?"granted":"denied", ad_personalization:c.m?"granted":"denied"});
    window.dataLayer && dataLayer.push({event:"consent_update", consent_analytics:!!c.a, consent_marketing:!!c.m});
  }
  window.DelfinConsent = {read:read, write:write};

  function banner(){
    if (read() || document.getElementById("cookie-settings")) return;
    var d=document.createElement("div"); d.className="cookie"; d.setAttribute("role","dialog"); d.setAttribute("aria-live","polite"); d.setAttribute("aria-label","Cookies");
    d.innerHTML='<p>'+T.msg+'</p><div class="acts"><button type="button" class="ok">'+T.ok+'</button><button type="button" class="no">'+T.no+'</button><a class="cbtn" href="'+T.cfgUrl+'">'+T.cfg+'</a></div>';
    d.querySelector(".ok").onclick=function(){write({a:true,m:true}); d.remove();};
    d.querySelector(".no").onclick=function(){write({a:false,m:false}); d.remove();};
    document.body.appendChild(d);
  }

  // Página "Configurar cookies"
  function settings(){
    var f=document.getElementById("cookie-settings"); if(!f) return;
    var c=read()||{a:false,m:false};
    f.analytics.checked=!!c.a; f.marketing.checked=!!c.m;
    f.addEventListener("submit",function(e){ e.preventDefault(); write({a:f.analytics.checked,m:f.marketing.checked}); var s=document.getElementById("cookie-saved"); s.textContent=T.saved; s.hidden=false; });
    var all=document.getElementById("cookie-all"); all && all.addEventListener("click",function(){ f.analytics.checked=true; f.marketing.checked=true; f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit")); });
  }
  document.querySelectorAll("[data-open-cookies]").forEach(function(b){ b.addEventListener("click",function(){ location.href=T.cfgUrl; }); });

  // Evento de clic en WhatsApp para Analytics (vía GTM)
  document.addEventListener("click",function(e){ var a=e.target.closest && e.target.closest('a[href*="wa.me/"]'); if(a && window.dataLayer) dataLayer.push({event:"whatsapp_click", link_text:(a.textContent||"").trim().slice(0,60)}); });

  banner(); settings();
  if ("serviceWorker" in navigator && location.protocol==="https:") addEventListener("load",function(){ navigator.serviceWorker.register("/sw.js").catch(function(){}); });
})();
