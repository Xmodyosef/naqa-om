/* core: brand, route, state, i18n */
function brandMark(brand){
  const initials=String(brand||"?").replace(/[^A-Za-z\u0600-\u06FF0-9]/g,"").slice(0,2).toUpperCase()||"•";
  const local=(typeof BRAND_LOGO!=="undefined" && BRAND_LOGO[brand])?BRAND_LOGO[brand]:"";
  const d=BRAND_DOMAIN[brand]||"";
  const q=String.fromCharCode(39);
  let mark;
  const src=local || (d?("https://www.google.com/s2/favicons?domain="+encodeURIComponent(d)+String.fromCharCode(38)+"sz=256"):"");
  if(src){
    mark='<img class="brand-logo" alt="'+esc(brand)+'" width="44" height="44" loading="lazy" decoding="async" src="'+src+'" data-i="'+esc(initials)+'" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('+q+'span'+q+'),{className:'+q+'brand-mono'+q+',textContent:this.dataset.i}))">';
  } else {
    mark='<span class="brand-mono" aria-hidden="true">'+esc(initials)+'</span>';
  }
  return '<button type="button" class="brand-link" data-brand="'+esc(brand)+'">'+mark+'<span>'+esc(brand)+'</span></button>';
}
function routeHash(){ return decodeURIComponent((location.hash||"").replace(/^#/,"")); }
function applyRoute(){
  const h=routeHash();
  if(h.indexOf("p/")===0){
    const id=+h.slice(2);
    if(products.some(x=>x.id===id)){
      if(openProductId!==id || !$("#sheet").classList.contains("show")) openSheet(id,"full",true);
      return;
    }
  }
  if($("#sheet").classList.contains("show")) closeSheet(true);
  // Search results: #q/keyword
  if(h.indexOf("q/")===0){
    const raw=h.slice(2);
    query=raw;
    currentCat="all"; currentBrand=""; currentConcern=""; wishView=false;
    const s=$("#search"); if(s) s.value=query;
    const clr=$("#searchClear"); if(clr) clr.hidden=!query;
    document.querySelectorAll("#cats [data-cat]").forEach(x=>x.classList.toggle("on", x.dataset.cat==="all"));
    render();
    const prod=$("#products"); if(prod) prod.scrollIntoView({behavior:"smooth", block:"start"});
    return;
  }
  if(h.indexOf("b/")===0){
    currentBrand=h.slice(2); currentCat="all"; query="";
    const s=$("#search"); if(s) s.value="";
    document.querySelectorAll("#cats [data-cat]").forEach(x=>x.classList.toggle("on", x.dataset.cat==="all"));
    render();
    const prod=$("#products"); if(prod) prod.scrollIntoView({behavior:"smooth"});
    return;
  }
  if(h.indexOf("c/")===0){
    currentCat=h.slice(2); currentBrand=""; query="";
    const s=$("#search"); if(s) s.value="";
    document.querySelectorAll("#cats [data-cat]").forEach(x=>x.classList.toggle("on", x.dataset.cat===currentCat));
    render();
    const prod=$("#products"); if(prod) prod.scrollIntoView({behavior:"smooth"});
    return;
  }
  // shop/products: never auto-scroll here — was fighting user scroll + causing image thrash
  if(h==="shop"||h==="products"){
    return;
  }
}

const products=(window.NAQA_PRODUCTS||[]).map(p=>Object.assign({imgs:[]},p));
function productLink(id){
  var path = location.pathname || "/";
  path = path.replace(/\/index\.html$/i, "/");
  path = path.replace(/\/(admin|order)\.html$/i, "/");
  path = path.replace(/\/p\/[0-9]+\/?$/i, "/");
  if (path.slice(-1) !== "/") path = path.replace(/\/[^/]*$/, "/");
  if (path.slice(-1) !== "/") path += "/";
  return location.origin + path + "p/" + id + "/";
}
function mergeOverrides(map){
  if(!map) return;
  products.forEach(function(p){
    var o=map[p.id]||map[String(p.id)];
    if(!o) return;
    if(o.price!=null && o.price!=="") p.price=Number(o.price);
    if(o.was!=null && o.was!=="") p.was=Number(o.was);
    if(o.stock!=null && o.stock!=="") p.stock=Number(o.stock);
    if(o.hidden!=null) p.hidden=!!o.hidden;
    ["nameAr","nameEn","descAr","descEn","useAr","useEn","skinAr","skinEn","brand","cat","sku","em"].forEach(function(k){
      if(o[k]!=null && o[k]!=="") p[k]=o[k];
    });
    if(Array.isArray(o.imgs) && o.imgs.length) p.imgs=o.imgs.filter(Boolean).slice(0,5);
  });
}
/* Storefront trusts only published data/overrides.json (fetched in boot).
   Do NOT merge localStorage naqa_overrides here — that let any browser rewrite prices into WhatsApp. */
try {
  var _allStock = products.map(function (p) { return p.stock; });
  var _all25 = _allStock.length && _allStock.every(function (s) { return Number(s) === 25; });
  if (_all25) {
    products.forEach(function (p) { p.stock = null; });
  }
} catch (e) {}
const $=s=>document.querySelector(s);

function esc(v){
  return String(v==null?"":v)
    .split("&").join("&"+"amp;")
    .split("<").join("&"+"lt;")
    .split(">").join("&"+"gt;")
    .split('"').join("&"+"quot;")
    .split("'").join("&"+"#39;");
}
let lang="ar"; try{lang=localStorage.getItem("naqa_lang")||"ar"}catch(e){}
let cart=[]; try{cart=JSON.parse(localStorage.getItem("naqa_cart")||"[]"); if(!Array.isArray(cart)) cart=[]}catch(e){cart=[]}
let query="", currentCat="all", currentBrand="", currentSort="new", openProductId=null, galleryIndex=0, sheetMode="full", pickQty=1;

const ui={
 ar:{
  search:"ابحثي...", searchHint:"ابحثي عن ماركة أو منتج…", searchBtn:"بحث", searchNo:"ما لقينا نتائج — جرّبي الماركة أو SKU", searchResults:function(q,n){return "نتائج «"+q+"» · "+n+" منتج";}, searchClearChip:"مسح البحث",
  all:"الكل", care:"عناية", face:"وجه", eyes:"عيون", brows:"حواجب", lips:"شفاه", scent:"عطور", tools:"أدوات", hair:"شعر",
  shop:"تسوّقي الآن", wa:"واتساب نقاء", products:"المنتجات", count:n=>n+" منتج", empty:"ما لقينا نتائج — جرّبي اسم الماركة أو SKU أو نوع (سكراب، سيروم…)",
  cart:"السلة", emptyCart:"السلة فاضية<br/>أضيفي من القائمة", total:"المجموع", checkout:"إتمام الطلب عبر واتساب",
  add:"أضيفي", qty:"الكمية", qv:"نظرة سريعة", open:"التفاصيل", del:"حذف", noSku:"SKU غير متوفر",
  heroTitle:"نقاء — ", heroEm:"عناية ومكياج",
  hero:"متجر عُماني للعناية والمكياج — نختار لكِ منتجات أصلية بعناية، بأسعار واضحة شاملة الضريبة، وتوصيل داخل السلطنة. جمال يبدأ بنقاء.",
  alertEmpty:"السلة فاضية", coNeedName:"اكتبي الاسم", coNeedPhone:"اكتبي رقم جوال صحيح", coNeedGov:"اختاري الولاية", stockLimit:"ما في كمية أكثر", greet:"السلام عليكم، أبغى أطلب من نقاء",
  ship:"توصيل عُمان", order:"طلب واتساب", contact:"تواصلي", shopH:"التسوق", orders:"واتساب الطلبات",
  skin:"عناية", faceL:"وجه", hairL:"شعر", admin:"لوحة التحكم", blurb:"عناية ومكياج · متجر عُماني", copy:"نقاء · Naqa · عُمان",
  about:"عن المنتج", how:"طريقة الاستعمال", skinT:"يناسب", also:"قد يعجبكِ أيضاً", same:"باقي منتجات الماركة", back:"رجوع",
  sku:"SKU", logo:"نقاء", tag:"عناية ومكياج", footAbout:"نقاء — وجهتكِ في عُمان للعناية الأصيلة والمكياج المختار. أسعار شاملة الضريبة، وتوصيل داخل السلطنة.", shipBar:"نقاء · توصيل عُمان · تحت ٣٠: +٢ ر.ع · ٣٠+: مجاني · استلام +١.٥ · أسعار شاملة الضريبة ٥٪", shipFree:"تحت ٣٠: توصيل ٢ · ٣٠+: مجاني · استلام +١.٥", sortNew:"الأحدث", sortLow:"الأقل سعراً", sortHigh:"الأعلى سعراً", sortOff:"الأعلى خصماً", swipe:"اسحبي للأسفل للإغلاق · أو من الحافة اليمنى/اليسرى", swipeFull:"اسحبي من الحافة للرجوع · مرّري الصور", banHotSub:"مختارات الزبائن · ماركات عليها طلب", banYearSub:"عرض −٣٠٪ على منتجات مختارة (سعر القائمة مشطوب)",
  openImg:"اضغطي الصورة للتكبير", barEmpty:"السلة فاضية", barHint:"أضيفي منتجات من القائمة", barItems:n=>n+" منتج في السلة", barOpen:"افتحي السلة", barCheckout:"إتمام الطلب", hot:"الأكثر مبيعاً", year:"عروض نهاية السنة", viewAll:"عرض الكل", offTag:n=>"−"+n+"%",
  quizBtn:"اختبار البشرة ✨", themeDay:"صباحي", themeNight:"مسائي", themeAuto:"تلقائي", docTitle:"نقاء · عناية ومكياج | Naqa Oman",
  saved:"المحفوظات", savedOn:"إخفاء المحفوظات", wishEmpty:"ما في منتجات محفوظة. اضغطي القلب ♥ على أي منتج.",
  coTitle:"إتمام الطلب", coHint:"نجهّز رسالة واتساب ببياناتكِ والمنتجات.", payHint:"تحت ٣٠: توصيل ٢ · من ٣٠: توصيل مجاني (مشطوب) · دفع عند الاستلام: +١.٥ · حساب بنكي: بدون رسوم استلام.",
  coName:"الاسم", coNamePh:"اسمكِ", coPhone:"الجوال", coPhonePh:"9xxxxxxx",
  coGov:"الولاية", coGovPh:"— اختاري —",
  coNote:"ملاحظة للطلب", coNotePh:"مبنى، أقرب معلم…",
  coCancel:"إلغاء", coSend:"إرسال واتساب",
  payTitle:"طريقة الدفع", payCod:"دفع عند الاستلام", payPaid:"حساب بنكي يدوي · أحوّل ثم أرسل الإيصال", payPending:"بانتظار إثبات الدفع", payPendingHint:"ادفعي لحسابنا البنكي يدوياً (مو بوابة دفع). بدون رسوم استلام. من ٣٠ ر.ع التوصيل يظهر مشطوب = مجاني.",
  payNeed:"اختاري طريقة الدفع", shipFee:"رسوم التوصيل", shipFreeCod:"مثال: ٢٥+٢+١.٥=٢٨.٥ · ٣٠+١.٥=٣١.٥",
  payStatusUnpaid:"غير مدفوع", payStatusPaid:"مدفوع", subTotal:"المجموع الفرعي", grandTotal:"الإجمالي", codFee:"رسوم الدفع عند الاستلام", vatInc:"شامل الضريبة ٥٪", vatOf:"منها ضريبة ٥٪", vatLabel:"الضريبة (٥٪ شاملة)", vatBar:"كل الأصناف · الأسعار شاملة ضريبة ٥٪",policyTitle:"",policy1:"",policy2:"",policy3:"",policy4:"",
  govs:["مسقط","ظفار","الباطنة شمال","الباطنة جنوب","الداخلية","الشرقية شمال","الشرقية جنوب","الظاهرة","البريمي","الوسطى","مسندم"]
 },
 en:{
  search:"Search...", searchHint:"Search brand or product…", searchBtn:"Search", searchNo:"No results — try a brand or SKU", searchResults:function(q,n){return "Results for “"+q+"” · "+n+" products";}, searchClearChip:"Clear search",
  all:"All", care:"Skincare", face:"Face", eyes:"Eyes", brows:"Brows", lips:"Lips", scent:"Fragrance", tools:"Tools", hair:"Hair",
  shop:"Shop now", wa:"WhatsApp Naqa", products:"Products", count:n=>n+" products", empty:"No matches — try brand name, SKU, or type (scrub, serum…)",
  cart:"Cart", emptyCart:"Your cart is empty<br/>Add from the list", total:"Total", checkout:"Checkout on WhatsApp",
  add:"Add", qty:"Qty", qv:"Quick view", open:"Details", del:"Remove", noSku:"SKU unavailable",
  heroTitle:"Naqa — ", heroEm:"Care & Makeup",
  hero:"An Omani beauty store for skincare and makeup — carefully chosen authentic products, clear VAT-inclusive prices, and delivery across the Sultanate. Beauty starts with purity.",
  alertEmpty:"Cart is empty", coNeedName:"Enter your name", coNeedPhone:"Enter a valid mobile number", coNeedGov:"Choose a wilayat", stockLimit:"No more stock", greet:"Hello, I want to order from Naqa",
  ship:"Oman delivery", order:"WhatsApp order", contact:"Contact", shopH:"Shop", orders:"Order on WhatsApp",
  skin:"Skincare", faceL:"Face", hairL:"Hair", admin:"Admin", blurb:"Care and makeup · Oman store", copy:"Naqa · Oman",
  about:"About", how:"How to use", skinT:"Best for", also:"You may also like", same:"More from this brand", back:"Back",
  sku:"SKU", logo:"Naqa", tag:"Care & Makeup", footAbout:"Naqa — your Omani destination for authentic care and curated makeup. VAT-inclusive prices and delivery across Oman.", shipBar:"Naqa · Oman delivery · under 30: +2 · 30+: free · COD +1.5 · prices include 5% VAT", shipFree:"Under 30: delivery 2 · 30+: free · COD +1.5", sortNew:"Newest", sortLow:"Lowest price", sortHigh:"Highest price", sortOff:"Biggest discount", swipe:"Swipe down to close · or from the edge", swipeFull:"Swipe from the edge to go back · swipe photos", banHotSub:"Customer favorites · in-demand brands", banYearSub:"30% off selected items for a limited time",
  openImg:"Tap image to enlarge", barEmpty:"Cart is empty", barHint:"Add products from the list", barItems:n=>n+" items in cart", barOpen:"Open cart", barCheckout:"Checkout", hot:"Best sellers", year:"Year-end deals", viewAll:"View all", offTag:n=>"−"+n+"%",
  quizBtn:"Skin quiz ✨", themeDay:"Day", themeNight:"Night", themeAuto:"Auto", docTitle:"Naqa · Care & Makeup | Naqa Oman",
  saved:"Saved", savedOn:"Hide saved", wishEmpty:"Nothing saved yet. Tap the heart on a product.",
  coTitle:"Checkout", coHint:"We'll prepare a WhatsApp message with your details and products.", payHint:"Under 30: delivery 2 · from 30: free (struck through) · COD: +1.5 · bank account: no COD fee.",
  coName:"Name", coNamePh:"Your name", coPhone:"Phone", coPhonePh:"9xxxxxxx",
  coGov:"Wilayat", coGovPh:"— Choose —",
  coNote:"Order note", coNotePh:"Building, nearest landmark…",
  coCancel:"Cancel", coSend:"Send on WhatsApp",
  payTitle:"Payment method", payCod:"Cash on delivery", payPaid:"Bank account (manual) · transfer then send proof", payPending:"Awaiting payment proof", payPendingHint:"Pay to our bank account manually (no payment gateway). No COD fee. From 30 OMR delivery shows struck-through = free.",
  payNeed:"Choose a payment method", shipFee:"Delivery fee", shipFreeCod:"Example: 25+2+1.5=28.5 · 30+1.5=31.5",
  payStatusUnpaid:"Unpaid", payStatusPaid:"Paid", subTotal:"Subtotal", grandTotal:"Grand total", codFee:"Cash on delivery fee", vatInc:"Incl. 5% VAT", vatOf:"of which 5% VAT", vatLabel:"VAT (5% included)", vatBar:"All items · prices include 5% VAT",policyTitle:"",policy1:"",policy2:"",policy3:"",policy4:"",
  govs:["Muscat","Dhofar","North Al Batinah","South Al Batinah","Ad Dakhiliyah","North Ash Sharqiyah","South Ash Sharqiyah","Ad Dhahirah","Al Buraimi","Al Wusta","Musandam"]
 }
};
const catLabel={all:"all","عناية":"care","وجه":"face","عيون":"eyes","حواجب":"brows","شفاه":"lips","عطور":"scent","أدوات":"tools","شعر":"hair"};
const T=k=>ui[lang][k];

function cleanProductCopy(s){
  if(!s) return "";
  s=String(s);
  s=s.replace(/\s*من نقاء\s*[—\-–]\s*أصلي،?\s*توصيل داخل عُمان،?\s*والطلب عبر واتساب\.?\s*(SKU\s*\S+\.?)/gi,"");
  s=s.replace(/\s*From Naqa\s*[—\-–]\s*authentic,?\s*Oman delivery,?\s*order on WhatsApp\.?\s*(SKU\s*\S+\.?)/gi,"");
  s=s.replace(/\s*والطلب عبر واتساب\.?/gi,"");
  s=s.replace(/\s*,?\s*order on WhatsApp\.?/gi,"");
  s=s.replace(/\s*SKU\s*[A-Za-z0-9\-]+\.?\s*$/gi,"");
  return s.trim();
}

const money=n=>lang==="en"?(Number(n).toFixed(3)+" OMR"):(Number(n).toFixed(3)+" "+CURRENCY);
const vatRate=()=>((typeof VAT_RATE==="number")?VAT_RATE:0.05);
const vatOf=amount=>{const r=vatRate();const n=Number(amount)||0;return r<=0?0:n*r/(1+r);};
const exVat=amount=>(Number(amount)||0)-vatOf(amount);
function vatNoteHTML(){return '<span class="vat-note">'+(T("vatInc")||"شامل الضريبة ٥٪")+'</span>';}

const pname=p=>lang==="en"?(p.nameEn||p.nameAr):(p.nameAr||p.nameEn);
const pdesc=p=>cleanProductCopy(lang==="en"?(p.descEn||p.descAr||""):(p.descAr||p.descEn||""));
const puse=p=>cleanProductCopy(lang==="en"?(p.useEn||p.useAr||""):(p.useAr||p.useEn||""));
const pskin=p=>lang==="en"?(p.skinEn||p.skinAr||""):(p.skinAr||p.skinEn||"");
const pimgs=p=>(Array.isArray(p.imgs)?p.imgs:[]).filter(Boolean).slice(0,5);
function saveCart(){try{localStorage.setItem("naqa_cart",JSON.stringify(cart))}catch(e){}}
function nl2br(t){return esc(t).split("\n").join("<br>");}
