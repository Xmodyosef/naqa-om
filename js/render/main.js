
function syncShipMarquee(){
  var bar=document.getElementById("shipBar");
  var bar2=document.getElementById("shipBar2");
  var mq=document.getElementById("shipMarquee");
  var wrap=document.getElementById("shipBarWrap");
  if(!bar||!bar2||!mq) return;
  var phrase=(typeof T==="function"?T("shipBar"):bar.textContent)||"";
  phrase=String(phrase).replace(/\s+/g," ").trim();
  if(!phrase) return;
  var dir=(typeof lang!=="undefined" && lang==="en")?"ltr":"rtl";
  bar.setAttribute("dir", dir);
  bar2.setAttribute("dir", dir);
  mq.classList.toggle("is-rtl", dir==="rtl");
  bar.textContent="";
  var probe=document.createElement("span");
  probe.className="ship-chunk";
  probe.textContent=phrase;
  bar.appendChild(probe);
  var unitW=probe.offsetWidth||1;
  var view=(wrap&&wrap.clientWidth)||window.innerWidth||390;
  var n=Math.max(2, Math.ceil(view/unitW)+1);
  function fillTrack(el){
    el.textContent="";
    for(var i=0;i<n;i++){
      var chunk=document.createElement("span");
      chunk.className="ship-chunk";
      chunk.textContent=phrase;
      el.appendChild(chunk);
    }
  }
  fillTrack(bar);
  fillTrack(bar2);
  var shift=Math.round(bar.getBoundingClientRect().width);
  if(shift<1) return;
  mq.style.setProperty("--ship-shift", (-shift)+"px");
  mq.style.setProperty("--ship-dur", Math.max(16, shift/48)+"s");
}
function applyLang(){
  document.documentElement.lang=lang==="en"?"en":"ar";
  document.documentElement.dir=lang==="en"?"ltr":"rtl";
  const sEl=$("#search"); if(sEl) sEl.placeholder=T("searchHint")||T("search");
  const sg=$("#searchGo"); if(sg) sg.textContent=T("searchBtn")||(lang==="en"?"Search":"بحث");
  document.querySelectorAll("#cats [data-cat]").forEach(a=>{
    const base=T(catLabel[a.dataset.cat]||"all");
    const n=a.dataset.cat==="all"?products.length:products.filter(x=>x.cat===a.dataset.cat).length;
    a.textContent=n?base:(base+" · "+(lang==="en"?"Soon":"قريباً"));
  });
  $("#heroTitle").innerHTML=T("heroTitle")+"<em>"+T("heroEm")+"</em>";
  $("#heroText").textContent=T("hero");
  $("#btnShop").textContent=T("shop");
  $("#waHero").textContent=T("wa");
  const prodH=$("#products");
  if(prodH){
    let base;
    if(typeof wishView!=="undefined" && wishView) base=T("saved");
    else if(query && String(query).trim()){
      // title filled after list length known in render(); temporary
      base=T("products");
    } else base=T("products");
    prodH.innerHTML=base+' <span class="vat-chip">'+(T("vatInc")||"شامل الضريبة ٥٪")+'</span>';
  }
  const hb=$("#wishBtn"); if(hb){ hb.classList.toggle("on", typeof wishView!=="undefined" && !!wishView); hb.title=(typeof wishView!=="undefined" && wishView)?T("savedOn"):T("saved"); }
  $("#cartTitle").textContent=T("cart");
  $("#totalLabel").textContent=T("total");
  $("#checkoutBtn").textContent=T("checkout");
  $("#langBtn").textContent=lang==="ar"?"EN":"AR";
  $("#logoName").textContent=T("logo");
  $("#logoTag").textContent=T("tag");
  $("#pillShip").textContent=T("ship");
  $("#pillWa").textContent=T("order");
  $("#footContact").textContent=T("contact");
  $("#footShop").textContent=T("shopH");
  $("#jumpCare").textContent=T("skin");
  $("#jumpFace").textContent=T("faceL");
  $("#jumpHair").textContent=T("hairL");
  $("#copyLine").textContent=T("copy");
  $("#waFooter").textContent=T("orders");
  $("#footBlurb").innerHTML=(T("footAbout")||T("blurb")||"")+"<br/>www.naqa.om";
  if(typeof syncShipMarquee==="function") syncShipMarquee();
  const quiz=$("#heroQuiz"); if(quiz) quiz.textContent=T("quizBtn");
  document.title = openProductId ? (pname(products.find(x=>x.id===openProductId)||{})+" · Naqa") : T("docTitle");

  // SEO meta bilingual
  (function(){
    var descAr="نقاء — عناية ومكياج أصلية. توصيل لجميع ولايات عُمان. طلب سريع عبر واتساب.";
    var descEn="Naqa — authentic skincare & makeup. Delivery across Oman. Fast WhatsApp ordering.";
    var titleAr="نقاء · عناية ومكياج | www.naqa.om";
    var titleEn="Naqa · Skincare & Makeup | Oman";
    var md=document.getElementById("metaDesc");
    if(md) md.setAttribute("content", lang==="en"?descEn:descAr);
    var ogt=document.getElementById("ogTitle");
    if(ogt) ogt.setAttribute("content", lang==="en"?titleEn:titleAr);
    var ogd=document.getElementById("ogDesc");
    if(ogd) ogd.setAttribute("content", lang==="en"?descEn:descAr);
  })();

  const mark=document.querySelector(".logo-mark"); if(mark) mark.textContent = lang==="en" ? "N" : "ن";
  const fb=$("#footBrand"); if(fb) fb.innerHTML = lang==="en" ? "Na<span>qa</span>" : "ن<span>قاء</span>";
  const co=$("#coTitle"); if(co){
    co.textContent=T("coTitle");
    const hint=document.querySelector(".co-hint"); if(hint) hint.textContent=T("coHint");
    const setLab=(id,key)=>{ const el=document.querySelector('label[data-for="'+id+'"]'); if(el){ const input=el.querySelector("input,select,textarea"); const ph=T(key+"Ph"); if(input && input.placeholder!==undefined && key!=="coGov") input.placeholder=ph; el.firstChild.textContent=T(key); } };
    [["coName","coName"],["coPhone","coPhone"],["coGov","coGov"],["coNote","coNote"]].forEach(([id,key])=>{
      const lab=document.querySelector('label[data-field="'+id+'"]');
      if(!lab) return;
      const ctrl=lab.querySelector("input,select,textarea");
      if(!ctrl) return;
      Array.from(lab.childNodes).forEach(function(n){ if(n.nodeType===3) n.parentNode.removeChild(n); });
      lab.insertBefore(document.createTextNode(T(key)+" "), ctrl);
      if(key!=="coGov" && ctrl.placeholder!==undefined) ctrl.placeholder=T(key+"Ph");
      ctrl.setAttribute("aria-label", T(key));
    });
    const payCod=$("#payCod"); if(payCod) payCod.setAttribute("aria-label", T("payCod"));
    const payPaid=$("#payPaid"); if(payPaid) payPaid.setAttribute("aria-label", T("payPaid"));
    if(typeof fillAreas==="function") fillAreas();
    const cancel=$("#checkoutCancel"); if(cancel) cancel.textContent=T("coCancel");
    const send=$("#checkoutSend"); if(send) send.textContent=T("coSend");
  }
  const sf=$("#shipFree"); if(sf) sf.textContent=T("shipFree");
  const vb=$("#vatBar"); if(vb) vb.textContent=T("vatBar")||T("vatInc");
    const pt=$("#payTitle"); if(pt) pt.textContent=T("payTitle");
  const pcl=$("#payCodLab"); if(pcl) pcl.textContent=T("payCod");
  const ph=$("#payHint"); if(ph) ph.textContent=T("payHint")||ph.textContent;
  const ppl=$("#payPaidLab"); if(ppl) ppl.textContent=T("payPaid");
  if(typeof updatePaySum==="function") updatePaySum();
  const sel=$("#sortSel");
  if(sel){
    const wishOpt=sel.querySelector('option[value="wish"]'); if(wishOpt) wishOpt.remove();
    const labels=[T("sortNew"),T("sortLow"),T("sortHigh"),T("sortOff")];
    for(let i=0;i<sel.options.length && i<labels.length;i++) sel.options[i].text=labels[i];
    if(currentSort==="wish") currentSort="new";
    sel.value=currentSort;
  }
  const qm=$("#quizModal");
  if(qm && qm.classList.contains("show") && typeof paintQuiz==="function") paintQuiz();
}


function naqaNorm(s){
  return String(s||"")
    .toLowerCase()
    .replace(/[أإآٱ]/g,"ا")
    .replace(/ة/g,"ه")
    .replace(/ى/g,"ي")
    .replace(/[\u064B-\u065F]/g,"")
    .replace(/[^\w\u0600-\u06FF]+/g," ")
    .replace(/\s+/g," ")
    .trim();
}
/* synonym groups: any token expands to the whole set */
var NAQA_SEARCH_SYN = [
  ["scrub","scurb","سكراب","سكرب","مقشر","تقشير","exfol","exfoliat"],
  ["serum","سيروم","أمبول","ampoule","ampule"],
  ["cream","كريم","مرطب","moisturizer","moisturiser"],
  ["cleanser","غسول","منظف","wash","foam","cleanser"],
  ["toner","تونر","تونر"],
  ["mask","ماسك","قناع","sheet mask"],
  ["spf","sunscreen","واقي","شمس","sun screen"],
  ["oil","زيت","face oil"],
  ["lip","شفاه","ليبس","lipstick","gloss"],
  ["eye","عيون","رموش","mascara","كحل"],
  ["brow","حواجب","eyebrow"],
  ["hair","شعر","شامبو","shampoo","conditioner"],
  ["perfume","عطر","fragrance","mist"]
];
function naqaExpandQuery(q){
  var n = naqaNorm(q);
  if(!n) return [];
  var terms = new Set([n]);
  // also each word
  n.split(" ").forEach(function(w){ if(w.length>=2) terms.add(w); });
  NAQA_SEARCH_SYN.forEach(function(group){
    var hit = group.some(function(g){ return n.indexOf(naqaNorm(g))>=0 || Array.from(terms).some(function(t){ return t.indexOf(naqaNorm(g))>=0 || naqaNorm(g).indexOf(t)>=0; }); });
    if(hit) group.forEach(function(g){ terms.add(naqaNorm(g)); });
  });
  return Array.from(terms).filter(Boolean);
}
function productMatchesQuery(p, rawQ){
  if(!rawQ) return true;
  var q = String(rawQ).trim();
  if(!q) return true;
  var sku = String(p.sku||"");
  var digits = q.replace(/\D/g,"");
  // barcode / SKU: exact, prefix, or includes (4+ digits)
  if(sku){
    if(sku === q || sku.indexOf(q) >= 0) return true;
    if(digits.length >= 4 && sku.indexOf(digits) >= 0) return true;
  }
  var terms = naqaExpandQuery(q);
  var brandN = naqaNorm(p.brand);
  // brand-only: whole query matches brand
  if(brandN && (brandN === naqaNorm(q) || brandN.indexOf(naqaNorm(q)) >= 0 || naqaNorm(q).indexOf(brandN) >= 0)) return true;
  var blob = naqaNorm([
    p.nameAr, p.nameEn, p.brand, p.sku, p.cat,
    p.descAr, p.descEn, p.useAr, p.useEn, p.skinAr, p.skinEn, p.em
  ].join(" "));
  // all significant terms? use ANY term match for UX (OR), but prefer multi-word soft
  return terms.some(function(t){ return t.length >= 2 && blob.indexOf(t) >= 0; });
}


function productSearchScore(p, rawQ){
  if(!rawQ) return 0;
  var q = String(rawQ).trim();
  var nq = naqaNorm(q);
  var sku = String(p.sku||"");
  var digits = q.replace(/\D/g,"");
  var score = 0;
  // exact / strong SKU
  if(sku){
    if(sku === q || naqaNorm(sku) === nq) score += 1000;
    else if(sku.indexOf(q) === 0 || (digits.length>=4 && sku.indexOf(digits)===0)) score += 800;
    else if(sku.indexOf(q) >= 0 || (digits.length>=4 && sku.indexOf(digits)>=0)) score += 600;
  }
  var brandN = naqaNorm(p.brand);
  if(brandN && nq){
    if(brandN === nq) score += 500;
    else if(brandN.indexOf(nq) === 0 || nq.indexOf(brandN) === 0) score += 350;
    else if(brandN.indexOf(nq) >= 0 || nq.indexOf(brandN) >= 0) score += 200;
  }
  var nameN = naqaNorm((lang==="en"? (p.nameEn||p.nameAr) : (p.nameAr||p.nameEn))||"");
  if(nameN && nq){
    if(nameN === nq) score += 450;
    else if(nameN.indexOf(nq) === 0) score += 300;
    else if(nameN.indexOf(nq) >= 0) score += 180;
  }
  var terms = naqaExpandQuery(q);
  var blob = naqaNorm([p.nameAr,p.nameEn,p.brand,p.sku,p.cat,p.descAr,p.descEn,p.useAr,p.useEn,p.skinAr,p.skinEn].join(" "));
  terms.forEach(function(t){ if(t.length>=2 && blob.indexOf(t)>=0) score += 20; });
  if(p.hot) score += 8;
  if(p.was && p.was > p.price) score += 5;
  return score;
}
function isExactProductMatch(p, rawQ){
  if(!rawQ) return false;
  var q = String(rawQ).trim();
  var sku = String(p.sku||"");
  if(sku && (sku === q || sku === q.replace(/\s/g,""))) return true;
  var nq = naqaNorm(q);
  var nameN = naqaNorm((p.nameAr||"")+" "+(p.nameEn||""));
  // whole name equality (either lang)
  if(naqaNorm(p.nameAr) === nq || naqaNorm(p.nameEn) === nq) return true;
  return false;
}

function render(){
  applyLang();
  const q=query;
  const searching=!!(q && String(q).trim());
  const list=products.filter(p=>{
    if(p.hidden) return false;
    // أثناء البحث: لا نقيّد بالتصنيف/الماركة المختارة عشان SKU والماركة والكلمات تطلع كل المطابق
    const catOk=searching || currentCat==="all" || p.cat===currentCat;
    const brandOk=searching || !currentBrand || p.brand===currentBrand;
    const concernOk=searching || !currentConcern || (p.concerns&&p.concerns.indexOf(currentConcern)>=0);
    const viewingWish=(typeof wishView!=="undefined" && wishView);
    const wishOk=!viewingWish || (typeof isWish==="function" && isWish(p.id));
    const okPrice=typeof priceOk!=="function" || priceOk(p);
    const textOk=!searching || productMatchesQuery(p, q);
    const catalogOk=searching || !currentCatalog || typeof catalogMatch!=="function" || catalogMatch(p, currentCatalog);
    return catOk && brandOk && concernOk && wishOk && okPrice && textOk && catalogOk;
  });
  const offOf=p=>(p.was&&p.was>p.price)?(1-p.price/p.was):0;
  list.sort((a,b)=>{
    if(searching){
      const sa=productSearchScore(a,q), sb=productSearchScore(b,q);
      if(sb!==sa) return sb-sa;
    }
    if(currentSort==="price-asc") return a.price-b.price;
    if(currentSort==="price-desc") return b.price-a.price;
    if(currentSort==="off") return offOf(b)-offOf(a)||a.price-b.price;
    if(currentSort==="wish") return ((typeof isWish==="function"&&isWish(b.id))?0:1)-((typeof isWish==="function"&&isWish(a.id))?0:1)||b.id-a.id;
    return b.id-a.id;
  });
  // Search results title + clear chip
  if(searching){
    const prodH=$("#products");
    if(prodH && typeof T==="function" && T("searchResults")){
      prodH.innerHTML=esc(T("searchResults")(q, list.length))+' <span class="vat-chip">'+(T("vatInc")||"")+'</span>';
    }
  }

  const bar=$("#brandBar");
  let chips="";
  if(typeof wishView!=="undefined" && wishView) chips+='<button type="button" class="brand-chip" id="clearWish">'+T("saved")+' ×</button>';
  if(searching) chips+='<button type="button" class="brand-chip" id="clearSearch">⌕ '+esc(q)+' ×</button>';
  if(currentBrand) chips+='<button type="button" class="brand-chip" id="clearBrand">'+esc(currentBrand)+' ×</button>';
  if(currentConcern) chips+='<button type="button" class="brand-chip" id="clearConcern">'+esc(typeof concernLabel==="function"?concernLabel(currentConcern):currentConcern)+' ×</button>';
  if(currentCatalog) chips+='<button type="button" class="brand-chip" id="clearCatalog">'+esc(typeof catalogLabel==="function"?catalogLabel(currentCatalog):currentCatalog)+' ×</button>';
  if(chips){
    bar.hidden=false; bar.innerHTML=chips;
    const cw=$("#clearWish"); if(cw) cw.onclick=()=>{ wishView=false; render(); };
    const cs=$("#clearSearch"); if(cs) cs.onclick=()=>{
      query=""; const s=$("#search"); if(s) s.value="";
      const clr=$("#searchClear"); if(clr) clr.hidden=true;
      try{ history.pushState({naqa:"shop"}, "", "#shop"); }catch(e){}
      render();
    };
    const clear=$("#clearBrand"); if(clear) clear.onclick=()=>{ currentBrand=""; render(); };
    const cc=$("#clearConcern"); if(cc) cc.onclick=()=>{ currentConcern=""; render(); };
    const ccat=$("#clearCatalog"); if(ccat) ccat.onclick=()=>{ if(typeof backToCatalogs==="function") backToCatalogs(); else { currentCatalog=""; render(); } };
  } else { bar.hidden=true; bar.innerHTML=""; }
  $("#countLabel").textContent=T("count")(list.length);
  var home = (typeof isHomeCatalogView==="function") ? isHomeCatalogView() : (!query && currentCat==="all" && !currentBrand && !currentConcern && !(typeof wishView!=="undefined" && wishView) && !currentCatalog);
  try{
    var hero=$("#catalogHero");
    if(hero){ hero.hidden=true; hero.innerHTML=""; }
    var secHead=document.querySelector(".section-head");
    var priceBar=$("#priceBar");
    var gridEl=$("#grid");
    var empty=$("#empty");
    if(home){
      if(secHead) secHead.hidden=true;
      if(priceBar) priceBar.hidden=true;
      if(gridEl){ gridEl.innerHTML=""; gridEl.hidden=true; }
      if(empty) empty.hidden=true;
    } else {
      if(secHead) secHead.hidden=false;
      if(gridEl) gridEl.hidden=false;
      if(priceBar) priceBar.hidden=false;
      /* title: catalog / brand / category + back to catalogs */
      var titleEl=$("#products");
      if(titleEl && !(query && String(query).trim())){
        var label;
        if(typeof wishView!=="undefined" && wishView) label=T("saved");
        else if(currentCatalog && typeof catalogLabel==="function") label=catalogLabel(currentCatalog);
        else if(currentBrand) label=(lang==="en"?"Brand · ":"ماركة · ")+currentBrand;
        else if(currentCat && currentCat!=="all") label=T(catLabel[currentCat]||"all");
        else label=T("products");
        var backBtn='<button type="button" class="cat-back" id="backCatalogs" aria-label="'+(lang==="en"?"Back to catalogs":"رجوع للكتالوجات")+'">‹</button> ';
        titleEl.innerHTML=backBtn+esc(label)+' <span class="vat-chip">'+(T("vatInc")||"")+'</span>';
        var bk=document.getElementById("backCatalogs");
        if(bk) bk.onclick=function(){ if(typeof backToCatalogs==="function") backToCatalogs(); };
      }
      if(currentBrand && !query && !currentCatalog){
        if(!hero){
          hero=document.createElement("div");
          hero.id="catalogHero";
          hero.className="catalog-hero catalog-hero-soft";
          if(gridEl && gridEl.parentNode) gridEl.parentNode.insertBefore(hero, gridEl);
        }
        hero.hidden=false;
        hero.innerHTML='<div class="catalog-hero-inner">'
          +'<div class="catalog-hero-copy"><b>'+esc(currentBrand)+'</b>'
          +'<span>'+T("count")(list.length)+'</span></div>'
          +'<button type="button" class="catalog-hero-clear" id="clearBrandHero">'+(lang==="en"?"Clear":"مسح")+'</button>'
          +'</div>';
        var cb=document.getElementById("clearBrandHero");
        if(cb) cb.onclick=function(){ currentBrand=""; try{ history.pushState({naqa:"shop"},"","#shop"); }catch(e){} render(); };
      }
      if(empty){
        empty.hidden=list.length>0;
        const catTotal=currentCat==="all"?products.length:products.filter(x=>x.cat===currentCat).length;
        const soon=currentCat!=="all" && catTotal===0 && !currentCatalog;
        empty.textContent=soon
          ? (lang==="en"?"This section is coming soon. The other sections are ready.":"هذا القسم قريباً. باقي الأقسام فيها منتجات.")
          : ((typeof wishView!=="undefined" && wishView && !list.length)?T("wishEmpty"):T("empty"));
      }
      if(typeof renderPriceBar==="function") renderPriceBar();
      if(gridEl) gridEl.innerHTML=list.map(cardHTML).join("");
    }
  }catch(e){
    try{ $("#empty").hidden=list.length>0; $("#grid").innerHTML=list.map(cardHTML).join(""); }catch(err){}
  }
  renderShelves();
  if(typeof renderBrandsGrid==="function") renderBrandsGrid();
  if(typeof renderBundles==="function") renderBundles();
  if(typeof renderConcernBar==="function") renderConcernBar();
  if(typeof renderTrust==="function") renderTrust();
  renderCart();
  if(window.naqaTheme){ naqaTheme.bind(); naqaTheme.apply(); }
  if(openProductId) openSheet(openProductId, sheetMode, false);
}

function galleryList(p){
  // up to 5 real photos only (thumbs stay small). Arabic card is separate optional first for AR.
  return pimgs(p).slice(0,6);
}

window.addEventListener("resize", function(){ if(window.__naqaShipResize) cancelAnimationFrame(window.__naqaShipResize); window.__naqaShipResize=requestAnimationFrame(function(){ if(typeof syncShipMarquee==="function") syncShipMarquee(); }); });
