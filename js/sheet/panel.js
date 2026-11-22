/* body scroll lock while sheet open */
var __sheetScrollY=0;
function lockBodyScroll(){
  __sheetScrollY=window.scrollY||window.pageYOffset||0;
  document.documentElement.classList.add("sheet-open");
  document.body.classList.add("sheet-open");
  document.body.style.position="fixed";
  document.body.style.top=(-__sheetScrollY)+"px";
  document.body.style.left="0";
  document.body.style.right="0";
  document.body.style.width="100%";
}
function unlockBodyScroll(){
  document.documentElement.classList.remove("sheet-open");
  document.body.classList.remove("sheet-open");
  document.body.style.position="";
  document.body.style.top="";
  document.body.style.left="";
  document.body.style.right="";
  document.body.style.width="";
  window.scrollTo(0, __sheetScrollY||0);
}
async function openSheet(id, mode, reset){
  const p=products.find(x=>x.id===id); if(!p) return;
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
  const hint=qv?T("swipe"):T("swipeFull");
  $("#sheetCard").innerHTML=`
    <div class="sheet-handle" aria-hidden="true"></div>
    <p class="swipe-hint">${hint}</p>
    ${qv? carouselHTML(p, galleryIndex) : ""}
    <button class="text-back" id="closeSheet" type="button" aria-label="${T("back")}">‹ ${T("back")}</button>
    ${brandMark(p.brand)}
    ${typeof reviewHTML==="function"?reviewHTML(p):""}
    <h3 id="sheetTitle" style="margin:4px 0 2px">${esc(pname(p))}</h3>
    ${priceHTML(p)}
    <div class="qty-pick" role="group" aria-label="${T("qty")}"><span id="qtyLab">${T("qty")}</span><button type="button" data-q="-1" aria-label="${lang==="en"?"Decrease quantity":"تقليل الكمية"}">−</button><b id="pickQty" aria-live="polite">1</b><button type="button" data-q="1" aria-label="${lang==="en"?"Increase quantity":"زيادة الكمية"}">+</button></div>
    ${qv? "" : carouselHTML(p, galleryIndex)}
    <span class="skin-pill">${T("skinT")}: ${esc(pskin(p))}</span>
    ${typeof shadeHTML==="function"?shadeHTML(p):""}
    ${typeof ingHTML==="function"?ingHTML(p):""}
    ${qv? `<p class="long" style="margin-top:12px">${brandMark(p.brand)} — ${esc(pdesc(p))}</p>` : `
      <h4 class="block-h">${T("about")}</h4>
      <p class="long">${brandMark(p.brand)} — ${esc(pdesc(p))}</p>
      <h4 class="block-h">${T("how")}</h4>
      <p class="long steps">${typeof nl2br==="function"?nl2br(puse(p)):esc(puse(p))}</p>
      <div class="tip-box">${lang==="en"?"Tip: patch-test new actives and always pair brightening/acids with daytime SPF.":"نصيحة: اختبري المكوّنات الجديدة على منطقة صغيرة، وواقي الشمس ضروري مع التفتيح/التقشير."}</div>
      ${typeof reviewsSection==="function"?reviewsSection(p):""}
      <h4 class="block-h">${alsoLabel}</h4>
      <div class="sug-row">${cards}</div>
    `}
    <div class="sheet-actions">
      <button class="btn-wish-sheet ${typeof isWish==="function"&&isWish(p.id)?"on":""}" data-wish="${p.id}" type="button">♥ ${lang==="en"?"Save":"حفظ"}</button>
      <button class="btn-add card-add" data-add="${p.id}" ${(p.stock!=null && Number(p.stock)<=0)?"disabled":""} type="button">${(p.stock!=null && Number(p.stock)<=0)?(lang==="en"?"Out of stock":"نفد"):T("add")}</button>
      ${qv? `<button class="btn-open" data-open="${p.id}" type="button">${T("open")}</button>`:""}
    </div>`;
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
}

function openLightbox(src){
  if(!src) return;
  $("#lbImg").src=src;
  $("#lightbox").classList.add("show");
}
function closeLightbox(){
  $("#lightbox").classList.remove("show");
  $("#lbImg").removeAttribute("src");
}
