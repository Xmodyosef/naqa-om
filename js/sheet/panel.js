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


/** نص المنتج للمطابقة (اسم + فئة) */
function naqaTextBlob(p){
  return String((p&&p.nameAr)||"")+" "+String((p&&p.nameEn)||"")+" "+String((p&&p.cat)||"")+" "+String((p&&p.brand)||"");
}
function naqaHasKW(blob, kws){
  var b=String(blob||"").toLowerCase();
  for(var i=0;i<kws.length;i++){ if(b.indexOf(String(kws[i]).toLowerCase())>=0) return true; }
  return false;
}
/** منتجان يناسبان المنتج الحالي (روتين بسيط حسب النوع) */
function naqaPairProducts(p){
  if(!p || !products || !products.length) return [];
  var blob=naqaTextBlob(p);
  var visible=products.filter(function(x){
    return x && x.id!==p.id && !x.hidden && !(x.stock!=null && Number(x.stock)<=0);
  });
  var roles=[];
  if(naqaHasKW(blob,["سيروم","serum","retinol","فيتامين","vitamin c","niacin","نياس"])){
    roles=[["واقي","sunscreen","spf","sun cream","suncream"],["مرطب","moistur","cream","كريم","lotion","هيالورون","hyaluron"]];
  } else if(naqaHasKW(blob,["غسول","cleanser","cleansing","foam wash","facial wash","wash"])){
    roles=[["تونر","toner"],["مرطب","moistur","كريم","cream"]];
  } else if(naqaHasKW(blob,["تونر","toner"])){
    roles=[["سيروم","serum"],["مرطب","moistur","كريم","cream"]];
  } else if(naqaHasKW(blob,["واقي","spf","sunscreen","sun "])){
    roles=[["مرطب","moistur","كريم","cream"],["سيروم","serum"]];
  } else if(naqaHasKW(blob,["شامبو","shampoo"])){
    roles=[["بلسم","conditioner","condit"],["زيت","oil","mask","ماسك"]];
  } else if(naqaHasKW(blob,["بلسم","conditioner"])){
    roles=[["شامبو","shampoo"],["زيت","oil","mask","ماسك"]];
  } else if(p.cat==="شفاه" || naqaHasKW(blob,["lip","شفاه","أحمر","محدد","gloss","plumper"])){
    roles=[["محدد","liner"],["بلمبر","plumper","gloss","جلوس","أحمر"]];
  } else if(p.cat==="شعر" || naqaHasKW(blob,["hair","شعر"])){
    roles=[["شامبو","shampoo"],["بلسم","conditioner"]];
  }
  var picked=[], used={};
  function take(pred){
    if(picked.length>=2) return;
    var hit=visible.find(function(x){ return !used[x.id] && pred(x); });
    if(hit){ used[hit.id]=1; picked.push(hit); }
  }
  roles.forEach(function(kws){
    take(function(x){ return x.brand===p.brand && naqaHasKW(naqaTextBlob(x), kws); });
    take(function(x){ return naqaHasKW(naqaTextBlob(x), kws); });
  });
  if(picked.length<2){
    visible.filter(function(x){ return x.cat===p.cat && !used[x.id]; }).slice(0,2-picked.length)
      .forEach(function(x){ used[x.id]=1; picked.push(x); });
  }
  if(picked.length<2){
    visible.filter(function(x){ return !used[x.id] && x.hot; }).slice(0,2-picked.length)
      .forEach(function(x){ used[x.id]=1; picked.push(x); });
  }
  return picked.slice(0,2);
}
function naqaPairSectionHTML(p){
  var pairs=naqaPairProducts(p);
  if(!pairs.length) return "";
  var en=(typeof lang!=="undefined" && lang==="en");
  var cards=pairs.map(function(s){
    return '<button class="pair-card" data-open="'+s.id+'" type="button">'
      +'<span class="pair-vis">'+visual(s,0)+'</span>'
      +'<span class="pair-name">'+esc(pname(s))+'</span>'
      +'<span class="pair-price">'+money(s.price)+'</span>'
      +'</button>';
  }).join("");
  var ids=pairs.map(function(s){ return s.id; }).join(",");
  var sum=pairs.reduce(function(a,s){ return a+Number(s.price||0); },0);
  var btnLabel=en
    ? ("Add both · "+money(sum))
    : ("أضيفي الاثنين · "+money(sum));
  if(pairs.length===1){
    btnLabel=en ? ("Add · "+money(sum)) : ("أضيفي · "+money(sum));
  }
  var title=en ? "Pairs with this" : "يناسب هذا المنتج";
  return '<section class="sheet-pairs" aria-label="'+esc(title)+'">'
    +'<h4 class="block-h">'+esc(title)+'</h4>'
    +'<div class="pair-row">'+cards+'</div>'
    +'<button type="button" class="btn-add-pair" data-add-pair="'+ids+'">'+esc(btnLabel)+'</button>'
    +'</section>';
}
function naqaSameBrandHTML(p){
  var same=(products||[]).filter(function(x){ return x.brand===p.brand && x.id!==p.id && !x.hidden; }).slice(0,4);
  if(!same.length) return "";
  var en=(typeof lang!=="undefined" && lang==="en");
  var title=en ? "More from this brand" : "من نفس الماركة";
  var cards=same.map(function(s){
    return '<button class="sug" data-open="'+s.id+'" type="button">'
      +'<span class="sug-vis">'+visual(s,0)+'</span>'
      +'<span class="sug-name">'+esc(pname(s))+'</span>'
      +'<span class="sug-price">'+money(s.price)+'</span>'
      +'</button>';
  }).join("");
  return '<section class="sheet-same" aria-label="'+esc(title)+'">'
    +'<h4 class="block-h">'+esc(title)+'</h4>'
    +'<div class="sug-row sug-row-sm">'+cards+'</div>'
    +'</section>';
}

async function openSheet(id, mode, reset){
  const p=products.find(x=>x.id===id); if(!p) return;
  naqaRememberShopScroll();
  openProductId=id; sheetMode=mode||"full";
  if(reset!==false){ galleryIndex=0; pickQty=1; }
  const qv=sheetMode==="qv";
  $("#sheet").classList.toggle("qv", qv);
  const wishOn=typeof isWish==="function"&&isWish(p.id)?"on":"";
  const cartCtrl=typeof productCartControls==="function"?productCartControls(p.id,{sheet:true}):
    (`<button class="btn-add card-add sheet-add-cta" data-add="${p.id}" type="button">${T("add")}</button>`);
  const brandName = esc(p.brand||"");
  const brandBtn = brandName
    ? `<button type="button" class="sheet-brand-link" data-brand="${esc(p.brand)}" aria-label="${lang==="en"?("All from "+p.brand):("كل منتجات "+p.brand)}">${brandName}</button>`
    : "";
  const actions=`
    <div class="sheet-actions" id="sheetActions">
      <button class="btn-wish-sheet ${wishOn}" data-wish="${p.id}" type="button" aria-label="${lang==="en"?"Save":"حفظ"}">♥</button>
      ${cartCtrl}
      ${qv? `<button class="btn-open" data-open="${p.id}" type="button">${T("open")}</button>`:""}
    </div>`;
  /* ترتيب: رجوع → صورة → اسم+ماركة → سعر → إضافة → تفاصيل → يناسب → نفس الماركة */
  $("#sheetCard").innerHTML=`
    <button class="text-back" id="closeSheet" type="button" aria-label="${T("back")}">‹ ${T("back")}</button>
    ${typeof reviewHTML==="function"?reviewHTML(p):""}
    ${carouselHTML(p, galleryIndex)}
    <div class="sheet-head">
      <h3 id="sheetTitle">${esc(pname(p))}</h3>
      ${brandBtn}
    </div>
    ${priceHTML(p)}
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
      ${typeof naqaPairSectionHTML==="function"?naqaPairSectionHTML(p):""}
      ${typeof naqaSameBrandHTML==="function"?naqaSameBrandHTML(p):""}
    `}
`;
  $("#sheet").classList.add("show");
  const sh=$("#sheet"); if(sh){ sh.setAttribute("aria-modal","true"); sh.setAttribute("aria-labelledby","sheetTitle"); }
  lockBodyScroll();
  $("#sheetCard").scrollTop=0;
  bindCarousel(p);
  document.title=pname(p)+" · Naqa";
  try{
    if(!qv){
      var cur = routeHash();
      if(cur.indexOf("p/")!==0){
        window.__naqaShopHash = (location.hash && location.hash!=="#") ? location.hash : "#shop";
      }
      if(cur!=="p/"+id) history.pushState({naqa:"product",id}, "", "#p/"+id);
    }
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
