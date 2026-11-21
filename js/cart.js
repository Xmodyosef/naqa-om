/* cart logic + drawer UI */
function addToCart(id, qty){
  const p=products.find(x=>x.id===id); if(!p) return;
  const n=Math.max(1, Math.min(20, parseInt(qty,10)||1));
  const row=cart.find(x=>x.id===id);
  if(row) row.qty+=n; else cart.push({id:p.id, brand:p.brand, price:p.price, sku:p.sku, qty:n});
  saveCart(); renderCart();
}

function renderCart(){
  const n=cart.reduce((s,i)=>s+i.qty,0);
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const badge=$("#cartBadge");
  if(n){ badge.hidden=false; badge.textContent=n; } else badge.hidden=true;
  const bar=$("#cartBar");
  if(n){
    bar.classList.remove("empty-bar");
    $("#barTitle").textContent=T("barItems")(n);
    var need=Math.max(0, 30-total);
    var shipNote = need>0
      ? (lang==="en" ? ("Add "+money(need)+" for free shipping") : ("أضيفي "+money(need)+" للشحن المجاني"))
      : (lang==="en" ? "Free shipping unlocked ✓" : "الشحن المجاني مفعّل ✓");
    $("#barSub").textContent=money(total)+" · "+shipNote;
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
    return;
  }
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
  }).join("");
  $("#cartTotal").textContent=money(total);
}

function openCart(){ $("#overlay").classList.add("show"); $("#drawer").classList.add("show"); }
function closeCart(){ $("#overlay").classList.remove("show"); $("#drawer").classList.remove("show"); }

function openCheckout(){
  if(typeof applyLang==="function") applyLang();
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
  const lines=cart.map(i=>{
    const p=products.find(x=>x.id===i.id)||i;
    return "• "+pname(p)+" × "+i.qty+" = "+money(i.price*i.qty);
  }).join("\n");
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const msg = lang==="en"
    ? ("Hello, I want to order from Naqa:\nName: "+name+"\nPhone: "+phone+"\nArea: "+gov+"\nNote: "+note+"\n\n"+lines+"\n\nTotal: "+money(total))
    : ("السلام عليكم، أبغى أطلب من نقاء:\nالاسم: "+name+"\nالجوال: "+phone+"\nالمنطقة: "+gov+"\nملاحظة: "+note+"\n\n"+lines+"\n\nالمجموع: "+money(total));
  window.open("https://wa.me/"+WA_NUMBER+"?text="+encodeURIComponent(msg), "_blank");
  closeCheckout();
}
