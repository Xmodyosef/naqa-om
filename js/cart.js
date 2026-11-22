/* cart logic + drawer UI + payment / delivery fee
 Rules:
 - Delivery base: 2 OMR when subtotal < 30
 - Free delivery at 30+ (auto discount the 2)
 - COD (unpaid): +1.5 OMR cash-on-delivery fee
 - Paid in advance: remove delivery fee AND remove COD fee
 Example COD 30: 30 + 0 delivery + 1.5 COD = 31.500
 Example COD 25: 25 + 2 + 1.5 = 28.500
 Example paid 25: 25 + 0 + 0 = 25.000
*/
function cartSubtotal(){
  return cart.reduce((s,i)=>s+i.price*i.qty,0);
}
function getPayMethod(){
  const paid=$("#payPaid");
  if(paid && paid.checked) return "paid";
  const cod=$("#payCod");
  if(cod && cod.checked) return "cod";
  const r=document.querySelector('input[name="payMethod"]:checked');
  return (r && r.value) || "cod";
}
function feeBreakdown(subtotal, pay){
  const delBase=(typeof DELIVERY_FEE==="number")?DELIVERY_FEE:2;
  const codBase=(typeof COD_FEE==="number")?COD_FEE:1.5;
  const min=(typeof FREE_SHIP_MIN==="number")?FREE_SHIP_MIN:30;
  pay=pay||getPayMethod();
  subtotal=subtotal!=null?subtotal:cartSubtotal();
  let delivery=0, codFee=0;
  if(pay==="paid"){
    delivery=0; codFee=0; // paid removes both
  } else {
    // COD / unpaid
    delivery = subtotal>=min ? 0 : delBase; // free at 30+
    codFee = codBase; // always 1.5 on COD
  }
  return {
    subtotal:subtotal,
    delivery:delivery,
    codFee:codFee,
    shipping:delivery+codFee,
    grand:subtotal+delivery+codFee,
    pay:pay,
    freeShip:subtotal>=min
  };
}
function deliveryFee(subtotal, pay){
  return feeBreakdown(subtotal, pay).shipping;
}
function cartGrand(subtotal, pay){
  return feeBreakdown(subtotal, pay).grand;
}
function updatePaySum(){
  const el=$("#paySum"); if(!el) return;
  const b=feeBreakdown();
  const payLab=b.pay==="paid"?(T("payStatusPaid")||"مدفوع"):(T("payStatusUnpaid")||"غير مدفوع");
  const freeLab=lang==="en"?"Free":"مجاني";
  const vatAmt=typeof vatOf==="function"?vatOf(b.grand):0;
  el.innerHTML=
    "<div><span>"+(T("subTotal")||"المجموع الفرعي")+"</span><b>"+money(b.subtotal)+"</b></div>"+
    "<div><span>"+(T("shipFee")||"رسوم التوصيل")+"</span><b>"+(b.delivery?money(b.delivery):freeLab)+(b.freeShip&&b.pay!=="paid"?" · ٣٠+":"")+"</b></div>"+
    "<div><span>"+(T("codFee")||"رسوم الدفع عند الاستلام")+"</span><b>"+(b.codFee?money(b.codFee):freeLab)+"</b></div>"+
    "<div class=\"grand\"><span>"+(T("grandTotal")||"الإجمالي")+"</span><b>"+money(b.grand)+"</b></div>"+
    "<div class=\"vat-line\"><span>"+(T("vatOf")||"منها ضريبة ٥٪")+"</span><b>"+money(vatAmt)+"</b></div>"+
    "<div class=\"pay-status\">"+payLab+(b.pay==="cod"?" · "+(T("payCod")||"دفع عند الاستلام"):" · "+(T("payPaid")||"مدفوع مسبقاً"))+" · "+(T("vatInc")||"شامل الضريبة ٥٪")+"</div>";
  const hint=$("#payHint");
  if(hint){
    if(b.pay==="paid"){
      hint.textContent=lang==="en"
        ? "Paid in advance: delivery fee and COD fee removed."
        : "مدفوع مسبقاً: يُخصم رسوم التوصيل ورسوم الدفع عند الاستلام.";
    } else if(b.freeShip){
      hint.textContent=lang==="en"
        ? "COD · free delivery (30+) · COD fee +1.500 OMR. Example: 30 + 1.5 = 31.5"
        : "دفع عند الاستلام · توصيل مجاني (٣٠+) · رسوم استلام +١.٥٠٠. مثال: ٣٠ + ١.٥ = ٣١.٥";
    } else {
      hint.textContent=lang==="en"
        ? "COD · delivery +2 + COD fee +1.5. Example: 25 + 2 + 1.5 = 28.5"
        : "دفع عند الاستلام · توصيل +٢ + استلام +١.٥. مثال: ٢٥ + ٢ + ١.٥ = ٢٨.٥";
    }
  }
}
function addToCart(id, qty, quiet){
  const p=products.find(x=>x.id===id); if(!p) return;
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
        <strong>${pname(p)}</strong>
        <span>${money(i.price)} · ${p.brand||""}</span><span class="vat-note">${T("vatInc")||"شامل الضريبة ٥٪"}</span>
        <div class="sku-line">${T("sku")}: ${p.sku||"—"}</div>
        <button class="rm" data-rm="${i.id}" type="button">${T("del")}</button>
      </div>
      <div class="qty">
        <button data-dec="${i.id}" type="button">−</button>
        <b>${i.qty}</b>
        <button data-inc="${i.id}" type="button">+</button>
      </div>
    </div>`;
  }).join("")+shipLine;
  $("#cartTotal").textContent=money(grand);
  updatePaySum();
}

function openCart(){ $("#overlay").classList.add("show"); $("#drawer").classList.add("show"); }
function closeCart(){ $("#overlay").classList.remove("show"); $("#drawer").classList.remove("show"); }

function openCheckout(){
  if(typeof applyLang==="function") applyLang();
  else if(typeof fillAreas==="function") fillAreas();
  const done=$("#orderDone"); if(done){ done.hidden=true; done.innerHTML=""; }
  const cod=$("#payCod"); if(cod) cod.checked=true;
  updatePaySum();
  const m=$("#checkoutModal"); if(m) m.classList.add("show");
}
function closeCheckout(){
  const m=$("#checkoutModal"); if(m) m.classList.remove("show");
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
  const b=feeBreakdown(cartSubtotal(), pay);
  const sub=b.subtotal;
  const ship=b.shipping;
  const grand=b.grand;
  const delivery=b.delivery;
  const codFee=b.codFee;
  const lines=cart.map(i=>{
    const p=products.find(x=>x.id===i.id)||i;
    const link=(typeof productLink==="function")?productLink(p.id):"";
    return "• "+pname(p)+" × "+i.qty+" = "+money(i.price*i.qty)
      +"\nSKU: "+(p.sku||"—")
      +(link?("\n"+link):"");
  }).join("\n\n");
  const orderNo=(typeof makeOrderNo==="function")?makeOrderNo():("NQ-"+Date.now());
  const items=cart.map(i=>{
    const p=products.find(x=>x.id===i.id)||i;
    return {
      id:p.id, name:pname(p), nameAr:p.nameAr||"", nameEn:p.nameEn||"",
      brand:p.brand||"", sku:p.sku||"", qty:i.qty, price:i.price,
      line:i.price*i.qty, link:(typeof productLink==="function")?productLink(p.id):"",
      img:(p.imgs&&p.imgs[0])||""
    };
  });
  const payLabel=pay==="paid"
    ?(lang==="en"?"Paid in advance":"مدفوع مسبقاً")
    :(lang==="en"?"Cash on delivery (unpaid)":"دفع عند الاستلام (غير مدفوع)");
  const order={
    id:orderNo, at:new Date().toISOString(), status:"new",
    name:name, phone:phone, area:gov, note:note,
    payment:pay, paymentLabel:payLabel, paid:pay==="paid",
    subtotal:sub, delivery:delivery, codFee:codFee, shipping:ship, total:grand,
    vatRate:typeof vatRate==="function"?vatRate():0.05, vat:typeof vatOf==="function"?vatOf(grand):0, vatInclusive:true, currency:"OMR",
    items:items, lang:lang
  };
  try{
    localStorage.setItem("naqa_last_order", orderNo);
    localStorage.setItem("naqa_last_order_full", JSON.stringify(order));
    var all=[];
    try{ all=JSON.parse(localStorage.getItem("naqa_orders")||"[]"); if(!Array.isArray(all)) all=[]; }catch(e){ all=[]; }
    all.unshift(order);
    localStorage.setItem("naqa_orders", JSON.stringify(all.slice(0,100)));
  }catch(e){}
  if(typeof window.NAQA_ORDERS_HOOK==="function"){
    try{ window.NAQA_ORDERS_HOOK(order); }catch(e){}
  }
  const delLine = lang==="en"
    ? ("Delivery: "+(delivery?money(delivery):"Free"))
    : ("التوصيل: "+(delivery?money(delivery):"مجاني"));
  const codLine = lang==="en"
    ? ("COD fee: "+(codFee?money(codFee):"0"))
    : ("رسوم الدفع عند الاستلام: "+(codFee?money(codFee):"٠"));
  const msg = lang==="en"
    ? ("Hello, I want to order from Naqa:\nOrder: "+orderNo+"\nName: "+name+"\nPhone: "+phone+"\nArea: "+gov+"\nPayment: "+payLabel+"\nNote: "+note+"\n\n"+lines+"\n\nSubtotal: "+money(sub)+"\n"+delLine+"\n"+codLine+"\nTotal (incl. 5% VAT): "+money(grand)+"\nOf which VAT 5%: "+money(typeof vatOf==="function"?vatOf(grand):0))
    : ("السلام عليكم، أبغى أطلب من نقاء:\nرقم الطلب: "+orderNo+"\nالاسم: "+name+"\nالجوال: "+phone+"\nالمنطقة: "+gov+"\nالدفع: "+payLabel+"\nملاحظة: "+note+"\n\n"+lines+"\n\nالمجموع الفرعي: "+money(sub)+"\n"+delLine+"\n"+codLine+"\nالإجمالي (شامل الضريبة ٥٪): "+money(grand)+"\nمنها ضريبة ٥٪: "+money(typeof vatOf==="function"?vatOf(grand):0));
  window.open("https://wa.me/"+WA_NUMBER+"?text="+encodeURIComponent(msg), "_blank");
  const done=$("#orderDone");
  if(done){
    done.hidden=false;
    done.innerHTML=(lang==="en"
      ? ("Your order number is <b>"+orderNo+"</b>. Total <b>"+money(grand)+"</b>. WhatsApp should open now.")
      : ("رقم طلبك <b>"+orderNo+"</b>. الإجمالي <b>"+money(grand)+"</b>. واتساب يفتح الحين."));
  }
}
