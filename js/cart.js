/* cart logic + drawer UI + payment / delivery fee
 Rules:
 - Delivery list: 2 OMR; free at 30+ (show list struck when waived)
 - COD list: 1.5 OMR; only for cash on delivery; bank-account method waives (struck)
 - Bank account = manual (no gateway): customer pays then sends proof on WhatsApp
*/
function cartSubtotal(){
  return cart.reduce((s,i)=>s+i.price*i.qty,0);
}
function getPayMethod(){
  const r=document.querySelector('input[name="payMethod"]:checked');
  const v=(r && r.value) || "cod";
  if(v==="paid" || v==="transfer" || v==="bank") return "transfer";
  return "cod";
}
function feeBreakdown(subtotal, pay){
  const delBase=(typeof DELIVERY_FEE==="number")?DELIVERY_FEE:2;
  const codBase=(typeof COD_FEE==="number")?COD_FEE:1.5;
  const min=(typeof FREE_SHIP_MIN==="number")?FREE_SHIP_MIN:30;
  pay=pay||getPayMethod();
  if(pay==="paid" || pay==="bank") pay="transfer";
  subtotal=subtotal!=null?subtotal:cartSubtotal();
  const freeShip = subtotal >= min;
  const deliveryList = delBase;
  const codList = codBase;
  const delivery = freeShip ? 0 : delBase;
  const codFee = (pay==="transfer") ? 0 : codBase;
  return {
    subtotal:subtotal,
    delivery:delivery,
    codFee:codFee,
    deliveryList:deliveryList,
    codList:codList,
    deliveryWaived: freeShip,
    codWaived: pay==="transfer",
    shipping:delivery+codFee,
    grand:subtotal+delivery+codFee,
    pay:pay,
    freeShip:freeShip,
    freeShipMin:min
  };
}
function deliveryFee(subtotal, pay){
  return feeBreakdown(subtotal, pay).shipping;
}
function cartGrand(subtotal, pay){
  return feeBreakdown(subtotal, pay).grand;
}
function feeCell(listAmt, charged, waived, freeLab){
  if(waived){
    return '<span class="fee-was">'+money(listAmt)+'</span><span class="fee-now">'+(freeLab||"0")+'</span>';
  }
  return '<span class="fee-now">'+money(charged)+'</span>';
}
function bankReady(){
  var bn=(typeof BANK_NAME==="string"?BANK_NAME:"").trim();
  var bi=(typeof BANK_IBAN==="string"?BANK_IBAN:"").trim();
  return !!(bn && bi);
}
function syncBankOption(){
  var opt=document.getElementById("payBankOpt");
  var ready=bankReady();
  if(opt) opt.hidden=!ready;
  if(!ready){
    var cod=document.getElementById("payCod");
    if(cod) cod.checked=true;
  }
}
function updatePaySum(){
  syncBankOption();
  const el=$("#paySum"); if(!el) return;
  const b=feeBreakdown();
  const bank=b.pay==="transfer";
  const freeLab=lang==="en"?"Free":"مجاني";
  const zeroLab=lang==="en"?"0.000":"٠.٠٠٠";
  const payLab=bank?(T("payPending")||""):(T("payStatusUnpaid")||"");
  const vatAmt=(typeof cartVatFromLines==="function"?cartVatFromLines(cart.map(function(i){var p=(typeof products!=="undefined"?products.find(function(x){return x.id===i.id}):null)||i;return{price:p.price!=null?p.price:i.price,qty:i.qty,taxMode:p.taxMode,taxCustom:p.taxCustom}})):(typeof vatOf==="function"?vatOf(b.grand):0));
  const shipCell=feeCell(b.deliveryList, b.delivery, b.deliveryWaived, freeLab);
  const codCell=feeCell(b.codList, b.codFee, b.codWaived, zeroLab);
  const shipNote=b.deliveryWaived?(' <span class="fee-tag">'+(lang==="en"?"30+ free":"٣٠+ مجاني")+'</span>'):"";
  const codNote=b.codWaived?(' <span class="fee-tag">'+(lang==="en"?"waived (bank)":"ملغاة (حساب بنكي)")+'</span>'):"";
  el.innerHTML=
    "<div><span>"+(T("subTotal")||"المجموع الفرعي")+"</span><b>"+money(b.subtotal)+"</b></div>"+
    "<div><span>"+(T("shipFee")||"رسوم التوصيل")+shipNote+"</span><b class=\"fee-line\">"+shipCell+"</b></div>"+
    "<div><span>"+(T("codFee")||"رسوم الدفع عند الاستلام")+codNote+"</span><b class=\"fee-line\">"+codCell+"</b></div>"+
    "<div class=\"grand\"><span>"+(T("grandTotal")||"الإجمالي")+"</span><b>"+money(b.grand)+"</b></div>"+
    "<div class=\"vat-line\"><span>"+(T("vatOf")||"منها ضريبة ٥٪")+"</span><b>"+money(vatAmt)+"</b></div>"+
    "<div class=\"pay-status\">"+payLab+" · "+(bank?(T("payPaid")||""):(T("payCod")||""))+" · "+(T("vatInc")||"")+"</div>";
  const hint=$("#payHint");
  if(hint){
    if(bank){
      var bn=(typeof BANK_NAME==="string"?BANK_NAME:"").trim();
      var bi=(typeof BANK_IBAN==="string"?BANK_IBAN:"").trim();
      if(bn||bi){
        hint.textContent = (lang==="en"
          ? ("Bank transfer · "+(bn||"Bank")+" · "+(bi||"IBAN pending")+" · no COD fee · free delivery at 30+.")
          : ("تحويل بنكي · "+(bn||"البنك")+" · "+(bi||"الآيبان لاحقاً")+" · بدون رسوم استلام · توصيل مجاني من ٣٠."));
      } else {
        hint.textContent = (lang==="en"
          ? ("Bank transfer selected · account number not published yet — the store will send it on WhatsApp · no COD fee.")
          : ("اخترتِ التحويل · رقم الحساب غير منشور بعد — المتجر يرسله على واتساب · بدون رسوم استلام."));
      }
    } else if(b.freeShip){
      hint.textContent=lang==="en"
        ? "Cash on delivery: delivery free (30+) · COD fee 1.500 OMR still applies. Example: 30 + 1.5 = 31.5"
        : "دفع عند الاستلام: توصيل مجاني (٣٠+) · رسوم الاستلام ١.٥٠٠ ما زالت. مثال: ٣٠ + ١.٥ = ٣١.٥";
    } else {
      hint.textContent=lang==="en"
        ? "Cash on delivery: delivery 2 + COD fee 1.5. Free delivery auto at 30+. Example: 25+2+1.5=28.5"
        : "دفع عند الاستلام: توصيل ٢ + استلام ١.٥. التوصيل مجاني تلقائي من ٣٠. مثال: ٢٥+٢+١.٥=٢٨.٥";
    }
  }
}
function addToCart(id, qty, quiet){
  const p=products.find(x=>x.id===id); if(!p||p.hidden) return;
  if(p.stock!=null && Number(p.stock)<=0){
    if(!quiet && typeof toast==="function") toast(lang==="en"?"Out of stock":"نفد المخزون");
    return;
  }
  let n=Math.max(1, Math.min(20, parseInt(qty,10)||1));
  if(p.stock!=null){
    const have=(cart.find(x=>x.id===id)||{}).qty||0;
    const left=Math.max(0, Number(p.stock)-have);
    if(left<=0){
      if(!quiet && typeof toast==="function") toast(lang==="en"?"Out of stock":"نفد المخزون");
      return;
    }
    n=Math.min(n, left);
  }
  const row=cart.find(x=>x.id===id);
  if(row) row.qty+=n; else cart.push({id:p.id, brand:p.brand, price:p.price, sku:p.sku, qty:n});
  saveCart(); renderCart();
  if(!quiet && typeof toast==="function") toast(lang==="en"?"Added to cart":"انضاف للسلة");
}

function renderCart(){
  const n=cart.reduce((s,i)=>s+i.qty,0);
  const sub=cartSubtotal();
  const b=feeBreakdown(sub, getPayMethod?getPayMethod():"cod");
  const ship=b.shipping;
  const grand=b.grand;
  const badge=$("#cartBadge");
  if(n){ badge.hidden=false; badge.textContent=n; } else badge.hidden=true;
  const bar=$("#cartBar");
  if(n){
    bar.hidden=false;
    bar.classList.remove("empty-bar");
    document.body.classList.add("has-cart-bar");
    $("#barTitle").textContent=T("barItems")(n);
    var min=FREE_SHIP_MIN||30;
    var need=Math.max(0, min-sub);
    var shipNote;
    if(need>0){
      shipNote = lang==="en"
        ? ("Need "+money(need)+" more for free delivery · COD +1.5")
        : ("أضيفي "+money(need)+" للتوصيل المجاني · استلام +١.٥");
    } else {
      shipNote = lang==="en"
        ? ("Free delivery unlocked · COD still +1.5 if cash on delivery")
        : ("توصيل مجاني مفعّل · الاستلام +١.٥ إذا اخترتي الدفع عند الاستلام");
    }
    $("#barSub").textContent=money(sub)+" · "+shipNote;
    $("#barGo").textContent=T("barCheckout");
  } else {
    bar.hidden=true;
    bar.classList.add("empty-bar");
    document.body.classList.remove("has-cart-bar");
  }
  if(!cart.length){
    $("#cartBody").innerHTML=`<div class="cart-empty">${T("emptyCart")}</div>`;
    $("#cartTotal").textContent=money(0);
    updatePaySum();
    return;
  }
  const vatCart=typeof vatOf==="function"?vatOf(grand):0;
  const shipLine = `<div class="cart-ship-note">${T("shipFee")||"التوصيل"}: <b>${b.delivery?money(b.delivery):(lang==="en"?"Free":"مجاني")}</b>`
    + ` · ${T("codFee")||"استلام"}: <b>${b.codFee?money(b.codFee):(lang==="en"?"—":"—")}</b>`
    + ` · ${T("grandTotal")||"الإجمالي"}: <b>${money(grand)}</b>`
    + `<div class="vat-line-soft">${T("vatOf")||"منها ضريبة ٥٪"}: ${money(vatCart)} · ${T("vatInc")||"شامل الضريبة"}</div></div>`;
  $("#cartBody").innerHTML=cart.map(i=>{
    const p=products.find(x=>x.id===i.id)||i;
    return `<div class="cart-item">
      <div class="thumb">${visual(p,0)}</div>
      <div class="meta">
        <strong>${esc(pname(p))}</strong>
        <span>${money(i.price)} · ${esc(p.brand||"")}</span><span class="vat-note">${T("vatInc")||"شامل الضريبة ٥٪"}</span>
        <div class="sku-line">${T("sku")}: ${esc(p.sku||"—")}</div>
        <button class="rm" data-rm="${i.id}" type="button">${T("del")}</button>
      </div>
      <div class="qty" role="group" aria-label="${T("qty")}">
        <button data-dec="${i.id}" type="button" aria-label="${lang==="en"?"Decrease":"تقليل"}">−</button>
        <b aria-live="polite">${i.qty}</b>
        <button data-inc="${i.id}" type="button" aria-label="${lang==="en"?"Increase":"زيادة"}">+</button>
      </div>
    </div>`;
  }).join("")+shipLine;
  $("#cartTotal").textContent=money(grand);
  updatePaySum();
}

function openCart(){
  $("#overlay").classList.add("show");
  $("#drawer").classList.add("show");
  document.body.classList.add("drawer-open");
  if(window.naqaScrollLock) naqaScrollLock.lock();
}
function closeCart(){
  $("#overlay").classList.remove("show");
  $("#drawer").classList.remove("show");
  document.body.classList.remove("drawer-open");
  if(window.naqaScrollLock) naqaScrollLock.unlock();
}

function openCheckout(){
  if(typeof applyLang==="function") applyLang();
  else if(typeof fillAreas==="function") fillAreas();
  const done=$("#orderDone"); if(done){ done.hidden=true; done.innerHTML=""; }
  const cod=$("#payCod"); if(cod) cod.checked=true;
  updatePaySum();
  const m=$("#checkoutModal"); if(m) m.classList.add("show");
  if(window.naqaScrollLock) naqaScrollLock.lock();
  document.body.classList.add("modal-open");
}
function closeCheckout(){
  const m=$("#checkoutModal"); if(m) m.classList.remove("show");
  document.body.classList.remove("modal-open");
  if(window.naqaScrollLock) naqaScrollLock.unlock();
}
function sendCheckout(){
  const name=($("#coName")&&$("#coName").value||"").trim();
  const phone=($("#coPhone")&&$("#coPhone").value||"").trim();
  const gov=($("#coGov")&&$("#coGov").value||"").trim();
  const note=($("#coNote")&&$("#coNote").value||"").trim();
  if(!name){ alert(T("coNeedName")); const el=$("#coName"); if(el) el.focus(); return; }
  const digits=phone.replace(/\D/g,"");
  if(digits.length<8){ alert(T("coNeedPhone")); const el=$("#coPhone"); if(el) el.focus(); return; }
  if(!gov){ alert(T("coNeedGov")); const el=$("#coGov"); if(el) el.focus(); return; }
  const pay=getPayMethod();
  if(!pay){ alert(T("payNeed")||"اختاري طريقة الدفع"); return; }

  /* Reprice from live catalog — never trust cart line prices (could be tampered via localStorage). */
  const priced=[];
  for(let k=0;k<cart.length;k++){
    const i=cart[k];
    const p=products.find(x=>x.id===i.id);
    if(!p || p.hidden){ alert(lang==="en"?"A product is unavailable. Refresh and try again.":"منتج غير متاح. حدّثي الصفحة وحاولي."); return; }
    if(p.stock!=null && Number(p.stock)<=0){ alert(lang==="en"?"Out of stock: ":"نفد: "+pname(p)); return; }
    const qty=Math.max(1, Math.min(20, Number(i.qty)||1));
    const unit=Number(p.price);
    if(!(unit>0)){ alert(lang==="en"?"Invalid price. Contact the store.":"سعر غير صالح. تواصلي مع المتجر."); return; }
    priced.push({
      id:p.id, qty:qty, price:unit, brand:p.brand||"", sku:p.sku||"",
      name:pname(p), nameAr:p.nameAr||"", nameEn:p.nameEn||"",
      link:(typeof productLink==="function")?productLink(p.id):"",
      img:(p.imgs&&p.imgs[0])||"", line:unit*qty
    });
  }
  if(!priced.length){ alert(T("alertEmpty")); return; }

  const sub=priced.reduce((s,x)=>s+x.line,0);
  const b=feeBreakdown(sub, pay);
  const ship=b.shipping, grand=b.grand, delivery=b.delivery, codFee=b.codFee;
  const orderNo=(typeof makeOrderNo==="function")?makeOrderNo():("NQ-"+Date.now());
  const payLabel=pay==="transfer"
    ?(lang==="en"?"Bank account (manual) · awaiting proof of payment":"حساب بنكي يدوي · بانتظار إثبات الدفع")
    :(lang==="en"?"Cash on delivery (unpaid)":"دفع عند الاستلام (غير مدفوع)");

  const bankName=(typeof BANK_NAME==="string")?BANK_NAME.trim():"";
  const bankIban=(typeof BANK_IBAN==="string")?BANK_IBAN.trim():"";
  let bankBlock="";
  if(pay==="transfer"){
    if(bankName || bankIban){
      bankBlock = lang==="en"
        ? ("\nBank: "+(bankName||"—")+"\nAccount / IBAN: "+(bankIban||"—"))
        : ("\nالبنك: "+(bankName||"—")+"\nالحساب / الآيبان: "+(bankIban||"—"));
    } else {
      bankBlock = lang==="en"
        ? ("\nBank details: not set yet — "+(typeof BANK_HINT_EN==="string"?BANK_HINT_EN:"ask the store for account number"))
        : ("\nالحساب البنكي: غير مضاف بعد — اسألي المتجر عن الرقم (أضيفيه في الإعدادات)");
    }
  }

  const order={
    id:orderNo, at:new Date().toISOString(), status:"new",
    name:name, phone:phone, area:gov, note:note,
    payment:pay, paymentLabel:payLabel, paid:false, paymentStatus:pay==="transfer"?"pending":"cod",
    subtotal:sub, delivery:delivery, codFee:codFee, shipping:ship, total:grand,
    vatRate:typeof vatRate==="function"?vatRate():0.05, vat:typeof vatOf==="function"?vatOf(grand):0, vatInclusive:true, currency:"OMR",
    items:priced, lang:lang,
    bankName:bankName||"", bankIban:bankIban||""
  };

  /* Compact payload for order.html so the seller can save into their admin on their phone. */
  let saveLink="";
  try{
    const compact={
      id:order.id, at:order.at, n:order.name, p:order.phone, a:order.area, t:order.note,
      tot:order.total, pay:order.payment, del:order.delivery, cod:order.codFee, ship:order.shipping, sub:order.subtotal,
      its:priced.map(function(x){ return {i:x.id,q:x.qty,pr:x.price,s:x.sku,na:x.nameAr,ne:x.nameEn}; })
    };
    const raw=btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
    var base=(typeof siteBasePath==="function")?siteBasePath():((location.pathname||"/").replace(/\/(admin|order)\.html$/i,"/").replace(/\/p\/[0-9]+\/?$/i,"/"));
    if(base.slice(-1)!=="/") base+="/";
    saveLink=location.origin+base+"order.html#"+raw;
  }catch(e){ saveLink=""; }

  const cap=(typeof ORDERS_CAP==="number" && ORDERS_CAP>0)?ORDERS_CAP:300;
  try{
    localStorage.setItem("naqa_last_order", orderNo);
    localStorage.setItem("naqa_last_order_full", JSON.stringify(order));
    var all=[];
    try{ all=JSON.parse(localStorage.getItem("naqa_orders")||"[]"); if(!Array.isArray(all)) all=[]; }catch(e){ all=[]; }
    all=all.filter(function(o){ return o && o.id!==orderNo; });
    all.unshift(order);
    localStorage.setItem("naqa_orders", JSON.stringify(all.slice(0,cap)));
  }catch(e){}
  if(typeof window.NAQA_ORDERS_HOOK==="function"){
    try{ window.NAQA_ORDERS_HOOK(order); }catch(e){}
  }

  const lines=priced.map(function(x){
    return "• "+x.name+" × "+x.qty+" = "+money(x.line)
      +"\nSKU: "+(x.sku||"—")
      +(x.link?("\n"+x.link):"");
  }).join("\n\n");
  const delLine = (function(){
    if(b.deliveryWaived){
      return lang==="en"
        ? ("Delivery: "+money(b.deliveryList)+" → FREE (30+)")
        : ("التوصيل: "+money(b.deliveryList)+" ← مجاني (٣٠+)");
    }
    return lang==="en" ? ("Delivery: "+money(delivery)) : ("التوصيل: "+money(delivery));
  })();
  const codLine = (function(){
    if(b.codWaived){
      return lang==="en"
        ? ("COD fee: "+money(b.codList)+" → 0 (bank account)")
        : ("رسوم الاستلام: "+money(b.codList)+" ← ٠ (حساب بنكي)");
    }
    return lang==="en" ? ("COD fee: "+money(codFee)) : ("رسوم الدفع عند الاستلام: "+money(codFee));
  })();
  const saveLine = saveLink
    ? (lang==="en"
      ? ("\n\nOpen this link on the admin phone. The order saves itself:\n"+saveLink)
      : ("\n\nافتحي الرابط من جوال اللوحة. الطلب ينحفظ لوحده:\n"+saveLink))
    : "";
  const msg = lang==="en"
    ? ("Hello, I want to order from Naqa:\nOrder: "+orderNo+"\nName: "+name+"\nPhone: "+phone+"\nArea: "+gov+"\nPayment: "+payLabel+bankBlock+"\nNote: "+note+"\n\n"+lines+"\n\nSubtotal: "+money(sub)+"\n"+delLine+"\n"+codLine+"\nTotal (incl. 5% VAT): "+money(grand)+"\nOf which VAT 5%: "+money(typeof vatOf==="function"?vatOf(grand):0)+(pay==="transfer"?("\nI will pay then send proof."):"")+saveLine)
    : ("السلام عليكم، أبغى أطلب من نقاء:\nرقم الطلب: "+orderNo+"\nالاسم: "+name+"\nالجوال: "+phone+"\nالمنطقة: "+gov+"\nالدفع: "+payLabel+bankBlock+"\nملاحظة: "+note+"\n\n"+lines+"\n\nالمجموع الفرعي: "+money(sub)+"\n"+delLine+"\n"+codLine+"\nالإجمالي (شامل الضريبة ٥٪): "+money(grand)+"\nمنها ضريبة ٥٪: "+money(typeof vatOf==="function"?vatOf(grand):0)+(pay==="transfer"?("\nراح أحول وأرسل إثبات الدفع."):"")+saveLine);
  window.open("https://wa.me/"+WA_NUMBER+"?text="+encodeURIComponent(msg), "_blank");

  /* Clear cart so the same order is not sent twice. */
  cart=[];
  try{ saveCart(); }catch(e){}
  try{ renderCart(); }catch(e){}

  const done=$("#orderDone");
  if(done){
    done.hidden=false;
    done.innerHTML=(lang==="en"
      ? ("Your order number is <b>"+orderNo+"</b>. Total <b>"+money(grand)+"</b>. WhatsApp should open now. Cart cleared.")
      : ("رقم طلبك <b>"+orderNo+"</b>. الإجمالي <b>"+money(grand)+"</b>. واتساب يفتح الحين. السلة تصفّرت."));
  }
}

