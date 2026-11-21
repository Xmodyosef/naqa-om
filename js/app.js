/* events, gestures, boot */
function onCatalogClick(e){
  const wish=e.target.closest("[data-wish]"); if(wish){ e.preventDefault(); e.stopPropagation(); toggleWish(+wish.dataset.wish); return; }
  const add=e.target.closest("[data-add]"); if(add){ addToCart(+add.dataset.add); return; }
  const qv=e.target.closest("[data-qv]"); if(qv){ openSheet(+qv.dataset.qv, "qv"); return; }
  const open=e.target.closest("[data-open]"); if(open){ openSheet(+open.dataset.open, "full"); return; }
}
$("#grid").addEventListener("click", onCatalogClick);
document.addEventListener("click", e=>{
  if(e.target.closest("#shelves")) onCatalogClick(e);
});
$("#cartBody").addEventListener("click", e=>{
  const inc=e.target.closest("[data-inc]"); const dec=e.target.closest("[data-dec]"); const rm=e.target.closest("[data-rm]");
  if(inc){ const it=cart.find(i=>i.id===+inc.dataset.inc); if(it) it.qty++; saveCart(); renderCart(); }
  if(dec){ const it=cart.find(i=>i.id===+dec.dataset.dec); if(it){ it.qty--; if(it.qty<=0) cart=cart.filter(x=>x.id!==it.id);} saveCart(); renderCart(); }
  if(rm){ cart=cart.filter(x=>x.id!==+rm.dataset.rm); saveCart(); renderCart(); }
});
$("#wishBtn").onclick=()=>{
  wishView=!wishView;
  if(wishView){
    currentCat="all"; currentBrand=""; currentConcern=""; query="";
    const search=$("#search"); if(search) search.value="";
    document.querySelectorAll("#cats a").forEach(x=>x.classList.toggle("on", x.dataset.cat==="all"));
    if(typeof closeSheet==="function") closeSheet(true);
  }
  render();
  if(wishView){ const prod=$("#products"); if(prod) prod.scrollIntoView({behavior:"smooth"}); }
};
$("#cartBtn").onclick=openCart;
$("#closeCart").onclick=closeCart;
$("#overlay").onclick=closeCart;
$("#barGo").onclick=()=>{ if(cart.length) openCart(); else openCart(); };
$("#search").addEventListener("input", e=>{ query=e.target.value.trim(); render(); });
$("#sortSel").addEventListener("change", e=>{ currentSort=e.target.value; render(); });

document.addEventListener("click", e=>{
  const sh=e.target.closest("[data-shelf]");
  if(sh){
    e.preventDefault();
    if(sh.dataset.shelf==="year"){ currentSort="off"; currentCat="all"; currentBrand=""; query=""; wishView=false; const search=$("#search"); if(search) search.value=""; const sel=$("#sortSel"); if(sel) sel.value="off"; }
    if(sh.dataset.shelf==="hot"){ currentSort="new"; currentCat="all"; currentBrand=""; query=""; wishView=false; const search=$("#search"); if(search) search.value=""; }
    document.querySelectorAll("#cats a").forEach(x=>x.classList.toggle("on", x.dataset.cat==="all"));
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
  const search=$("#search"); if(search) search.value="";
  document.querySelectorAll("#cats a").forEach(x=>x.classList.toggle("on", x.dataset.cat==="all"));
  closeSheet(true);
  try{ history.pushState({naqa:"brand"}, "", "#b/"+encodeURIComponent(currentBrand)); }catch(e){}
  render();
  const prod=$("#products"); if(prod) prod.scrollIntoView({behavior:"smooth"});
});

$("#langBtn").onclick=()=>{ lang=lang==="ar"?"en":"ar"; try{localStorage.setItem("naqa_lang",lang)}catch(e){} render(); };
$("#cats").addEventListener("click", e=>{
  const a=e.target.closest("[data-cat]"); if(!a) return; e.preventDefault();
  document.querySelectorAll("#cats a").forEach(x=>x.classList.remove("on")); a.classList.add("on");
  currentCat=a.dataset.cat; currentBrand=""; wishView=false; closeSheet(true);
  try{ history.pushState({naqa:"cat"}, "", currentCat==="all"?"#shop":"#c/"+encodeURIComponent(currentCat)); }catch(e){}
  render(); $("#products").scrollIntoView({behavior:"smooth"});
});
document.querySelectorAll("[data-cat-jump]").forEach(el=>{
  el.addEventListener("click", e=>{
    e.preventDefault(); currentCat=el.dataset.catJump; currentBrand=""; wishView=false;
    document.querySelectorAll("#cats a").forEach(x=>x.classList.toggle("on", x.dataset.cat===currentCat));
    render(); $("#products").scrollIntoView({behavior:"smooth"});
  });
});
$("#checkoutBtn").onclick=()=>{
  if(!cart.length){ alert(T("alertEmpty")); return; }
  openCheckout();
};
$("#checkoutCancel").onclick=closeCheckout;
$("#checkoutBackdrop").onclick=closeCheckout;
$("#checkoutSend").onclick=()=>{
  if(!cart.length){ alert(T("alertEmpty")); return; }
  sendCheckout();
};
$("#lbClose").onclick=closeLightbox;
$("#lightbox").addEventListener("click", e=>{ if(e.target.id==="lightbox"||e.target.id==="lbClose") closeLightbox(); });

/* edge swipe + pull-down to close (quick view) */
(function(){
  let x0=null,y0=null,mode=null; // edge | pull
  const sheet=$("#sheet"), card=$("#sheetCard");
  const reset=()=>{ mode=null; x0=null; y0=null; };
  sheet.addEventListener("touchstart", e=>{
    if(!sheet.classList.contains("show") || $("#lightbox").classList.contains("show")) return;
    const t=e.changedTouches[0];
    const qv=sheet.classList.contains("qv");
    const top=card.getBoundingClientRect().top;
    // pull-down: sheet scrolled to top, touch near handle / top area, or any qv pull when scrollTop<=2
    if(card.scrollTop<=2 && (qv || t.clientY < top+72)){
      x0=t.clientX; y0=t.clientY; mode="pull"; card.style.transition="none"; return;
    }
    // edge swipe (RTL: left edge still works for LTR; also allow right edge 32px)
    const edge=t.clientX<=28 || t.clientX>=(window.innerWidth-28);
    if(edge){ x0=t.clientX; y0=t.clientY; mode="edge"; card.style.transition="none"; return; }
    reset();
  },{passive:true});
  sheet.addEventListener("touchmove", e=>{
    if(!mode||x0==null) return;
    const t=e.changedTouches[0];
    const dx=t.clientX-x0, dy=t.clientY-y0;
    if(mode==="pull"){
      if(Math.abs(dx)>Math.abs(dy)+12){ mode=null; card.style.transform=""; return; }
      if(dy>0) card.style.transform="translateY("+Math.min(dy,220)+"px)";
      return;
    }
    // edge
    if(Math.abs(dy)>48 && Math.abs(dx)<24){ mode=null; card.style.transform=""; return; }
    const dir = dx; // positive = right
    if(Math.abs(dir)>0) card.style.transform="translateX("+(dir>0?Math.min(dir,160):Math.max(dir,-160))+"px)";
  },{passive:true});
  sheet.addEventListener("touchend", e=>{
    if(!mode||x0==null) return;
    const t=e.changedTouches[0];
    const dx=t.clientX-x0, dy=t.clientY-y0;
    const was=mode; reset();
    card.style.transition="transform .22s ease";
    if(was==="pull"){
      if(dy>90) closeSheet(); else card.style.transform="";
      return;
    }
    if(Math.abs(dx)>72) closeSheet(); else card.style.transform="";
  },{passive:true});
  // tap dimmed backdrop closes qv
  sheet.addEventListener("click", e=>{
    if(e.target===sheet && sheet.classList.contains("qv")) closeSheet();
  });
})();

window.addEventListener("popstate", ()=>{
  if($("#lightbox").classList.contains("show")){ closeLightbox(); return; }
  applyRoute();
});
window.addEventListener("hashchange", ()=>{ applyRoute(); });
window.addEventListener("scroll", ()=>{
  const h=routeHash();
  if(h.indexOf("p/")===0||h.indexOf("b/")===0||h.indexOf("c/")===0) return;
  if(window.scrollY>420){
    if(h!=="shop"){ try{ history.replaceState({naqa:"shop"}, "", "#shop"); }catch(e){} }
  } else if(h==="shop"){
    try{ history.replaceState({naqa:"home"}, "", location.pathname+location.search); }catch(e){}
  }
}, {passive:true});

function boot(){
  try{
    if(!products.length) throw new Error("products.js missing");
    const wa="https://wa.me/"+WA_NUMBER;
    $("#waFooter").href=wa; $("#waFloat").href=wa; $("#waHero").href=wa;
    $("#yr").textContent=new Date().getFullYear();
    if(typeof featuresBoot==="function") featuresBoot();
    render();
    applyRoute();
  }catch(err){
    const b=document.createElement("div");
    b.style.cssText="padding:20px;background:#fee;color:#900;direction:rtl";
    b.textContent="خطأ: "+(err&&err.message?err.message:err);
    document.body.prepend(b);
  }
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot); else boot();
