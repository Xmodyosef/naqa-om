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
  if(h.indexOf("b/")===0){
    currentBrand=h.slice(2); currentCat="all";
    document.querySelectorAll("#cats a").forEach(x=>x.classList.toggle("on", x.dataset.cat==="all"));
    render();
    const prod=$("#products"); if(prod) prod.scrollIntoView({behavior:"smooth"});
    return;
  }
  if(h.indexOf("c/")===0){
    currentCat=h.slice(2); currentBrand="";
    document.querySelectorAll("#cats a").forEach(x=>x.classList.toggle("on", x.dataset.cat===currentCat));
    render();
    const prod=$("#products"); if(prod) prod.scrollIntoView({behavior:"smooth"});
    return;
  }
  if(h==="shop"||h==="products"){
    const prod=$("#products"); if(prod) prod.scrollIntoView({behavior:"smooth"});
  }
}

const products=(window.NAQA_PRODUCTS||[]).map(p=>Object.assign({imgs:[]},p));
function productLink(id){
  var path=location.pathname||"/";
  if(path.slice(-1)!=="/") path=path.replace(/[^/]*$/,"");
  if(path.slice(-1)!=="/") path+="/";
  return location.origin+path+"#p/"+id;
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
try{
  mergeOverrides(JSON.parse(localStorage.getItem("naqa_overrides")||"{}"));
}catch(e){}
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
  search:"ابحثي...",
  all:"الكل", care:"عناية", face:"وجه", eyes:"عيون", brows:"حواجب", lips:"شفاه", scent:"عطور", tools:"أدوات", hair:"شعر",
  shop:"تسوّقي الآن", wa:"واتساب نقاء", products:"المنتجات", count:n=>n+" منتج", empty:"ما في نتائج",
  cart:"السلة", emptyCart:"السلة فاضية<br/>أضيفي من القائمة", total:"المجموع", checkout:"إتمام الطلب عبر واتساب",
  add:"أضيفي", qty:"الكمية", qv:"نظرة سريعة", open:"التفاصيل", del:"حذف", noSku:"SKU غير متوفر",
  heroTitle:"نقاء — ", heroEm:"عناية ومكياج",
  hero:"صور حقيقية، تمرير بين ٥ صور، نظرة سريعة من غير ما تدخلي كامل، والسلة ثابتة تحت. الطلب بواتساب جاهز.",
  alertEmpty:"السلة فاضية", coNeedName:"اكتبي الاسم", coNeedPhone:"اكتبي رقم جوال صحيح", coNeedGov:"اختاري الولاية", stockLimit:"ما في كمية أكثر", greet:"السلام عليكم، أبغى أطلب من نقاء",
  ship:"توصيل عُمان", order:"طلب واتساب", contact:"تواصلي", shopH:"التسوق", orders:"واتساب الطلبات",
  skin:"عناية", faceL:"وجه", hairL:"شعر", blurb:"عناية ومكياج · متجر عُماني", copy:"نقاء · Naqa · عُمان",
  about:"عن المنتج", how:"طريقة الاستعمال", skinT:"يناسب", also:"قد يعجبكِ أيضاً", same:"باقي منتجات الماركة", back:"رجوع",
  sku:"SKU", logo:"نقاء", tag:"عناية ومكياج", shipBar:"خصم ٣٠٪ على منتجات مختارة · توصيل عُمان", shipFree:"توصيل ٢ ر.ع تحت ٣٠ · مجاني فوق ٣٠ · دفع عند الاستلام +١.٥ · المدفوع يزيل الرسوم", sortNew:"الأحدث", sortLow:"الأقل سعراً", sortHigh:"الأعلى سعراً", sortOff:"الأعلى خصماً", swipe:"اسحبي للأسفل للإغلاق · أو من الحافة اليمنى/اليسرى", swipeFull:"اسحبي من الحافة للرجوع · مرّري الصور", banHotSub:"مختارات الزبائن · ماركات عليها طلب", banYearSub:"خصم ٣٠٪ على منتجات مختارة لفترة محدودة",
  openImg:"اضغطي الصورة للتكبير", barEmpty:"السلة فاضية", barHint:"أضيفي منتجات من القائمة", barItems:n=>n+" منتج في السلة", barOpen:"افتحي السلة", barCheckout:"إتمام الطلب", hot:"الأكثر مبيعاً", year:"عروض نهاية السنة", viewAll:"عرض الكل", offTag:n=>"−"+n+"%",
  quizBtn:"اختبار البشرة ✨", docTitle:"نقاء · عناية ومكياج | www.naqa.om",
  saved:"المحفوظات", savedOn:"إخفاء المحفوظات", wishEmpty:"ما في منتجات محفوظة. اضغطي القلب ♥ على أي منتج.",
  coTitle:"إتمام الطلب", coHint:"نجهّز رسالة واتساب ببياناتكِ والمنتجات.",
  coName:"الاسم", coNamePh:"اسمكِ", coPhone:"الجوال", coPhonePh:"9xxxxxxx",
  coGov:"الولاية", coGovPh:"— اختاري —",
  coNote:"ملاحظة للطلب", coNotePh:"مبنى، أقرب معلم…",
  coCancel:"إلغاء", coSend:"إرسال واتساب",
  payTitle:"طريقة الدفع", payCod:"دفع عند الاستلام", payPaid:"مدفوع مسبقاً (تحويل)",
  payNeed:"اختاري طريقة الدفع", shipFee:"رسوم التوصيل", shipFreeCod:"مثال COD ٢٥: ٢٥+٢+١.٥=٢٨.٥ · COD ٣٠: ٣٠+١.٥=٣١.٥ · المدفوع: بدون رسوم",
  payStatusUnpaid:"غير مدفوع", payStatusPaid:"مدفوع", subTotal:"المجموع الفرعي", grandTotal:"الإجمالي", codFee:"رسوم الدفع عند الاستلام", vatInc:"شامل الضريبة ٥٪", vatOf:"منها ضريبة ٥٪", vatLabel:"الضريبة (٥٪ شاملة)", vatBar:"كل الأصناف · الأسعار شاملة ضريبة ٥٪",
  govs:["مسقط","ظفار","الباطنة شمال","الباطنة جنوب","الداخلية","الشرقية شمال","الشرقية جنوب","الظاهرة","البريمي","الوسطى","مسندم"]
 },
 en:{
  search:"Search...",
  all:"All", care:"Skincare", face:"Face", eyes:"Eyes", brows:"Brows", lips:"Lips", scent:"Fragrance", tools:"Tools", hair:"Hair",
  shop:"Shop now", wa:"WhatsApp Naqa", products:"Products", count:n=>n+" products", empty:"No results",
  cart:"Cart", emptyCart:"Your cart is empty<br/>Add from the list", total:"Total", checkout:"Checkout on WhatsApp",
  add:"Add", qty:"Qty", qv:"Quick view", open:"Details", del:"Remove", noSku:"SKU unavailable",
  heroTitle:"Naqa — ", heroEm:"Care & Makeup",
  hero:"Real photos, swipe across up to 5 images, quick view without full page, cart always at the bottom. Checkout is a ready WhatsApp message.",
  alertEmpty:"Cart is empty", coNeedName:"Enter your name", coNeedPhone:"Enter a valid mobile number", coNeedGov:"Choose a wilayat", stockLimit:"No more stock", greet:"Hello, I want to order from Naqa",
  ship:"Oman delivery", order:"WhatsApp order", contact:"Contact", shopH:"Shop", orders:"Order on WhatsApp",
  skin:"Skincare", faceL:"Face", hairL:"Hair", blurb:"Care and makeup · Oman store", copy:"Naqa · Oman",
  about:"About", how:"How to use", skinT:"Best for", also:"You may also like", same:"More from this brand", back:"Back",
  sku:"SKU", logo:"Naqa", tag:"Care & Makeup", shipBar:"30% off selected items · Oman delivery", shipFree:"Delivery 2 under 30 · free at 30+ · COD +1.5 · paid removes fees", sortNew:"Newest", sortLow:"Lowest price", sortHigh:"Highest price", sortOff:"Biggest discount", swipe:"Swipe down to close · or from the edge", swipeFull:"Swipe from the edge to go back · swipe photos", banHotSub:"Customer favorites · in-demand brands", banYearSub:"30% off selected items for a limited time",
  openImg:"Tap image to enlarge", barEmpty:"Cart is empty", barHint:"Add products from the list", barItems:n=>n+" items in cart", barOpen:"Open cart", barCheckout:"Checkout", hot:"Best sellers", year:"Year-end deals", viewAll:"View all", offTag:n=>"−"+n+"%",
  quizBtn:"Skin quiz ✨", docTitle:"Naqa · Care & Makeup | www.naqa.om",
  saved:"Saved", savedOn:"Hide saved", wishEmpty:"Nothing saved yet. Tap the heart on a product.",
  coTitle:"Checkout", coHint:"We'll prepare a WhatsApp message with your details and products.",
  coName:"Name", coNamePh:"Your name", coPhone:"Phone", coPhonePh:"9xxxxxxx",
  coGov:"Wilayat", coGovPh:"— Choose —",
  coNote:"Order note", coNotePh:"Building, nearest landmark…",
  coCancel:"Cancel", coSend:"Send on WhatsApp",
  payTitle:"Payment method", payCod:"Cash on delivery", payPaid:"Paid in advance (transfer)",
  payNeed:"Choose a payment method", shipFee:"Delivery fee", shipFreeCod:"COD 25: 25+2+1.5=28.5 · COD 30: 30+1.5=31.5 · paid: no fees",
  payStatusUnpaid:"Unpaid", payStatusPaid:"Paid", subTotal:"Subtotal", grandTotal:"Grand total", codFee:"Cash on delivery fee", vatInc:"Incl. 5% VAT", vatOf:"of which 5% VAT", vatLabel:"VAT (5% included)", vatBar:"All items · prices include 5% VAT",
  govs:["Muscat","Dhofar","North Al Batinah","South Al Batinah","Ad Dakhiliyah","North Ash Sharqiyah","South Ash Sharqiyah","Ad Dhahirah","Al Buraimi","Al Wusta","Musandam"]
 }
};
const catLabel={all:"all","عناية":"care","وجه":"face","عيون":"eyes","حواجب":"brows","شفاه":"lips","عطور":"scent","أدوات":"tools","شعر":"hair"};
const T=k=>ui[lang][k];
const money=n=>lang==="en"?(Number(n).toFixed(3)+" OMR"):(Number(n).toFixed(3)+" "+CURRENCY);
const vatRate=()=>((typeof VAT_RATE==="number")?VAT_RATE:0.05);
const vatOf=amount=>{const r=vatRate();const n=Number(amount)||0;return r<=0?0:n*r/(1+r);};
const exVat=amount=>(Number(amount)||0)-vatOf(amount);
function vatNoteHTML(){return '<span class="vat-note">'+(T("vatInc")||"شامل الضريبة ٥٪")+'</span>';}

const pname=p=>lang==="en"?(p.nameEn||p.nameAr):(p.nameAr||p.nameEn);
const pdesc=p=>lang==="en"?(p.descEn||p.descAr||""):(p.descAr||p.descEn||"");
const puse=p=>lang==="en"?(p.useEn||p.useAr||""):(p.useAr||p.useEn||"");
const pskin=p=>lang==="en"?(p.skinEn||p.skinAr||""):(p.skinAr||p.skinEn||"");
const pimgs=p=>(Array.isArray(p.imgs)?p.imgs:[]).filter(Boolean).slice(0,5);
function saveCart(){try{localStorage.setItem("naqa_cart",JSON.stringify(cart))}catch(e){}}
function nl2br(t){return esc(t).split("\n").join("<br>");}
