function applyLang(){
  document.documentElement.lang=lang==="en"?"en":"ar";
  document.documentElement.dir=lang==="en"?"ltr":"rtl";
  $("#search").placeholder=T("search");
  document.querySelectorAll("#cats a").forEach(a=>{
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
    const base=(typeof wishView!=="undefined" && wishView)?T("saved"):T("products");
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
  $("#footBlurb").innerHTML=T("blurb")+"<br/>www.naqa.om";
  const bar=$("#shipBar"); if(bar) bar.textContent=T("shipBar");
  const quiz=$("#heroQuiz"); if(quiz) quiz.textContent=T("quizBtn");
  document.title = openProductId ? (pname(products.find(x=>x.id===openProductId)||{})+" · Naqa") : T("docTitle");
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
    });
    if(typeof fillAreas==="function") fillAreas();
    const cancel=$("#checkoutCancel"); if(cancel) cancel.textContent=T("coCancel");
    const send=$("#checkoutSend"); if(send) send.textContent=T("coSend");
  }
  const sf=$("#shipFree"); if(sf) sf.textContent=T("shipFree");
  const vb=$("#vatBar"); if(vb) vb.textContent=T("vatBar")||T("vatInc");
  const pt=$("#payTitle"); if(pt) pt.textContent=T("payTitle");
  const pcl=$("#payCodLab"); if(pcl) pcl.textContent=T("payCod");
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

function render(){
  applyLang();
  const q=query.toLowerCase();
  const list=products.filter(p=>{
    if(p.hidden) return false;
    const catOk=currentCat==="all"||p.cat===currentCat;
    const brandOk=!currentBrand || p.brand===currentBrand;
    const concernOk=!currentConcern || (p.concerns&&p.concerns.indexOf(currentConcern)>=0);
    const viewingWish=(typeof wishView!=="undefined" && wishView);
    const wishOk=!viewingWish || (typeof isWish==="function" && isWish(p.id));
    const okPrice=typeof priceOk!=="function" || priceOk(p);
    const blob=[p.nameAr,p.nameEn,p.brand,p.sku,p.descAr,p.descEn].join(" ").toLowerCase();
    return catOk && brandOk && concernOk && wishOk && okPrice && (!q || blob.includes(q));
  });
  const offOf=p=>(p.was&&p.was>p.price)?(1-p.price/p.was):0;
  list.sort((a,b)=>{
    if(currentSort==="price-asc") return a.price-b.price;
    if(currentSort==="price-desc") return b.price-a.price;
    if(currentSort==="off") return offOf(b)-offOf(a)||a.price-b.price;
    if(currentSort==="wish") return ((typeof isWish==="function"&&isWish(b.id))?0:1)-((typeof isWish==="function"&&isWish(a.id))?0:1)||b.id-a.id;
    return b.id-a.id;
  });
  const bar=$("#brandBar");
  let chips="";
  if(typeof wishView!=="undefined" && wishView) chips+='<button type="button" class="brand-chip" id="clearWish">'+T("saved")+' ×</button>';
  if(currentBrand) chips+='<button type="button" class="brand-chip" id="clearBrand">'+esc(currentBrand)+' ×</button>';
  if(currentConcern) chips+='<button type="button" class="brand-chip" id="clearConcern">'+esc(typeof concernLabel==="function"?concernLabel(currentConcern):currentConcern)+' ×</button>';
  if(chips){
    bar.hidden=false; bar.innerHTML=chips;
    const cw=$("#clearWish"); if(cw) cw.onclick=()=>{ wishView=false; render(); };
    const clear=$("#clearBrand"); if(clear) clear.onclick=()=>{ currentBrand=""; render(); };
    const cc=$("#clearConcern"); if(cc) cc.onclick=()=>{ currentConcern=""; render(); };
  } else { bar.hidden=true; bar.innerHTML=""; }
  $("#countLabel").textContent=T("count")(list.length);
  $("#empty").hidden=list.length>0;
  const catTotal=currentCat==="all"?products.length:products.filter(x=>x.cat===currentCat).length;
  const soon=currentCat!=="all" && catTotal===0;
  $("#empty").textContent=soon
    ? (lang==="en"?"This section is coming soon. The other sections are ready.":"هذا القسم قريباً. باقي الأقسام فيها منتجات.")
    : ((typeof wishView!=="undefined" && wishView && !list.length)?T("wishEmpty"):T("empty"));
  if(typeof renderPriceBar==="function") renderPriceBar();
  $("#grid").innerHTML=list.map(cardHTML).join("");
  renderShelves();
  if(typeof renderBrandsGrid==="function") renderBrandsGrid();
  if(typeof renderBundles==="function") renderBundles();
  if(typeof renderConcernBar==="function") renderConcernBar();
  if(typeof renderTrust==="function") renderTrust();
  renderCart();
  if(openProductId) openSheet(openProductId, sheetMode, false);
}

function galleryList(p){
  // up to 5 real photos only (thumbs stay small). Arabic card is separate optional first for AR.
  return pimgs(p).slice(0,5);
}
