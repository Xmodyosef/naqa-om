/* events, gestures, boot */
function adjustCardQty(id, delta){
  id = +id;
  var it = cart.find(function(i){ return i.id===id; });
  if(delta>0){
    if(!it){ addToCart(id, 1); return; }
    var p = products.find(function(x){ return x.id===id; });
    if(p && p.stock!=null && it.qty>=Number(p.stock)){
      if(typeof toast==="function") toast(T("stockLimit"));
      return;
    }
    it.qty++;
    saveCart(); renderCart();
    try{ if(typeof refreshProductCartUI==="function") refreshProductCartUI(); }catch(err){}
    return;
  }
  if(!it) return;
  it.qty--;
  if(it.qty<=0) cart = cart.filter(function(x){ return x.id!==id; });
  saveCart(); renderCart();
  try{ if(typeof refreshProductCartUI==="function") refreshProductCartUI(); }catch(err){}
}
function onCatalogClick(e){
  const wish=e.target.closest("[data-wish]"); if(wish){ e.preventDefault(); e.stopPropagation(); toggleWish(+wish.dataset.wish); return true; }
  const inc=e.target.closest("[data-inc]"); if(inc){ e.preventDefault(); e.stopPropagation(); adjustCardQty(inc.dataset.inc, 1); return true; }
  const dec=e.target.closest("[data-dec]"); if(dec){ e.preventDefault(); e.stopPropagation(); adjustCardQty(dec.dataset.dec, -1); return true; }
  const add=e.target.closest("[data-add]"); if(add){
    e.preventDefault(); e.stopPropagation();
    var pid = Number(add.dataset.add);
    if(pid) addToCart(pid, 1);
    return true;
  }
  const qv=e.target.closest("[data-qv]"); if(qv){ openSheet(+qv.dataset.qv, "qv"); return true; }
  const open=e.target.closest("[data-open]"); if(open){ openSheet(+open.dataset.open, "full"); return true; }
  return false;
}
$("#grid").addEventListener("click", onCatalogClick);
/* shelves + brand rails + any future catalog islands */
document.addEventListener("click", function(e){
  if(e.target.closest("#shelves") || e.target.closest("#brandsGrid")){
    onCatalogClick(e);
  }
  var jump = e.target.closest && e.target.closest("[data-cat-jump]");
  if(jump && jump.dataset.catJump){
    e.preventDefault();
    currentCat = jump.dataset.catJump;
    currentBrand = "";
    query = "";
    if(typeof wishView !== "undefined") wishView = false;
    var s = $("#search"); if(s) s.value = "";
    document.querySelectorAll("#cats [data-cat]").forEach(function(x){ x.classList.toggle("on", x.dataset.cat === currentCat); });
    try{ history.pushState({naqa:"cat"}, "", "#c/"+encodeURIComponent(currentCat)); }catch(err){}
    if(typeof closeSheet === "function") closeSheet(true);
    render();
    var prod = $("#products"); if(prod) prod.scrollIntoView({behavior:"smooth"});
  }
});
/* capture: reliable Add on cards/shelves (sheet has own handler) */
document.addEventListener("click", function(e){
  var add = e.target.closest && e.target.closest("[data-add]");
  if(!add) return;
  if(e.target.closest && e.target.closest("#sheetCard")) return;
  if(add.getAttribute("data-busy")==="1") return;
  e.preventDefault();
  e.stopPropagation();
  var pid = Number(add.dataset.add);
  if(!pid || typeof addToCart!=="function") return;
  add.setAttribute("data-busy","1");
  try{ addToCart(pid, 1); } finally {
    setTimeout(function(){ try{ add.removeAttribute("data-busy"); }catch(err){} }, 280);
  }
}, true);
$("#cartBody").addEventListener("click", e=>{
  const inc=e.target.closest("[data-inc]"); const dec=e.target.closest("[data-dec]"); const rm=e.target.closest("[data-rm]");
  if(inc){
    const it=cart.find(i=>i.id===+inc.dataset.inc);
    if(it){
      const p=products.find(x=>x.id===it.id);
      if(p && p.stock!=null && it.qty>=Number(p.stock)){
        if(typeof toast==="function") toast(T("stockLimit"));
      } else { it.qty++; saveCart(); renderCart(); try{ if(typeof refreshProductCartUI==="function") refreshProductCartUI(); }catch(e){} }
    }
    return;
  }
  if(dec){ const it=cart.find(i=>i.id===+dec.dataset.dec); if(it){ it.qty--; if(it.qty<=0) cart=cart.filter(x=>x.id!==it.id);} saveCart(); renderCart(); try{ if(typeof refreshProductCartUI==="function") refreshProductCartUI(); }catch(e){} }
  if(rm){ cart=cart.filter(x=>x.id!==+rm.dataset.rm); saveCart(); renderCart(); }
});
$("#wishBtn").onclick=()=>{
  wishView=!wishView;
  if(wishView){
    currentCat="all"; currentBrand=""; currentConcern=""; currentCatalog=""; query="";
    const search=$("#search"); if(search) search.value="";
    document.querySelectorAll("#cats [data-cat]").forEach(x=>x.classList.toggle("on", x.dataset.cat==="all"));
    if(typeof closeSheet==="function") closeSheet(true);
  }
  render();
  if(wishView){ const prod=$("#products"); if(prod) prod.scrollIntoView({behavior:"smooth"}); }
};
$("#cartBtn").onclick=openCart;
$("#closeCart").onclick=closeCart;
$("#overlay").onclick=closeCart;
$("#barGo").onclick=()=>{ if(cart.length) openCart(); else { if(typeof toast==="function") toast(lang==="en"?"Your cart is empty":"السلة فاضية"); var prod=$("#products"); if(prod) prod.scrollIntoView({behavior:"smooth"}); } };
function runSearch(fromSubmit){
  const el=$("#search");
  query = el ? el.value.trim() : "";
  const clr=$("#searchClear"); if(clr) clr.hidden = !query;
  if(query){
    currentCat = "all";
    currentBrand = "";
    currentConcern = "";
    currentCatalog = "";
    wishView = false;
    catalogBrowse = true;
    window.__naqaShelfFilter = "";
    document.querySelectorAll("#cats [data-cat]").forEach(x=>x.classList.toggle("on", x.dataset.cat==="all"));
  } else {
    /* empty search → clean home catalogs */
    currentCatalog = "";
    catalogBrowse = false;
  }
  // Exact single match (SKU / full name) → open full product page
  if(fromSubmit && query && typeof isExactProductMatch==="function"){
    const exact = products.filter(function(p){ return !p.hidden && isExactProductMatch(p, query); });
    if(exact.length === 1){
      try{ history.pushState({naqa:"q"}, "", "#q/"+encodeURIComponent(query)); }catch(e){}
      render();
      openSheet(exact[0].id, "full");
      return;
    }
  }
  render();
  if(fromSubmit){
    try{
      if(query) history.pushState({naqa:"q"}, "", "#q/"+encodeURIComponent(query));
      else history.pushState({naqa:"shop"}, "", "#shop");
    }catch(e){}
    const prod=$("#products");
    if(prod) prod.scrollIntoView({behavior:"smooth", block:"start"});
  }
}
const searchEl=$("#search");
let __naqaSearchT=0;
if(searchEl){
  searchEl.addEventListener("input", e=>{
    query=e.target.value.trim();
    const clr=$("#searchClear"); if(clr) clr.hidden = !query;
    clearTimeout(__naqaSearchT);
    __naqaSearchT=setTimeout(function(){
      if(query){
        currentCat="all";
        currentBrand="";
        currentConcern="";
        currentCatalog="";
        wishView=false;
        catalogBrowse=true;
        window.__naqaShelfFilter="";
        document.querySelectorAll("#cats [data-cat]").forEach(function(x){
          x.classList.toggle("on", x.dataset.cat==="all");
        });
      }
      render();
    }, 120);
  });
  searchEl.addEventListener("keydown", e=>{
    if(e.key==="Enter"){ e.preventDefault(); clearTimeout(__naqaSearchT); runSearch(true); }
  });
}
const searchForm=$("#searchForm");
if(searchForm){
  searchForm.addEventListener("submit", e=>{
    e.preventDefault();
    clearTimeout(__naqaSearchT);
    runSearch(true);
  });
}
const searchClear=$("#searchClear");
if(searchClear){
  searchClear.addEventListener("click", ()=>{
    query="";
    if(searchEl) searchEl.value="";
    searchClear.hidden=true;
    try{ history.pushState({naqa:"shop"}, "", "#shop"); }catch(e){}
    render();
    if(searchEl) searchEl.focus();
  });
}
const searchGo=$("#searchGo");
if(searchGo){
  searchGo.addEventListener("click", e=>{ e.preventDefault(); clearTimeout(__naqaSearchT); runSearch(true); });
}
$("#sortSel").addEventListener("change", e=>{ currentSort=e.target.value; render(); });

document.addEventListener("click", e=>{
  const sh=e.target.closest("[data-shelf]");
  if(sh){
    e.preventDefault();
    if(sh.dataset.shelf==="year"){ currentSort="off"; currentCat="all"; currentBrand=""; query=""; wishView=false; const search=$("#search"); if(search) search.value=""; const sel=$("#sortSel"); if(sel) sel.value="off"; }
    if(sh.dataset.shelf==="hot"){ currentSort="new"; currentCat="all"; currentBrand=""; query=""; wishView=false; const search=$("#search"); if(search) search.value=""; }
    document.querySelectorAll("#cats [data-cat]").forEach(x=>x.classList.toggle("on", x.dataset.cat==="all"));
    render();
    const prod=$("#products"); if(prod) prod.scrollIntoView({behavior:"smooth"});
    return;
  }
  const b=e.target.closest("[data-brand]");
  if(!b || !b.dataset.brand) return;
  e.preventDefault();
  currentBrand=b.dataset.brand;
  currentCat="all";
  query="";
  wishView=false;
  catalogBrowse=true;
  window.__naqaShelfFilter="";
  const search=$("#search"); if(search) search.value="";
  document.querySelectorAll("#cats [data-cat]").forEach(x=>x.classList.toggle("on", x.dataset.cat==="all"));
  closeSheet(true);
  try{ history.pushState({naqa:"brand"}, "", "#b/"+encodeURIComponent(currentBrand)); }catch(e){}
  render();
  const prod=$("#products"); if(prod) prod.scrollIntoView({behavior:"smooth"});
});

$("#langBtn").onclick=()=>{ lang=lang==="ar"?"en":"ar"; try{localStorage.setItem("naqa_lang",lang)}catch(e){} render(); };
$("#cats").addEventListener("click", e=>{
  const a=e.target.closest("[data-cat]"); if(!a) return; e.preventDefault();
  document.querySelectorAll("#cats [data-cat]").forEach(x=>x.classList.remove("on")); a.classList.add("on");
  currentCat=a.dataset.cat;
  currentBrand="";
  currentCatalog="";
  currentConcern="";
  query="";
  wishView=false;
  closeSheet(true);
  window.__naqaShelfFilter="";
  catalogBrowse = (currentCat !== "all");
  const sEl=$("#search"); if(sEl) sEl.value="";
  const clr=$("#searchClear"); if(clr) clr.hidden=true;
  try{ history.pushState({naqa:"cat"}, "", currentCat==="all"?"#shop":"#c/"+encodeURIComponent(currentCat)); }catch(e){}
  render();
  if(currentCat!=="all"){
    const p=$("#products"); if(p) p.scrollIntoView({behavior:"smooth", block:"start"});
  } else {
    const home=$("#heroSwipe") || $("#shelves") || $("#main");
    if(home) home.scrollIntoView({behavior:"smooth", block:"start"});
  }
});
document.querySelectorAll("[data-cat-jump]").forEach(el=>{
  el.addEventListener("click", e=>{
    e.preventDefault();
    currentCat=el.dataset.catJump;
    currentBrand="";
    currentCatalog="";
    currentConcern="";
    query="";
    wishView=false;
    window.__naqaShelfFilter="";
    catalogBrowse = (currentCat !== "all");
    const sEl=$("#search"); if(sEl) sEl.value="";
    const clr=$("#searchClear"); if(clr) clr.hidden=true;
    document.querySelectorAll("#cats [data-cat]").forEach(x=>x.classList.toggle("on", x.dataset.cat===currentCat));
    try{ history.pushState({naqa:"cat"}, "", currentCat==="all"?"#shop":"#c/"+encodeURIComponent(currentCat)); }catch(err){}
    render();
    if(currentCat!=="all"){ const p=$("#products"); if(p) p.scrollIntoView({behavior:"smooth", block:"start"}); }
  });
});
$("#checkoutBtn").onclick=()=>{
  if(!cart.length){ alert(T("alertEmpty")); return; }
  openCheckout();
};
$("#checkoutCancel").onclick=closeCheckout;
document.querySelectorAll('input[name="payMethod"]').forEach(function(r){
  r.addEventListener("change", function(){ if(typeof updatePaySum==="function") updatePaySum(); });
});

$("#checkoutBackdrop").onclick=closeCheckout;
$("#checkoutSend").onclick=()=>{
  if(!cart.length){ alert(T("alertEmpty")); return; }
  sendCheckout();
};
$("#lbClose").onclick=closeLightbox;
$("#lightbox").addEventListener("click", e=>{ if(e.target.id==="lightbox"||e.target.id==="lbClose") closeLightbox(); });

/* Pull down at the top of a product closes the sheet.
   Do not reload the page — that was heavy and wiped the shop state. */
(function(){
  let x0=null,y0=null,mode=null;
  const sheet=$("#sheet"), card=$("#sheetCard");
  if(!sheet||!card) return;
  const reset=()=>{ mode=null; x0=null; y0=null; };
  sheet.addEventListener("touchstart", e=>{
    if(e.touches && e.touches.length > 1){ reset(); return; }
    if(!sheet.classList.contains("show") || $("#lightbox").classList.contains("show")) return;
    const tch=e.changedTouches[0];
    const qv=sheet.classList.contains("qv");
    const top=card.getBoundingClientRect().top;
    if(card.scrollTop<=2 && (qv || tch.clientY < top+140)){
      x0=tch.clientX; y0=tch.clientY; mode="pull"; return;
    }
    reset();
  },{passive:true});
  sheet.addEventListener("touchmove", e=>{
    if(e.touches && e.touches.length > 1){ reset(); return; }
    if(mode!=="pull"||x0==null) return;
    const tch=e.changedTouches[0];
    const dx=tch.clientX-x0, dy=tch.clientY-y0;
    if(Math.abs(dx)>Math.abs(dy)+16){ mode=null; return; }
    if(dy>8){ try{ e.preventDefault(); }catch(err){} }
  },{passive:false});
  sheet.addEventListener("touchend", e=>{
    if(mode!=="pull"||x0==null) return;
    const tch=e.changedTouches[0];
    const dy=tch.clientY-y0;
    reset();
    if(dy>42){
      /* Close the product sheet. Do not reload the whole shop. */
      try{
        if(typeof closeSheet==="function") closeSheet();
        else if(typeof history!=="undefined" && history.back) history.back();
      }catch(err){}
    }
  },{passive:true});
  sheet.addEventListener("click", e=>{
    if(e.target===sheet && sheet.classList.contains("qv")) closeSheet();
  });
})();

/* Edge swipe = one history step only.
   Arabic: right→left. English: left→right.
   On a product: history.back() once so 4 products go D→C→B→A→shop.
   Old code closed the sheet and replaceState(#shop) — that skipped the stack.
   Safari may fire a second back; absorb undoes only that extra step. */
(function(){
  var x0=null, y0=null, armed=false, busy=false;
  window.__naqaAbsorbBackUntil = window.__naqaAbsorbBackUntil || 0;
  window.__naqaOurBackPending = window.__naqaOurBackPending || 0;
  function rtl(){ return document.documentElement.dir!=="ltr"; }
  function onBackEdge(x){
    var w=window.innerWidth||360;
    return rtl() ? x>=w-36 : x<=36;
  }
  function isBackSwipe(dx, dy){
    if(Math.abs(dx)<64 || Math.abs(dx)<Math.abs(dy)+10) return false;
    return rtl() ? dx<0 : dx>0;
  }
  function layerOpen(){
    var lb=$("#lightbox"), co=$("#checkoutModal"), qz=$("#quizModal"), dr=$("#drawer"), sh=$("#sheet");
    if(lb && lb.classList.contains("show")) return "light";
    if(co && co.classList.contains("show")) return "check";
    if(qz && qz.classList.contains("show")) return "quiz";
    if(dr && dr.classList.contains("show")) return "cart";
    if(sh && sh.classList.contains("show")) return "sheet";
    return "";
  }
  function stepBack(){
    if(busy) return;
    busy=true;
    setTimeout(function(){ busy=false; }, 450);
    var layer=layerOpen();
    if(layer==="light"){ closeLightbox(); return; }
    if(layer==="check"){ closeCheckout(); return; }
    if(layer==="quiz" && typeof closeQuiz==="function"){ closeQuiz(); return; }
    if(layer==="cart"){ closeCart(); return; }
    if(layer==="sheet"){
      /* One step in the product stack. Do not jump to shop. */
      window.__naqaOurBackPending = (window.__naqaOurBackPending||0) + 1;
      window.__naqaAbsorbBackUntil = Date.now() + 700;
      try{ history.back(); }catch(err){
        window.__naqaOurBackPending = 0;
        if(typeof closeSheet==="function") closeSheet(true);
        if(typeof naqaReleasePageScroll==="function") naqaReleasePageScroll();
        if(typeof naqaRestoreShopScroll==="function") naqaRestoreShopScroll();
      }
      return;
    }
    /* Catalog: leave alone. */
  }
  document.addEventListener("touchstart", function(e){
    if(!e.touches || e.touches.length!==1){ armed=false; return; }
    var tch=e.touches[0];
    if(!onBackEdge(tch.clientX)){ armed=false; return; }
    if(e.target && e.target.closest && e.target.closest(".hero-swipe-track, .campaign-products, .carousel-track")){
      armed=false; return;
    }
    x0=tch.clientX; y0=tch.clientY; armed=true;
  }, {passive:true, capture:true});
  document.addEventListener("touchmove", function(e){
    if(!armed || x0==null) return;
    var tch=e.touches && e.touches[0];
    if(!tch) return;
    var dx=tch.clientX-x0, dy=tch.clientY-y0;
    if(Math.abs(dy)>Math.abs(dx)+10 && Math.abs(dy)>16){ armed=false; return; }
    if(Math.abs(dx)>10 && (rtl()?dx<0:dx>0)){
      try{ e.preventDefault(); }catch(err){}
    }
  }, {passive:false, capture:true});
  document.addEventListener("touchend", function(e){
    if(!armed || x0==null) return;
    var tch=e.changedTouches && e.changedTouches[0];
    armed=false;
    if(!tch) return;
    var dx=tch.clientX-x0, dy=tch.clientY-y0;
    x0=null; y0=null;
    if(!isBackSwipe(dx, dy)) return;
    stepBack();
  }, {passive:true, capture:true});
  document.addEventListener("touchcancel", function(){ armed=false; x0=null; y0=null; }, {capture:true});
})();

/* sheet-open touch guard: stop background scroll under quick view */
(function(){
  const sheet=$("#sheet");
  if(!sheet) return;
  sheet.addEventListener("touchmove", function(e){
    if(e.touches && e.touches.length > 1) return;
    if(!sheet.classList.contains("show")) return;
    const allow=e.target.closest && e.target.closest(".sheet-card, .carousel-track, .hero-swipe-track, .campaign-products, .lightbox, .thumbs");
    // if touch is on dimmed backdrop (the sheet element itself) block
    if(e.target===sheet || !allow){
      // still allow if inside card
      if(!(e.target.closest && e.target.closest("#sheetCard, .sheet-card"))){
        e.preventDefault();
      }
    }
  }, {passive:false});
})();


/* popstate: apply one history step. Absorb only a SECOND back (Safari double). */
(function(){
  var routeTimer=0;
  function runRoute(){
    clearTimeout(routeTimer);
    routeTimer=setTimeout(function(){
      if($("#lightbox") && $("#lightbox").classList.contains("show")){ closeLightbox(); return; }
      if(typeof applyRoute==="function") applyRoute();
    }, 0);
  }
  window.addEventListener("popstate", function(){
    var now=Date.now();
    if(now < (window.__naqaAbsorbBackUntil||0) && (window.__naqaOurBackPending||0)>0){
      /* First pop after our history.back() — apply it (previous product or shop). */
      window.__naqaOurBackPending = Math.max(0, (window.__naqaOurBackPending||0) - 1);
      runRoute();
      return;
    }
    if(now < (window.__naqaAbsorbBackUntil||0)){
      /* Extra browser back in the same gesture — undo one step only. */
      window.__naqaAbsorbBackUntil = 0;
      try{ history.go(1); }catch(err){}
      return;
    }
    runRoute();
  });
  window.addEventListener("hashchange", function(){
    if(Date.now() < (window.__naqaAbsorbBackUntil||0)) return;
    runRoute();
  });
})();
/* chrome-hide: hysteresis + cooldown — never thrash layout while scrolling */
let __naqaLastY=0;
let __naqaChromeCooldown=0;
let __naqaChromeRAF=0;
function naqaSetChrome(hide){
  const on=document.body.classList.contains("chrome-hide");
  if(hide===on) return;
  const now=Date.now();
  if(now < __naqaChromeCooldown) return;
  if(hide) document.body.classList.add("chrome-hide");
  else document.body.classList.remove("chrome-hide");
  __naqaChromeCooldown = now + 900; // lock toggle ~0.9s — stop flash loops
}
function naqaUpdateChrome(y){
  /* Prefer home catalog shelves as threshold; fall back to products heading */
  const anchor = $("#homeCatalogs") || $("#shelves") || $("#products");
  const thresh = anchor ? Math.max(160, anchor.offsetTop + 40) : 220;
  const delta = y - __naqaLastY;
  __naqaLastY = y;
  // near top always show
  if(y < 60){ naqaSetChrome(false); return; }
  // hide only on clear downward scroll into catalog
  if(y > thresh && delta > 28){ naqaSetChrome(true); return; }
  // show only on clear upward scroll
  if(delta < -36){ naqaSetChrome(false); }
}
window.addEventListener("scroll", ()=>{
  if(document.body.classList.contains("naqa-scroll-lock") ||
     document.body.classList.contains("sheet-open") ||
     document.body.classList.contains("modal-open") ||
     document.body.classList.contains("drawer-open") ||
     ($("#sheet")&&$("#sheet").classList.contains("show")) ||
     ($("#quizModal")&&$("#quizModal").classList.contains("show")) ||
     ($("#checkoutModal")&&$("#checkoutModal").classList.contains("show")) ||
     ($("#drawer")&&$("#drawer").classList.contains("show"))) return;
  // rAF coalesce: one update per frame max
  if(__naqaChromeRAF) return;
  __naqaChromeRAF=1;
  requestAnimationFrame(function(){
    __naqaChromeRAF=0;
    naqaUpdateChrome(window.scrollY||0);
  });
  // IMPORTANT: no history.replaceState on scroll.
  // It fired hashchange → applyRoute → scrollIntoView → jump + image thrash.
}, {passive:true});
document.addEventListener("focusin", function(e){
  if(e.target && e.target.id==="search"){
    __naqaChromeCooldown=0;
    naqaSetChrome(false);
  }
});



function boot(){
  try{
    if(!products.length) throw new Error("products.js missing");
    /* Public store: cloud overrides. Cache last map so hidden products do not flash. */
    var OV_CACHE = "naqa_ov_pub_v2";
    function naqaApplyOverrides(remote, opts){
      opts = opts || {};
      var map = (remote && typeof remote === "object") ? remote : {};
      if (typeof mergeOverrides === "function") mergeOverrides(map);
      try {
        if (Object.keys(map).length) sessionStorage.setItem(OV_CACHE, JSON.stringify(map));
      } catch (e) {}
      if (opts.render !== false && typeof render === "function") render();
    }
    /* Instant: last known public overrides (session) — kills flash of hidden items */
    try {
      var cached = JSON.parse(sessionStorage.getItem(OV_CACHE) || "null");
      if (cached && typeof cached === "object") naqaApplyOverrides(cached, { render: false });
    } catch (e) {}
    const wa="https://wa.me/"+WA_NUMBER;
    $("#waFooter").href=wa; $("#waFloat").href=wa; $("#waHero").href=wa;
    $("#yr").textContent=new Date().getFullYear();
    if(typeof featuresBoot==="function") featuresBoot();
    if(typeof fillAreas==="function") fillAreas();
    /* First paint after cache (if any). Cloud re-render when ready. */
    try { if (typeof naqaForceCatalogStock === "function") naqaForceCatalogStock(); } catch (e) {}
    try {
      products.forEach(function (p) {
        if (p.stock == null || p.stock === "" || Number(p.stock) < 1) p.stock = 3;
      });
    } catch (e) {}
    render();
    applyRoute();
    try{
      var sh=document.getElementById("sheet");
      if(!sh || !sh.classList.contains("show")) document.documentElement.classList.remove("sku-boot");
    }catch(e){}
    /* Lazy product copy (desc/use/skin) — keeps first paint light */
    fetch("data/products.detail.json?v=20261127c3").then(function(res){ return res.ok ? res.json() : null; }).then(function(d){
      if (d && typeof naqaMergeProductDetails === "function") {
        naqaMergeProductDetails(d);
        try { if (typeof render === "function") render(); } catch (e) {}
      }
    }).catch(function(){});
    /* Prefer Firestore via store-cloud-boot; also keep static file as fallback */
    fetch("data/overrides.json?v="+Date.now()).then(function(res){ return res.ok ? res.json() : {}; }).then(function(j){
      if (j && typeof j === "object" && Object.keys(j).length) naqaApplyOverrides(j);
    }).catch(function(){});
  }catch(err){
    const b=document.createElement("div");
    b.style.cssText="padding:20px;background:#fee;color:#900;direction:rtl";
    b.textContent="خطأ: "+(err&&err.message?err.message:err);
    document.body.prepend(b);
  }
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot); else boot();

/* Home curated catalogs */
document.addEventListener("click", function(e){
  var t = e.target.closest && e.target.closest("[data-open-catalog]");
  if(!t) return;
  e.preventDefault();
  var k = t.getAttribute("data-open-catalog");
  if(!k) return;
  if(k === "off") k = "eoy";
  if(typeof openCatalog === "function") openCatalog(k);
});

document.addEventListener("click", function(e){
  var b = e.target.closest && e.target.closest(".campaign-all[data-brand], .campaign-banner[data-brand]");
  if(!b) return;
  var brand = b.getAttribute("data-brand");
  if(!brand) return;
  e.preventDefault();
  e.stopPropagation();
  currentBrand = brand; currentCatalog=""; currentCat="all"; currentConcern="";
  if(typeof wishView!=="undefined") wishView=false; query=""; catalogBrowse=true;
  window.__naqaShelfFilter="";
  try{ history.pushState({naqa:"brand"},"","#b/"+encodeURIComponent(brand)); }catch(err){}
  if(typeof render==="function") render();
  var prod=document.getElementById("products"); if(prod) prod.scrollIntoView({behavior:"smooth",block:"start"});
});
