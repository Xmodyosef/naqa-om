
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

function visual(p, idx, opts){
  opts = opts || {};
  const imgs=pimgs(p); const i=idx||0;
  if(imgs[i]){
    /* First few cards: eager for LCP; rest lazy. sizes for responsive. */
    var eager = !!opts.eager;
    var loading = eager ? 'eager' : 'lazy';
    var prio = eager ? 'high' : 'low';
    return '<img src="'+esc(imgs[i])+'" alt="'+esc(pname(p))+'" width="800" height="800" loading="'+loading+'" decoding="async" fetchpriority="'+prio+'" sizes="(max-width:600px) 50vw, (max-width:1000px) 33vw, 220px" draggable="false" style="width:100%;height:100%;object-fit:contain;object-position:center">';
  }
  return '<span class="card-em" style="font-size:2rem;display:grid;place-items:center;height:100%">'+ (p.em||'✨') +'</span>';
}

/** Short benefit line under product name (card) */
function cardBenefit(p){
  if(!p) return "";
  var en = (typeof lang!=="undefined" && lang==="en");
  var raw = en
    ? (p.skinEn || p.descEn || p.em || "")
    : (p.skinAr || p.descAr || p.em || "");
  raw = String(raw||"").replace(/\s+/g," ").trim();
  if(!raw) return "";
  // first sentence / first ~70 chars
  var cut = raw.split(/[.。!?؟\n]/)[0] || raw;
  if(cut.length > 72) cut = cut.slice(0, 70).replace(/\s+\S*$/,"") + "…";
  if(cut.length < 8) return "";
  return cut;
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
    +tags+visual(p,0,{eager:false})
    +'<div class="card-price-float">'+money(p.price)+'</div>'
    +'</div>'
    +'<div class="card-body">'
    +'<div class="card-meta-row">'
    +brandMark(p.brand, {nameOnly:true})
    +'<span class="card-cat-pill">'+catLab+'</span>'
    +'</div>'
    +'<button class="card-name" data-open="'+p.id+'" type="button">'+esc(pname(p))+'</button>'
    +(function(){ var b=cardBenefit(p); return b?('<p class="card-benefit">'+esc(b)+'</p>'):''; })()
    +(p.stock!=null && Number(p.stock)<=2?('<div class="card-code">'+(lang==="en"?"Low stock · ":"مخزون منخفض · ")+p.stock+'</div>'):'')
    +(typeof reviewHTML==='function'?reviewHTML(p):'')
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

/* home catalogs: see js/features/catalogs.js */
