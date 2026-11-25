
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
  return '<button class="btn-add'+(sheet?' card-add':'')+'" data-add="'+id+'" type="button">'+(typeof T==="function"?T("add"):"أضف")+'</button>';
}
function refreshSheetCartControls(){
  try{
    if(typeof openProductId==="undefined" || !openProductId) return;
    var box = document.getElementById("sheetActions");
    if(!box) return;
    var p = products.find(function(x){ return Number(x.id)===Number(openProductId); });
    if(!p) return;
    var wishOn = typeof isWish==="function" && isWish(p.id) ? " on" : "";
    var qv = typeof sheetMode!=="undefined" && sheetMode==="qv";
    var en = (typeof lang!=="undefined" && lang==="en");
    box.innerHTML =
      '<button class="btn-wish-sheet'+wishOn+'" data-wish="'+p.id+'" type="button">♥ '+(en?"Save":"حفظ")+'</button>'
      + productCartControls(p.id, { sheet:true })
      + (qv ? '<button class="btn-open" data-open="'+p.id+'" type="button">'+(typeof T==="function"?T("open"):"")+'</button>' : "");
  }catch(e){}
}
function refreshProductCartUI(){
  try{
    if(typeof render==="function") render();
  }catch(e){}
  refreshSheetCartControls();
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
  const qty=(cart.find(c=>c.id===p.id)||{}).qty;
  const out=p.stock!=null && Number(p.stock)<=0;
  return '<article class="card" data-id="'+p.id+'" aria-label="'+esc(pname(p))+'">'
    +'<div class="card-visual" data-open="'+p.id+'">'
    +'<button type="button" class="wish-btn'+(typeof isWish==='function'&&isWish(p.id)?' on':'')+'" data-wish="'+p.id+'" aria-label="'+(lang==="en"?"Save to wishlist":"حفظ في المفضلة")+'">♥</button>'
    +'<span class="card-cart-chip'+(qty?' show':'')+'" data-chip="'+p.id+'">'+(qty?('×'+qty):'')+'</span>'
    +tags+visual(p,0)+'</div>'
    +'<div class="card-body">'
    +brandMark(p.brand)
    +'<div class="card-brand">'+esc(T(catLabel[p.cat]||"all"))+'</div>'
    +'<button class="card-name" data-open="'+p.id+'" type="button">'+esc(pname(p))+'</button>'
    +'<div class="card-desc">'+esc(pdesc(p))+'</div>'
    +(p.stock!=null && Number(p.stock)<=2?('<div class="card-code">'+(lang==="en"?"Stock ":"المخزون ")+p.stock+'</div>'):'')
    +priceHTML(p)
    +'<div class="card-actions">'
    +'<button class="btn-qv" data-qv="'+p.id+'" type="button">'+T("qv")+'</button>'
    +productCartControls(p.id, {})
    +'<button class="btn-open" data-open="'+p.id+'" type="button">'+T("open")+'</button>'
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
function renderShelves(){
  const box=$("#shelves");
  if(!box) return;
  const show=!query && currentCat==="all" && !currentBrand && !(typeof wishView!=="undefined" && wishView);
  if(!show){ box.innerHTML=""; box.hidden=true; return; }
  box.hidden=false;
  const hot=products.filter(p=>p.hot&&!p.hidden).slice(0,12);
  const year=products.filter(p=>!p.hidden&&p.was>p.price).sort((a,b)=>offPct(b)-offPct(a)).slice(0,16);
  let html="";
  if(hot.length){
    html+='<section class="shelf">'+shelfBanner("hot", hot)
      +'<div class="shelf-head"><h2 id="hotTitle">'+T("hot")+'</h2>'+vatChip()
      +'<button type="button" data-shelf="hot">'+T("viewAll")+'</button></div>'
      +'<div class="shelf-row">'+hot.map(cardHTML).join("")+'</div></section>';
  }
  if(year.length){
    html+='<section class="shelf">'+shelfBanner("year", year)
      +'<div class="shelf-head"><h2 id="yearTitle">'+T("year")+'</h2>'+vatChip()
      +'<button type="button" data-shelf="year">'+T("viewAll")+'</button></div>'
      +'<div class="shelf-row">'+year.map(cardHTML).join("")+'</div></section>';
  }
  box.innerHTML=html;
}

