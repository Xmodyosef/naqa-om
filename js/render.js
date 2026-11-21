/* render: cards, shelves, grid, lang */
function offPct(p){
  if(!(p.was>p.price)) return 0;
  return Math.round((1-p.price/p.was)*100);
}
function priceHTML(p){
  const pct=offPct(p);
  if(!pct) return '<div class="card-price">'+money(p.price)+'</div>';
  return '<div class="card-price"><span class="off">−'+pct+'%</span>'+money(p.price)+' <s class="was">'+money(p.was)+'</s></div>';
}

function visual(p, idx){
  const imgs=pimgs(p); const i=idx||0;
  if(imgs[i]){
    const pri=i===0?' loading="lazy" decoding="async"':' loading="lazy" decoding="async"';
    return '<img src="'+imgs[i]+'" alt="'+esc(pname(p))+'"'+pri+'>';
  }
  return '<span style="font-size:2rem;display:grid;place-items:center;height:100%">'+ (p.em||'✨') +'</span>';
}
function cardHTML(p){
  const pct=offPct(p);
  const tags=(pct?'<span class="tag-off">'+esc(T("offTag")(pct))+'</span>':'')+(p.hot?'<span class="tag-hot">'+esc(T("hot"))+'</span>':'');
  const qty=(cart.find(c=>c.id===p.id)||{}).qty;
  return '<article class="card" data-id="'+p.id+'">'
    +'<div class="card-visual" data-open="'+p.id+'">'
    +'<button type="button" class="wish-btn'+(typeof isWish==='function'&&isWish(p.id)?' on':'')+'" data-wish="'+p.id+'" aria-label="wishlist">♥</button>'
    +'<span class="card-cart-chip'+(qty?' show':'')+'" data-chip="'+p.id+'">'+(qty?('×'+qty):'')+'</span>'
    +tags+visual(p,0)+'</div>'
    +'<div class="card-body">'
    +brandMark(p.brand)
    +'<div class="card-brand">'+esc(T(catLabel[p.cat]||"all"))+'</div>'
    +'<button class="card-name" data-open="'+p.id+'" type="button">'+esc(pname(p))+'</button>'
    +'<div class="card-desc">'+esc(pdesc(p))+'</div>'
    +'<div class="card-code">'+T("sku")+': '+(p.sku||T("noSku"))+'</div>'
    +priceHTML(p)
    +'<div class="card-actions">'
    +'<button class="btn-qv" data-qv="'+p.id+'" type="button">'+T("qv")+'</button>'
    +'<button class="btn-add" data-add="'+p.id+'" type="button">'+T("add")+'</button>'
    +'<button class="btn-open" data-open="'+p.id+'" type="button">'+T("open")+'</button>'
    +'</div></div></article>';
}
function shelfBanner(kind, list){
  const thumbs=list.slice(0,4).map(p=>{
    const imgs=pimgs(p);
    if(imgs[0]) return '<img src="'+imgs[0]+'" alt="" loading="lazy">';
    return '<span class="em">'+(p.em||"✨")+'</span>';
  }).join("");
  if(kind==="hot"){
    return '<div class="banner banner-hot" data-shelf="hot"><div class="banner-copy"><b>'+T("hot")+'</b><span>'+T("banHotSub")+'</span><span class="banner-badge">★ '+(lang==='ar'?'مختارات':'Top picks')+'</span></div><div class="banner-thumbs">'+thumbs+'</div></div>';
  }
  return '<div class="banner banner-year" data-shelf="year"><div class="banner-copy"><b>'+T("year")+'</b><span>'+T("banYearSub")+'</span><span class="banner-badge">−30%</span></div><div class="banner-thumbs">'+thumbs+'</div></div>';
}
function renderShelves(){
  const box=$("#shelves");
  if(!box) return;
  const show=!query && currentCat==="all" && !currentBrand && !(typeof wishView!=="undefined" && wishView);
  if(!show){ box.innerHTML=""; box.hidden=true; return; }
  box.hidden=false;
  const hot=products.filter(p=>p.hot).slice(0,12);
  const year=products.filter(p=>p.was>p.price).sort((a,b)=>offPct(b)-offPct(a)).slice(0,16);
  let html="";
  if(hot.length){
    html+='<section class="shelf">'+shelfBanner("hot", hot)
      +'<div class="shelf-head"><h3 id="hotTitle">'+T("hot")+'</h3>'
      +'<button type="button" data-shelf="hot">'+T("viewAll")+'</button></div>'
      +'<div class="shelf-row">'+hot.map(cardHTML).join("")+'</div></section>';
  }
  if(year.length){
    html+='<section class="shelf">'+shelfBanner("year", year)
      +'<div class="shelf-head"><h3 id="yearTitle">'+T("year")+'</h3>'
      +'<button type="button" data-shelf="year">'+T("viewAll")+'</button></div>'
      +'<div class="shelf-row">'+year.map(cardHTML).join("")+'</div></section>';
  }
  box.innerHTML=html;
}

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
  $("#products").textContent=(typeof wishView!=="undefined" && wishView)?T("saved"):T("products");
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
      lab.childNodes[0].textContent=T(key);
      if(ctrl && key!=="coGov") ctrl.placeholder=T(key+"Ph");
    });
    const gov=$("#coGov");
    if(gov){
      const cur=gov.value;
      const list=T("govs");
      gov.innerHTML='<option value="">'+T("coGovPh")+"</option>"+list.map(g=>'<option>'+g+"</option>").join("");
      if(cur) gov.value=cur;
    }
    const cancel=$("#checkoutCancel"); if(cancel) cancel.textContent=T("coCancel");
    const send=$("#checkoutSend"); if(send) send.textContent=T("coSend");
  }
  const sf=$("#shipFree"); if(sf) sf.textContent=T("shipFree");
  const sel=$("#sortSel");
  if(sel){
    const wishOpt=sel.querySelector('option[value="wish"]'); if(wishOpt) wishOpt.remove();
    const labels=[T("sortNew"),T("sortLow"),T("sortHigh"),T("sortOff")];
    for(let i=0;i<sel.options.length && i<labels.length;i++) sel.options[i].text=labels[i];
    if(currentSort==="wish") currentSort="new";
    sel.value=currentSort;
  }
}

function render(){
  applyLang();
  const q=query.toLowerCase();
  const list=products.filter(p=>{
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
