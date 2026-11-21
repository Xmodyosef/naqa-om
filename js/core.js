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
  alertEmpty:"السلة فاضية", greet:"السلام عليكم، أبغى أطلب من نقاء",
  ship:"توصيل عُمان", order:"طلب واتساب", contact:"تواصلي", shopH:"التسوق", orders:"واتساب الطلبات",
  skin:"عناية", faceL:"وجه", hairL:"شعر", blurb:"عناية ومكياج · متجر عُماني", copy:"نقاء · Naqa · عُمان",
  about:"عن المنتج", how:"طريقة الاستعمال", skinT:"يناسب", also:"قد يعجبكِ أيضاً", same:"باقي منتجات الماركة", back:"رجوع",
  sku:"SKU", logo:"نقاء", tag:"عناية ومكياج", shipBar:"خصم ٣٠٪ على منتجات مختارة · توصيل عُمان", shipFree:"توصيل مجاني للطلبات فوق ٣٠ ر.ع", sortNew:"الأحدث", sortLow:"الأقل سعراً", sortHigh:"الأعلى سعراً", sortOff:"الأعلى خصماً", swipe:"اسحبي للأسفل للإغلاق · أو من الحافة اليمنى/اليسرى", swipeFull:"اسحبي من الحافة للرجوع · مرّري الصور", banHotSub:"مختارات الزبائن · ماركات عليها طلب", banYearSub:"خصم ٣٠٪ على منتجات مختارة لفترة محدودة",
  openImg:"اضغطي الصورة للتكبير", barEmpty:"السلة فاضية", barHint:"أضيفي منتجات من القائمة", barItems:n=>n+" منتج في السلة", barOpen:"افتحي السلة", barCheckout:"إتمام الطلب", hot:"الأكثر مبيعاً", year:"عروض نهاية السنة", viewAll:"عرض الكل", offTag:n=>"−"+n+"%",
  quizBtn:"اختبار البشرة ✨", docTitle:"نقاء · عناية ومكياج | www.naqa.om",
  saved:"المحفوظات", savedOn:"إخفاء المحفوظات", wishEmpty:"ما في منتجات محفوظة. اضغطي القلب ♥ على أي منتج.",
  coTitle:"إتمام الطلب", coHint:"نجهّز رسالة واتساب ببياناتكِ والمنتجات.",
  coName:"الاسم", coNamePh:"اسمكِ", coPhone:"الجوال", coPhonePh:"9xxxxxxx",
  coGov:"الولاية", coGovPh:"— اختاري —",
  coNote:"ملاحظة للطلب", coNotePh:"مبنى، أقرب معلم…",
  coCancel:"إلغاء", coSend:"إرسال واتساب",
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
  alertEmpty:"Cart is empty", greet:"Hello, I want to order from Naqa",
  ship:"Oman delivery", order:"WhatsApp order", contact:"Contact", shopH:"Shop", orders:"Order on WhatsApp",
  skin:"Skincare", faceL:"Face", hairL:"Hair", blurb:"Care and makeup · Oman store", copy:"Naqa · Oman",
  about:"About", how:"How to use", skinT:"Best for", also:"You may also like", same:"More from this brand", back:"Back",
  sku:"SKU", logo:"Naqa", tag:"Care & Makeup", shipBar:"30% off selected items · Oman delivery", shipFree:"Free delivery on orders over 30 OMR", sortNew:"Newest", sortLow:"Lowest price", sortHigh:"Highest price", sortOff:"Biggest discount", swipe:"Swipe down to close · or from the edge", swipeFull:"Swipe from the edge to go back · swipe photos", banHotSub:"Customer favorites · in-demand brands", banYearSub:"30% off selected items for a limited time",
  openImg:"Tap image to enlarge", barEmpty:"Cart is empty", barHint:"Add products from the list", barItems:n=>n+" items in cart", barOpen:"Open cart", barCheckout:"Checkout", hot:"Best sellers", year:"Year-end deals", viewAll:"View all", offTag:n=>"−"+n+"%",
  quizBtn:"Skin quiz ✨", docTitle:"Naqa · Care & Makeup | www.naqa.om",
  saved:"Saved", savedOn:"Hide saved", wishEmpty:"Nothing saved yet. Tap the heart on a product.",
  coTitle:"Checkout", coHint:"We'll prepare a WhatsApp message with your details and products.",
  coName:"Name", coNamePh:"Your name", coPhone:"Phone", coPhonePh:"9xxxxxxx",
  coGov:"Wilayat", coGovPh:"— Choose —",
  coNote:"Order note", coNotePh:"Building, nearest landmark…",
  coCancel:"Cancel", coSend:"Send on WhatsApp",
  govs:["Muscat","Dhofar","North Al Batinah","South Al Batinah","Ad Dakhiliyah","North Ash Sharqiyah","South Ash Sharqiyah","Ad Dhahirah","Al Buraimi","Al Wusta","Musandam"]
 }
};
const catLabel={all:"all","عناية":"care","وجه":"face","عيون":"eyes","حواجب":"brows","شفاه":"lips","عطور":"scent","أدوات":"tools","شعر":"hair"};
const T=k=>ui[lang][k];
const money=n=>lang==="en"?(Number(n).toFixed(3)+" OMR"):(Number(n).toFixed(3)+" "+CURRENCY);
const pname=p=>lang==="en"?(p.nameEn||p.nameAr):(p.nameAr||p.nameEn);
const pdesc=p=>lang==="en"?(p.descEn||p.descAr||""):(p.descAr||p.descEn||"");
const puse=p=>lang==="en"?(p.useEn||p.useAr||""):(p.useAr||p.useEn||"");
const pskin=p=>lang==="en"?(p.skinEn||p.skinAr||""):(p.skinAr||p.skinEn||"");
const pimgs=p=>(Array.isArray(p.imgs)?p.imgs:[]).filter(Boolean).slice(0,5);
function saveCart(){try{localStorage.setItem("naqa_cart",JSON.stringify(cart))}catch(e){}}
function nl2br(t){return esc(t).split("\n").join("<br>");}
