/* cart logic + drawer UI + payment / delivery fee */
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
function deliveryFee(subtotal, pay){
  const fee=(typeof DELIVERY_COD_FEE==="number")?DELIVERY_COD_FEE:2;
  const min=(typeof FREE_SHIP_MIN==="number")?FREE_SHIP_MIN:30;
  pay=pay||getPayMethod();
  subtotal=subtotal!=null?subtotal:cartSubtotal();
  // Paid in advance: no delivery fee
  if(pay==="paid") return 0;
  // COD / unpaid: 2 OMR unless free-shipping threshold
  if(subtotal>=min) return 0;
  return fee;
}
function cartGrand(subtotal, pay){
  subtotal=subtotal!=null?subtotal:cartSubtotal();
  return subtotal+deliveryFee(subtotal, pay);
}
function updatePaySum(){
  const el=$("#paySum"); if(!el) return;
  const sub=cartSubtotal();
  const pay=getPayMethod();
  const ship=deliveryFee(sub, pay);
  const grand=sub+ship;
  const payLab=pay==="paid"?(T("payStatusPaid")||"مدفوع"):(T("payStatusUnpaid")||"غير مدفوع");
  el.innerHTML=
    "<div><span>"+(T("subTotal")||"المجموع الفرعي")+"</span><b>"+money(sub)+"</b></div>"+
    "<div><span>"+(T("shipFee")||"رسوم التوصيل")+"</span><b>"+(ship?money(ship):(lang==="en"?"Free":"مجاني"))+"</b></div>"+
    "<div class=\"grand\"><span>"+(T("grandTotal")||"الإجمالي")+"</span><b>"+money(grand)+"</b></div>"+
    "<div class=\"pay-status\">"+payLab+(pay==="cod"?" · "+(T("payCod")||"دفع عند الاستلام"):" · "+(T("payPaid")||"مدفوع"))+"</div>";
  const hint=$("#payHint");
  if(hint){
    if(pay==="paid"){
      hint.textContent=lang==="en"
        ? "Paid in advance: no delivery fee. Confirm transfer with us on WhatsApp."
        : "مدفوع مسبقاً: بدون رسوم توصيل. أكّدي التحويل معنا على واتساب.";
    } else if(sub>=(FREE_SHIP_MIN||30)){
      hint.textContent=lang==="en"
        ? "Cash on delivery · free delivery (order over 30 OMR)."
        : "دفع عند الاستلام · توصيل مجاني (الطلب فوق ٣٠ ر.ع).";
    } else {
      hint.textContent=lang==="en"
        ? "Cash on delivery · delivery fee 2 OMR (under 30 OMR)."
        : "دفع عند الاستلام · رسوم توصيل ٢ ر.ع (تحت ٣٠ ر.ع).";
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
  const ship=deliveryFee(sub, "cod"); // default note assumes COD until checkout
  const grand=sub+ship;
  const badge=$("#cartBadge");
  if(n){ badge.hidden=false; badge.textContent=n; } else badge.hidden=true;
  const bar=$("#cartBar");
  if(n){
    bar.classList.remove("empty-bar");
    $("#barTitle").textContent=T("barItems")(n);
    var min=FREE_SHIP_MIN||30;
    var need=Math.max(0, min-sub);
    var shipNote;
    if(need>0){
      shipNote = lang==="en"
        ? ("Add "+money(need)+" for free delivery · COD fee "+money(DELIVERY_COD_FEE||2)+" now")
        : ("أضيفي "+money(need)+" للتوصيل المجاني · رسوم عند الاستلام الآن "+money(DELIVERY_COD_FEE||2));
    } else {
      shipNote = lang==="en" ? "Free delivery unlocked ✓" : "التوصيل المجاني مفعّل ✓";
    }
    $("#barSub").textContent=money(sub)+" · "+shipNote;
    $("#barGo").textContent=T("barCheckout");
  } else {
    bar.classList.add("empty-bar");
    $("#barTitle").textContent=T("barEmpty");
    $("#barSub").textContent=T("barHint");
    $("#barGo").textContent=T("barOpen");
  }
  if(!cart.length){
    $("#cartBody").innerHTML=`<div class="cart-empty">${T("emptyCart")}</div>`;
    $("#cartTotal").textContent=money(0);
    updatePaySum();
    return;
  }
  const shipLine = ship>0
    ? `<div class="cart-ship-note">${T("shipFee")||"رسوم التوصيل"} (COD): <b>${money(ship)}</b> · ${T("grandTotal")||"الإجمالي"}: <b>${money(grand)}</b></div>`
    : `<div class="cart-ship-note">${lang==="en"?"Delivery free on COD for this cart":"التوصيل مجاني على الدفع عند الاستلام لهذه السلة"} · ${T("grandTotal")||"الإجمالي"}: <b>${money(grand)}</b></div>`;
  $("#cartBody").innerHTML=cart.map(i=>{
    const p=products.find(x=>x.id===i.id)||i;
    return `<div class="cart-item">
      <div class="thumb">${visual(p,0)}</div>
      <div class="meta">
        <strong>${pname(p)}</strong>
        <span>${money(i.price)} · ${p.brand||""}</span>
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
  const sub=cartSubtotal();
  const ship=deliveryFee(sub, pay);
  const grand=sub+ship;
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
    subtotal:sub, shipping:ship, total:grand, currency:"OMR",
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
  const shipLine = ship>0
    ? (lang==="en"?"Delivery fee: "+money(ship):"رسوم التوصيل: "+money(ship))
    : (lang==="en"?"Delivery fee: Free":"رسوم التوصيل: مجاني");
  const msg = lang==="en"
    ? ("Hello, I want to order from Naqa:\nOrder: "+orderNo+"\nName: "+name+"\nPhone: "+phone+"\nArea: "+gov+"\nPayment: "+payLabel+"\nNote: "+note+"\n\n"+lines+"\n\nSubtotal: "+money(sub)+"\n"+shipLine+"\nTotal: "+money(grand))
    : ("السلام عليكم، أبغى أطلب من نقاء:\nرقم الطلب: "+orderNo+"\nالاسم: "+name+"\nالجوال: "+phone+"\nالمنطقة: "+gov+"\nالدفع: "+payLabel+"\nملاحظة: "+note+"\n\n"+lines+"\n\nالمجموع الفرعي: "+money(sub)+"\n"+shipLine+"\nالإجمالي: "+money(grand));
  window.open("https://wa.me/"+WA_NUMBER+"?text="+encodeURIComponent(msg), "_blank");
  const done=$("#orderDone");
  if(done){
    done.hidden=false;
    done.innerHTML=(lang==="en"
      ? ("Your order number is <b>"+orderNo+"</b>. Total <b>"+money(grand)+"</b>. WhatsApp should open now.")
      : ("رقم طلبك <b>"+orderNo+"</b>. الإجمالي <b>"+money(grand)+"</b>. واتساب يفتح الحين."));
  }
}
