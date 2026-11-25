
function cartLineQty(id){
  id = Number(id);
  try{
    var row = (typeof cart!=="undefined" && cart)? cart.find(function(c){ return Number(c.id)===id; }) : null;
    return row ? Number(row.qty)||0 : 0;
  }catch(e){ return 0; }
}
/** Add button or qty stepper once item is in cart */
function productCartControls(id, opts){
  opts = opts || {};
  id = Number(id);
  var p = (typeof products!=="undefined") ? products.find(function(x){ return Number(x.id)===id; }) : null;
  var out = p && p.stock!=null && Number(p.stock)<=0;
  var q = cartLineQty(id);
  var sheet = !!opts.sheet;
  var en = (typeof lang!=="undefined" && lang==="en");
  if(out && q<=0){
    return '<button class="btn-add'+(sheet?' card-add':'')+'" type="button" disabled>'+(en?"Out":"نفد")+'</button>';
  }
  if(q>0){
    return '<div class="inline-qty'+(sheet?' sheet-inline-qty':'')+'" data-inline-qty="'+id+'" role="group" aria-label="'+(typeof T==="function"?T("qty"):"qty")+'">'
      +'<button type="button" data-dec="'+id+'" aria-label="'+(en?"Decrease":"تقليل")+'">−</button>'
      +'<b aria-live="polite">'+q+'</b>'
      +'<button type="button" data-inc="'+id+'" aria-label="'+(en?"Increase":"زيادة")+'">+</button>'
      +'</div>';
  }
  var label = en ? "Add to cart" : "أضف للسلة";
  if(typeof T==="function" && T("addCart")) label = T("addCart");
  if(sheet){
    return '<button class="btn-add card-add sheet-add-cta" data-add="'+id+'" type="button">'+label+'</button>';
  }
  return '<button class="btn-add card-add-cta" data-add="'+id+'" type="button">'+label+'</button>';
}
function refreshSheetCartControls(){
  try{
    if(typeof openProductId==="undefined" || !openProductId) return;
    var box = document.getElementById("sheetActions");
    if(!box) return;
    var p = products.find(function(x){ return Number(x.id)===Number(openProductId); });
    if(!p) return;
    var wish = box.querySelector("[data-wish]");
    if(wish){
      wish.classList.toggle("on", typeof isWish==="function" && isWish(p.id));
    }
    var cartEl = box.querySelector(".sheet-inline-qty, .inline-qty, .sheet-add-cta, button[data-add], button.btn-add.card-add");
    var html = productCartControls(p.id, { sheet:true });
    if(cartEl){
      var wrap = document.createElement("div");
      wrap.innerHTML = html;
      if(wrap.firstChild) cartEl.replaceWith(wrap.firstChild);
    } else {
      var wishOn = typeof isWish==="function" && isWish(p.id) ? " on" : "";
      var qv = typeof sheetMode!=="undefined" && sheetMode==="qv";
      var en = (typeof lang!=="undefined" && lang==="en");
      box.innerHTML =
        '<button class="btn-wish-sheet'+wishOn+'" data-wish="'+p.id+'" type="button" aria-label="'+(en?"Save":"حفظ")+'">♥</button>'
        + html
        + (qv ? '<button class="btn-open" data-open="'+p.id+'" type="button">'+(typeof T==="function"?T("open"):"")+'</button>' : "");
    }
  }catch(e){}
}
/** Update only cart chips + add/qty controls on cards — no full page re-render (stops flash). */
function refreshCardCartControls(){
  try{
    document.querySelectorAll(".card[data-id]").forEach(function(card){
      var id = Number(card.dataset.id);
      if(!id) return;
      var q = cartLineQty(id);
      var chip = card.querySelector(".card-cart-chip");
      if(chip){
        if(q>0){ chip.classList.add("show"); chip.textContent = "×"+q; }
        else { chip.classList.remove("show"); chip.textContent = ""; }
      }
      var actions = card.querySelector(".card-actions");
      if(!actions) return;
      var old = actions.querySelector(".inline-qty, button.btn-add, button.card-add-cta");
      if(!old) return;
      var wrap = document.createElement("div");
      wrap.innerHTML = productCartControls(id, {});
      if(wrap.firstChild) old.replaceWith(wrap.firstChild);
    });
  }catch(e){}
}
function refreshProductCartUI(){
  /* Surgical update only — full render() was flashing the whole page on qty change. */
  refreshSheetCartControls();
  refreshCardCartControls();
}

/* render: cards, shelves, grid, lang */
function offPct(p){
  if(!(p.was>p.price)) return 0;
  return Math.round((1-p.price/p.was)*100);
}
function vatChip(){
  return '<span class="vat-chip">'+(typeof T==="function"?T("vatInc"):"شامل الضريبة ٥٪")+'</span>';
}
function priceHTML(p){
  const pct=offPct(p);
  const vat=typeof vatNoteHTML==="function"?vatNoteHTML():'<span class="vat-note">شامل الضريبة ٥٪</span>';
  if(!pct) return '<div class="card-price">'+money(p.price)+vat+'</div>';
  return '<div class="card-price"><span class="off">−'+pct+'%</span>'+money(p.price)+' <s class="was">'+money(p.was)+'</s>'+vat+'</div>';
}

function visual(p, idx){
  const imgs=pimgs(p); const i=idx||0;
  if(imgs[i]){
    const pri=i===0?' loading="lazy" decoding="async"':' loading="lazy" decoding="async"';
    return '<img src="'+esc(imgs[i])+'" alt="'+esc(pname(p))+'" width="800" height="800"'+pri+'>';
  }
  return '<span style="font-size:2rem;display:grid;place-items:center;height:100%">'+ (p.em||'✨') +'</span>';
}
function cardHTML(p){
  const pct=offPct(p);
  const tags=(pct?'<span class="tag-off">'+esc(T("offTag")(pct))+'</span>':'')+(p.hot?'<span class="tag-hot">'+esc(T("hot"))+'</span>':'')+(p.stock!=null && Number(p.stock)<=0?'<span class="tag-out">'+(lang==="en"?"Out of stock":"نفد")+'</span>':'');
  const qty=cartLineQty(p.id);
  const catLab=esc(T(catLabel[p.cat]||"all"));
  return '<article class="card card-v2" data-id="'+p.id+'" aria-label="'+esc(pname(p))+'">'
    +'<div class="card-visual" data-open="'+p.id+'">'
    +'<button type="button" class="wish-btn'+(typeof isWish==='function'&&isWish(p.id)?' on':'')+'" data-wish="'+p.id+'" aria-label="'+(lang==="en"?"Save to wishlist":"حفظ في المفضلة")+'">♥</button>'
    +'<span class="card-cart-chip'+(qty?' show':'')+'" data-chip="'+p.id+'">'+(qty?('×'+qty):'')+'</span>'
    +tags+visual(p,0)
    +'<div class="card-price-float">'+money(p.price)+'</div>'
    +'</div>'
    +'<div class="card-body">'
    +'<div class="card-meta-row">'
    +brandMark(p.brand, {nameOnly:true})
    +'<span class="card-cat-pill">'+catLab+'</span>'
    +'</div>'
    +'<button class="card-name" data-open="'+p.id+'" type="button">'+esc(pname(p))+'</button>'
    +(p.stock!=null && Number(p.stock)<=2?('<div class="card-code">'+(lang==="en"?"Low stock · ":"مخزون منخفض · ")+p.stock+'</div>'):'')
    +priceHTML(p)
    +'<div class="card-actions card-actions-v2">'
    +productCartControls(p.id, {})
    +'<button class="btn-open-ghost" data-open="'+p.id+'" type="button">'+T("open")+'</button>'
    +'</div></div></article>';
}
function shelfBanner(kind, list){
  const thumbs=list.slice(0,4).map(p=>{
    const imgs=pimgs(p);
    if(imgs[0]) return '<img src="'+esc(imgs[0])+'" alt="'+esc(pname(p))+'" width="120" height="120" loading="lazy">';
    return '<span class="em">'+(p.em||"✨")+'</span>';
  }).join("");
  if(kind==="hot"){
    return '<div class="banner banner-hot" data-shelf="hot"><div class="banner-copy"><b>'+T("hot")+'</b><span>'+T("banHotSub")+'</span><span class="banner-badge">★ '+(lang==='ar'?'مختارات':'Top picks')+'</span></div><div class="banner-thumbs">'+thumbs+'</div></div>';
  }
  return '<div class="banner banner-year" data-shelf="year"><div class="banner-copy"><b>'+T("year")+'</b><span>'+T("banYearSub")+'</span><span class="banner-badge">−30%</span></div><div class="banner-thumbs">'+thumbs+'</div></div>';
}

/** Home shows catalogs, not product grid */
var catalogBrowse = false;
try{ window.catalogBrowse = catalogBrowse; }catch(e){}

function isHomeCatalogView(){
  try{
    if(typeof query!=="undefined" && query && String(query).trim()) return false;
    if(typeof currentBrand!=="undefined" && currentBrand) return false;
    if(typeof currentConcern!=="undefined" && currentConcern) return false;
    if(typeof wishView!=="undefined" && wishView) return false;
    if(typeof currentCat!=="undefined" && currentCat!=="all") return false;
    if(catalogBrowse) return false;
    return true;
  }catch(e){ return false; }
}
function openCatalog(cat, kind){
  catalogBrowse = true;
  currentBrand = "";
  currentConcern = "";
  wishView = false;
  query = "";
  var s = document.getElementById("search"); if(s) s.value = "";
  var clr = document.getElementById("searchClear"); if(clr) clr.hidden = true;
  if(kind==="hot"){
    currentCat = "all";
    currentSort = "new";
    window.__naqaShelfFilter = "hot";
  } else if(kind==="off"){
    currentCat = "all";
    currentSort = "off";
    window.__naqaShelfFilter = "off";
  } else if(kind==="all"){
    currentCat = "all";
    currentSort = "new";
    window.__naqaShelfFilter = "";
  } else {
    currentCat = cat || "all";
    currentSort = "new";
    window.__naqaShelfFilter = "";
  }
  document.querySelectorAll("#cats [data-cat]").forEach(function(x){
    x.classList.toggle("on", x.dataset.cat === currentCat);
  });
  var sel = document.getElementById("sortSel"); if(sel) sel.value = currentSort;
  try{
    if(kind==="hot") history.pushState({naqa:"shelf"}, "", "#shelf/hot");
    else if(kind==="off") history.pushState({naqa:"shelf"}, "", "#shelf/off");
    else if(kind==="all" || currentCat==="all") history.pushState({naqa:"shop"}, "", "#products");
    else history.pushState({naqa:"cat"}, "", "#c/"+encodeURIComponent(currentCat));
  }catch(e){}
  if(typeof render==="function") render();
  var prod = document.getElementById("products");
  if(prod) prod.scrollIntoView({behavior:"smooth", block:"start"});
}
function backToCatalogs(){
  catalogBrowse = false;
  window.__naqaShelfFilter = "";
  currentCat = "all";
  currentBrand = "";
  currentConcern = "";
  wishView = false;
  query = "";
  currentSort = "new";
  var s = document.getElementById("search"); if(s) s.value = "";
  document.querySelectorAll("#cats [data-cat]").forEach(function(x){
    x.classList.toggle("on", x.dataset.cat === "all");
  });
  var sel = document.getElementById("sortSel"); if(sel) sel.value = "new";
  try{ history.pushState({naqa:"shop"}, "", "#shop"); }catch(e){}
  if(typeof render==="function") render();
  var hc = document.getElementById("homeCatalogs");
  if(hc) hc.scrollIntoView({behavior:"smooth", block:"start"});
}
function catalogThumbHTML(list){
  var imgs = [];
  (list||[]).forEach(function(p){
    if(imgs.length>=4) return;
    var g = typeof pimgs==="function" ? pimgs(p) : (p.imgs||[]);
    if(g && g[0]) imgs.push(g[0]);
  });
  if(!imgs.length) return '<div class="cat-cover-empty">✨</div>';
  var n = imgs.length;
  return '<div class="cat-cover cat-cover-'+Math.min(n,4)+'">'
    + imgs.map(function(src){ return '<img src="'+esc(src)+'" alt="" loading="lazy" width="200" height="200">'; }).join("")
    + '</div>';
}
function renderHomeCatalogs(){
  var el = document.getElementById("homeCatalogs");
  if(!el) return;
  if(!isHomeCatalogView()){ el.hidden = true; el.innerHTML = ""; return; }
  el.hidden = false;
  var cats = [
    {id:"عناية", ar:"عناية بالبشرة", en:"Skincare", em:"🧴"},
    {id:"وجه", ar:"مكياج الوجه", en:"Face makeup", em:"💄"},
    {id:"عيون", ar:"العيون", en:"Eyes", em:"👁️"},
    {id:"شفاه", ar:"الشفاه", en:"Lips", em:"💋"},
    {id:"حواجب", ar:"الحواجب", en:"Brows", em:"✨"},
    {id:"شعر", ar:"العناية بالشعر", en:"Hair care", em:"💇"},
    {id:"أدوات", ar:"أدوات التجميل", en:"Tools", em:"🔧"},
    {id:"عطور", ar:"عطور", en:"Fragrance", em:"🌸"}
  ];
  var allN0 = products.filter(function(p){ return !p.hidden; }).length;
  var brandN = (function(){ var s={}; products.forEach(function(p){ if(!p.hidden) s[p.brand]=1; }); return Object.keys(s).length; })();
  var title = lang==="en" ? "Catalog" : "الكتالوج";
  var sub = lang==="en" ? "Open a section to browse products — not a dump of everything" : "افتحي قسماً لتصفّح المنتجات — بدل عرض كل شيء دفعة واحدة";
  var html = '<div class="home-cat-hero">'
    +'<div class="home-cat-hero-copy">'
    +'<p class="home-cat-kicker">'+(lang==="en"?"Naqa Oman":"نقاء عُمان")+'</p>'
    +'<h2>'+title+'</h2>'
    +'<p>'+sub+'</p>'
    +'</div>'
    +'<div class="home-cat-stats" aria-hidden="true">'
    +'<span><b>'+allN0+'</b><i>'+(lang==="en"?"products":"منتج")+'</i></span>'
    +'<span><b>'+brandN+'</b><i>'+(lang==="en"?"brands":"ماركة")+'</i></span>'
    +'</div></div>';
  html += '<div class="home-cat-grid">';
  /* special: hot + offers + all */
  var hot = products.filter(function(p){ return p.hot && !p.hidden; });
  var offs = products.filter(function(p){ return !p.hidden && p.was > p.price; });
  var allN = products.filter(function(p){ return !p.hidden; }).length;
  html += '<button type="button" class="home-cat-card home-cat-special home-cat-hot" data-open-catalog="hot">'
    + catalogThumbHTML(hot)
    + '<div class="home-cat-body"><span class="home-cat-em">★</span><b>'+(lang==="en"?"Bestsellers":"الأكثر طلباً")+'</b>'
    + '<span>'+hot.length+(lang==="en"?" picks":" منتج")+'</span></div></button>';
  if(offs.length){
    html += '<button type="button" class="home-cat-card home-cat-special home-cat-off" data-open-catalog="off">'
      + catalogThumbHTML(offs)
      + '<div class="home-cat-body"><span class="home-cat-em">%</span><b>'+(lang==="en"?"Offers":"عروض")+'</b>'
      + '<span>'+offs.length+(lang==="en"?" deals":" عرض")+'</span></div></button>';
  }
  cats.forEach(function(c){
    var list = products.filter(function(p){ return !p.hidden && p.cat===c.id; });
    if(!list.length) return; /* skip empty */
    var name = lang==="en" ? c.en : c.ar;
    html += '<button type="button" class="home-cat-card" data-open-catalog="'+esc(c.id)+'">'
      + catalogThumbHTML(list)
      + '<div class="home-cat-body"><span class="home-cat-em">'+c.em+'</span><b>'+esc(name)+'</b>'
      + '<span>'+list.length+(lang==="en"?" products":" منتج")+'</span></div></button>';
  });
  html += '<button type="button" class="home-cat-card home-cat-all" data-open-catalog="all">'
    + '<div class="cat-cover cat-cover-all"><span>ن</span></div>'
    + '<div class="home-cat-body"><span class="home-cat-em">▣</span><b>'+(lang==="en"?"All products":"كل المنتجات")+'</b>'
    + '<span>'+allN+(lang==="en"?" items":" منتج")+'</span></div></button>';
  html += '</div>';
  el.innerHTML = html;
}

function renderShelves(){
  const box=$("#shelves");
  if(!box) return;
  /* product shelves only when browsing products — not on home catalogs */
  if(isHomeCatalogView()){ box.innerHTML=""; box.hidden=true; return; }
  box.hidden=true; /* keep product shelves off; home catalogs replace them */
  box.innerHTML="";
}


