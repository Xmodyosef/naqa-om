/* body scroll lock while sheet open — uses naqaScrollLock */
function lockBodyScroll(){
  document.documentElement.classList.add("sheet-open");
  document.body.classList.add("sheet-open");
  if(window.naqaScrollLock) naqaScrollLock.lock();
}
function unlockBodyScroll(){
  document.documentElement.classList.remove("sheet-open");
  document.body.classList.remove("sheet-open");
  if(window.naqaScrollLock) naqaScrollLock.unlock();
}
function naqaRememberShopScroll(){
  if(window.__naqaReturnY != null) return;
  window.__naqaReturnY = window.scrollY || document.documentElement.scrollTop || 0;
  try{ if("scrollRestoration" in history) history.scrollRestoration = "manual"; }catch(e){}
}
function naqaRestoreShopScroll(){
  var y = window.__naqaReturnY;
  if(y == null) return;
  window.__naqaReturnY = null;
  function go(){ window.scrollTo(0, y); }
  go();
  requestAnimationFrame(go);
  setTimeout(go, 60);
  setTimeout(go, 180);
}
window.naqaRestoreShopScroll = naqaRestoreShopScroll;

async function openSheet(id, mode, reset){
  const p=products.find(x=>x.id===id); if(!p) return;
  naqaRememberShopScroll();
  openProductId=id; sheetMode=mode||"full";
  if(reset!==false){ galleryIndex=0; pickQty=1; }
  const sameBrand=products.filter(x=>x.brand===p.brand && x.id!==p.id);
  const pool=sameBrand.length?sameBrand:products.filter(x=>x.cat===p.cat && x.id!==p.id);
  const sug=pool.slice(0,4);
  const alsoLabel=sameBrand.length?T("same"):T("also");
  const cards=sug.map(s=>`
    <button class="sug" data-open="${s.id}" type="button">
      <span class="sug-vis">${visual(s,0)}</span>
      <span class="sug-name">${esc(pname(s))}</span>
      <span class="sug-price">${money(s.price)}</span>
    </button>`).join("");
  const qv=sheetMode==="qv";
  $("#sheet").classList.toggle("qv", qv);
  const wishOn=typeof isWish==="function"&&isWish(p.id)?"on":"";
  const cartCtrl=typeof productCartControls==="function"?productCartControls(p.id,{sheet:true}):
    (`<button class="btn-add card-add" data-add="${p.id}" type="button">${T("add")}</button>`);
  const actions=`
    <div class="sheet-actions" id="sheetActions">
      <button class="btn-wish-sheet ${wishOn}" data-wish="${p.id}" type="button">♥ ${lang==="en"?"Save":"حفظ"}</button>
      ${cartCtrl}
      ${qv? `<button class="btn-open" data-open="${p.id}" type="button">${T("open")}</button>`:""}
    </div>`;
  $("#sheetCard").innerHTML=`
    <button class="text-back" id="closeSheet" type="button" aria-label="${T("back")}">‹ ${T("back")}</button>
    ${typeof reviewHTML==="function"?reviewHTML(p):""}
    <h3 id="sheetTitle" style="margin:4px 0 2px">${esc(pname(p))}</h3>
    ${priceHTML(p)}
    ${carouselHTML(p, galleryIndex)}
    <div class="sheet-brand-row">${brandMark(p.brand, { iconOnly: true })}</div>
    ${actions}
    <span class="skin-pill">${T("skinT")}: ${esc(pskin(p))}</span>
    ${typeof shadeHTML==="function"?shadeHTML(p):""}
    ${typeof ingHTML==="function"?ingHTML(p):""}
    ${qv? `<p class="long" style="margin-top:12px">${esc(pdesc(p))}</p>` : `
      <h4 class="block-h">${T("about")}</h4>
      <p class="long">${esc(pdesc(p))}</p>
      <h4 class="block-h">${T("how")}</h4>
      <p class="long steps">${typeof nl2br==="function"?nl2br(puse(p)):esc(puse(p))}</p>
      <div class="tip-box">${lang==="en"?"Tip: patch-test new actives and always pair brightening/acids with daytime SPF.":"نصيحة: اختبري المكوّنات الجديدة على منطقة صغيرة، وواقي الشمس ضروري مع التفتيح/التقشير."}</div>
      ${typeof reviewsSection==="function"?reviewsSection(p):""}
      <h4 class="block-h">${alsoLabel}</h4>
      <div class="sug-row">${cards}</div>
    `}
`;
  $("#sheet").classList.add("show");
  const sh=$("#sheet"); if(sh){ sh.setAttribute("aria-modal","true"); sh.setAttribute("aria-labelledby","sheetTitle"); }
  lockBodyScroll();
  $("#sheetCard").scrollTop=0;
  bindCarousel(p);
  document.title=pname(p)+" · Naqa";
  try{
    if(!qv && routeHash()!=="p/"+id) history.pushState({naqa:"product",id}, "", "#p/"+id);
  }catch(e){}
}

function closeSheet(fromRoute){
  $("#sheet").classList.remove("show");
  const shx=$("#sheet"); if(shx) shx.setAttribute("aria-modal","false");
  $("#sheet").classList.remove("qv");
  unlockBodyScroll();
  openProductId=null;
  document.title=T("docTitle");
  const card=$("#sheetCard");
  if(card){ card.style.transform=""; card.style.transition=""; }
  if(!fromRoute && routeHash().indexOf("p/")===0){
    try{ history.back(); }catch(e){}
  }
  /* رجوع من المنتج: نفس مكان التمرير، مو بداية الصفحة */
  setTimeout(function(){
    if(routeHash().indexOf("p/")===0) return;
    if(typeof naqaRestoreShopScroll==="function") naqaRestoreShopScroll();
  }, 0);
}

function openLightbox(src){
  if(!src) return;
  $("#lbImg").src=src;
  $("#lightbox").classList.add("show");
  document.body.classList.add("lightbox-open");
  if(window.naqaScrollLock) naqaScrollLock.lock();
}
function closeLightbox(){
  $("#lightbox").classList.remove("show");
  $("#lbImg").removeAttribute("src");
  document.body.classList.remove("lightbox-open");
  if(window.naqaScrollLock) naqaScrollLock.unlock();
}
