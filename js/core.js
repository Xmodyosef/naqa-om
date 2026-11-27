/* core: brand, route, state, i18n */
function brandMark(brand, opts){
  opts = opts || {};
  const initials=String(brand||"?").replace(/[^A-Za-z\u0600-\u06FF0-9]/g,"").slice(0,2).toUpperCase()||"•";
  const local=(typeof BRAND_LOGO!=="undefined" && BRAND_LOGO[brand])?BRAND_LOGO[brand]:"";
  const d=BRAND_DOMAIN[brand]||"";
  const q=String.fromCharCode(39);
  let mark;
  const src=local || (d?("https://www.google.com/s2/favicons?domain="+encodeURIComponent(d)+String.fromCharCode(38)+"sz=256"):"");
  if(src){
    mark='<img class="brand-logo" alt="" width="44" height="44" loading="lazy" decoding="async" src="'+src+'" data-i="'+esc(initials)+'" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('+q+'span'+q+'),{className:'+q+'brand-mono'+q+',textContent:this.dataset.i}))">';
  } else {
    mark='<span class="brand-mono" aria-hidden="true">'+esc(initials)+'</span>';
  }
  /* iconOnly: logo/initials only — used on product sheet once; still filters by brand */
  if(opts.iconOnly){
    return '<button type="button" class="brand-link brand-icon-only" data-brand="'+esc(brand)+'" aria-label="'+(typeof lang!=="undefined"&&lang==="en"?("All from "+brand):("كل منتجات "+brand))+'">'+mark+'</button>';
  }
  if(opts.nameOnly){
    return '<button type="button" class="brand-link brand-name-only" data-brand="'+esc(brand)+'">'+esc(brand)+'</button>';
  }
  /* default (cards): icon + name side by side */
  return '<button type="button" class="brand-link" data-brand="'+esc(brand)+'">'+mark+'<span>'+esc(brand)+'</span></button>';
}
function routeHash(){ return decodeURIComponent((location.hash||"").replace(/^#/,"")); }
/** Barcode/SKU path segment only (no #, no p/). */
function productRouteKey(p){
  if(!p) return "";
  var s=String(p.sku||"").trim();
  if(s) return encodeURIComponent(s);
  return String(p.id);
}
/** Site folders that are never a product barcode. */
var NAQA_PATH_RESERVED={
  admin:1, order:1, panel:1, media:1, js:1, css:1, data:1, p:1, docs:1, scripts:1,
  index:1, store:1, clear:1, products:1, tmp:1, ".github":1
};
function isReservedRoute(h){
  h=String(h||"");
  if(!h) return true;
  if(h==="shop"||h==="top"||h==="products"||h==="all") return true;
  if(h.indexOf("shelf/")===0||h.indexOf("cat/")===0||h.indexOf("q/")===0||h.indexOf("b/")===0||h.indexOf("c/")===0) return true;
  return false;
}
function findProductByRoute(key){
  key=String(key==null?"":key).trim();
  if(!key) return null;
  try{ key=decodeURIComponent(key); }catch(e){}
  key=String(key||"").trim();
  if(!key) return null;
  if(key.indexOf("p/")===0) key=key.slice(2);
  if(key.indexOf("sku/")===0) key=key.slice(4);
  if(key.indexOf("product/")===0) key=key.slice(8);
  key=String(key||"").trim();
  if(!key) return null;
  var list=(typeof products!=="undefined" && products)?products:[];
  var hit=list.find(function(x){ return String(x.sku||"")===key; });
  if(hit) return hit;
  var kl=key.toLowerCase();
  hit=list.find(function(x){ return String(x.sku||"").toLowerCase()===kl; });
  if(hit) return hit;
  if(/^[0-9]{1,4}$/.test(key)){
    var id=+key;
    hit=list.find(function(x){ return Number(x.id)===id; });
    if(hit) return hit;
  }
  return null;
}
/** Path segment after base: /naqa-om/8800…/ → "8800…" */
function productKeyFromPath(){
  try{
    var base=siteBasePath();
    var path=String(location.pathname||"/");
    if(base && path.indexOf(base)===0) path=path.slice(base.length);
    path=path.replace(/^\/+|\/+$/g,"");
    if(!path || path.indexOf("/")>=0) return null;
    if(/\./.test(path)) return null;
    if(NAQA_PATH_RESERVED[path.toLowerCase()]) return null;
    return path;
  }catch(e){ return null; }
}
function isProductPath(){
  var k=productKeyFromPath();
  return !!(k && findProductByRoute(k));
}
/** Legacy hash product? #barcode or #p/… */
function isProductHash(h){
  h=String(h||"");
  if(!h || isReservedRoute(h)) return false;
  if(h.indexOf("p/")===0) return !!findProductByRoute(h.slice(2));
  return !!findProductByRoute(h);
}
function productKeyFromSearch(){
  try{
    var q=new URLSearchParams(location.search||"");
    var s=q.get("sku")||"";
    if(s) return s;
  }catch(e){}
  return null;
}
function isProductLocation(){
  return !!productKeyFromSearch() || isProductPath() || isProductHash(routeHash());
}
/** Store product URL stays on the shop path so CSS/JS/images keep loading.
 *  Barcode is the query: …/naqa-om/?sku=8800…  (no #, no /p/, no extra folder) */
function productHref(p){
  var key=productRouteKey(p);
  return location.origin + siteBasePath() + (key?("?sku="+key):"");
}
function applyRoute(){
  /* Product lives on the store URL: ?sku=BARCODE (also legacy path or #) */
  var searchKey=productKeyFromSearch();
  var pathKey=productKeyFromPath();
  const h=routeHash();
  var prodKey=searchKey||null;
  if(!prodKey && pathKey) prodKey=pathKey;
  if(!prodKey){
    if(h.indexOf("p/")===0) prodKey=h.slice(2);
    else if(!isReservedRoute(h)) prodKey=h;
  }
  if(prodKey){
    const prod=findProductByRoute(prodKey);
    if(prod){
      const id=prod.id;
      if(openProductId!==id || !$("#sheet").classList.contains("show")) openSheet(id,"full",true);
      try{
        var want=productRouteKey(prod);
        var need=siteBasePath()+"?sku="+want;
        var cur=location.pathname+(location.search||"");
        var basePath=siteBasePath();
        /* always pin the address bar to the store + ?sku= so assets resolve */
        if(cur.replace(/\/+$/,"")!==(basePath+"?sku="+want).replace(/\/+$/,"") || location.hash){
          history.replaceState({naqa:"product",id:prod.id,sku:prod.sku||""}, "", need);
        }
      }catch(e){}
      return;
    }
  }
  if($("#sheet").classList.contains("show")) closeSheet(true);
  // Search results: #q/keyword
  if(h.indexOf("shelf/")===0){
    var sk=h.slice(6);
    catalogBrowse=true; currentBrand=""; currentConcern=""; wishView=false; query=""; currentCat="all";
    if(sk==="hot"){ window.__naqaShelfFilter="hot"; currentSort="new"; }
    else if(sk==="off"){ window.__naqaShelfFilter="off"; currentSort="off"; }
    else { window.__naqaShelfFilter=""; }
    document.querySelectorAll("#cats [data-cat]").forEach(x=>x.classList.toggle("on", x.dataset.cat==="all"));
    render();
    return;
  }
  if(h==="products" || h==="all"){
    catalogBrowse=true; window.__naqaShelfFilter=""; currentCat="all"; currentBrand=""; query="";
    document.querySelectorAll("#cats [data-cat]").forEach(x=>x.classList.toggle("on", true && x.dataset.cat==="all"));
    render();
    return;
  }
  if(h.indexOf("cat/")===0){
    var cid=h.slice(4);
    if(cid==="off") cid="eoy";
    currentCatalog=cid; currentBrand=""; currentConcern=""; wishView=false; query=""; currentCat="all";
    window.__naqaShelfFilter=""; catalogBrowse=true;
    var s=$("#search"); if(s) s.value="";
    document.querySelectorAll("#cats [data-cat]").forEach(x=>x.classList.toggle("on", x.dataset.cat==="all"));
    var catDef=typeof catalogById==="function"?catalogById(cid):null;
    if(catDef && catDef.sort) currentSort=catDef.sort;
    render();
    var prod=$("#products"); if(prod) prod.scrollIntoView({behavior:"smooth"});
    return;
  }
  if(h==="shop" || h==="" || h==="top"){
    catalogBrowse=false; window.__naqaShelfFilter=""; currentCat="all"; currentBrand=""; currentConcern=""; wishView=false; query=""; currentCatalog="";
    document.querySelectorAll("#cats [data-cat]").forEach(x=>x.classList.toggle("on", x.dataset.cat==="all"));
    const s=$("#search"); if(s) s.value="";
    const clr=$("#searchClear"); if(clr) clr.hidden=true;
    render();
    return;
  }
  if(h.indexOf("q/")===0){
    const raw=h.slice(2);
    query=raw;
    currentCat="all"; currentBrand=""; currentConcern=""; wishView=false; catalogBrowse=true; window.__naqaShelfFilter="";
    const s=$("#search"); if(s) s.value=query;
    const clr=$("#searchClear"); if(clr) clr.hidden=!query;
    document.querySelectorAll("#cats [data-cat]").forEach(x=>x.classList.toggle("on", x.dataset.cat==="all"));
    render();
    if(window.__naqaReturnY != null){ if(typeof naqaRestoreShopScroll==="function") naqaRestoreShopScroll(); return; }
    const prod=$("#products"); if(prod) prod.scrollIntoView({behavior:"smooth", block:"start"});
    return;
  }
  if(h.indexOf("b/")===0){
    currentBrand=h.slice(2); currentCat="all"; query=""; catalogBrowse=true; window.__naqaShelfFilter=""; currentCatalog="";
    const s=$("#search"); if(s) s.value="";
    document.querySelectorAll("#cats [data-cat]").forEach(x=>x.classList.toggle("on", x.dataset.cat==="all"));
    render();
    if(window.__naqaReturnY != null){ if(typeof naqaRestoreShopScroll==="function") naqaRestoreShopScroll(); return; }
    const prod=$("#products"); if(prod) prod.scrollIntoView({behavior:"smooth"});
    return;
  }
  if(h.indexOf("c/")===0){
    currentCat=h.slice(2); currentBrand=""; query=""; catalogBrowse=(currentCat!=="all"); window.__naqaShelfFilter=""; currentCatalog="";
    const s=$("#search"); if(s) s.value="";
    document.querySelectorAll("#cats [data-cat]").forEach(x=>x.classList.toggle("on", x.dataset.cat===currentCat));
    render();
    if(window.__naqaReturnY != null){ if(typeof naqaRestoreShopScroll==="function") naqaRestoreShopScroll(); return; }
    const prod=$("#products"); if(prod) prod.scrollIntoView({behavior:"smooth"});
    return;
  }
  // shop/products: never auto-scroll here — was fighting user scroll + causing image thrash
  if(h==="shop"||h==="products"||h===""||h==="top"){
    if(window.__naqaReturnY != null && typeof naqaRestoreShopScroll==="function") naqaRestoreShopScroll();
    return;
  }
  if(window.__naqaReturnY != null && typeof naqaRestoreShopScroll==="function") naqaRestoreShopScroll();
}

const products=(window.NAQA_PRODUCTS||[]).map(p=>Object.assign({imgs:[]},p));
/** Merge lazy product copy (desc/use/skin) after first paint. */
function naqaMergeProductDetails(map){
  if(!map||typeof map!=="object")return;
  products.forEach(function(p){
    var d=map[String(p.id)]||map[p.id];
    if(!d)return;
    if(d.descAr!=null)p.descAr=d.descAr;
    if(d.descEn!=null)p.descEn=d.descEn;
    if(d.useAr!=null)p.useAr=d.useAr;
    if(d.useEn!=null)p.useEn=d.useEn;
    if(d.skinAr!=null)p.skinAr=d.skinAr;
    if(d.skinEn!=null)p.skinEn=d.skinEn;
  });
}
window.naqaMergeProductDetails=naqaMergeProductDetails;

/** Base path of the store (project pages: /naqa-om/). Never strip the last folder when there is no trailing slash. */
function siteBasePath(){
  var path = location.pathname || "/";
  path = path.replace(/\/index\.html$/i, "/");
  path = path.replace(/\/(admin|order|panel|store|clear-cache)\.html$/i, "/");
  path = path.replace(/\/p\/[^/]+\/?$/i, "/");
  /* strip product barcode folder only when under a project base: /naqa-om/SKU/ → /naqa-om/ */
  var parts = path.split("/").filter(Boolean);
  if(parts.length >= 2){
    var last = parts[parts.length - 1];
    var low = String(last).toLowerCase();
    if(!/\./.test(last) && !NAQA_PATH_RESERVED[low]){
      /* barcodes: long digits, or alnum codes (ZE316, DB-…, Z0207) */
      if(/^[0-9]{6,}$/.test(last) || /^[A-Za-z]{1,6}[-_]?[0-9A-Za-z._-]{2,}$/.test(last) || /^[0-9A-Za-z][0-9A-Za-z._-]{7,}$/.test(last)){
        parts.pop();
        path = "/" + parts.join("/") + "/";
      }
    }
  }
  if (/\/[^/]+\.[a-zA-Z0-9]+$/.test(path)) {
    path = path.replace(/\/[^/]+$/, "/");
  }
  if (path.slice(-1) !== "/") path += "/";
  return path;
}
/** Share link: …/naqa-om/?sku=BARCODE  — store stays put, barcode in the query */
function productLink(idOrProduct){
  var p=null;
  if(idOrProduct && typeof idOrProduct==="object") p=idOrProduct;
  else if(idOrProduct!=null && idOrProduct!==""){
    var id=idOrProduct;
    p=(typeof products!=="undefined"?products:[]).find(function(x){ return Number(x.id)===Number(id) || String(x.id)===String(id); })||null;
  }
  if(p) return productHref(p);
  var key=encodeURIComponent(String(idOrProduct||"").trim());
  return location.origin + siteBasePath() + (key?("?sku="+key):"");
}
function productHash(idOrProduct){
  var p=null;
  if(idOrProduct && typeof idOrProduct==="object") p=idOrProduct;
  else if(idOrProduct!=null && idOrProduct!==""){
    p=(typeof products!=="undefined"?products:[]).find(function(x){ return Number(x.id)===Number(idOrProduct) || String(x.id)===String(idOrProduct); })||null;
  }
  var key=p ? productRouteKey(p) : encodeURIComponent(String(idOrProduct||"").trim());
  return siteBasePath() + (key?("?sku="+key):"");
}

function naqaNormImgPath(u){
  u=String(u||"").trim();
  if(!u) return "";
  try{
    if(/^https?:\/\//i.test(u)){
      var path=u.replace(/^https?:\/\/[^/]+/i,"");
      var base="";
      try{ base=(location.pathname||"").replace(/\/[^/]*$/,"/"); }catch(e){}
      if(base && path.indexOf(base)===0) path=path.slice(base.length);
      if (path.charAt(0) === "/") path = path.slice(1);
      if(/^media\//i.test(path)) return path;
    }
  }catch(e){}
  return u.replace(/^\.\//,"").replace(/^\//,"");
}
function naqaIsCatalogImg(u){
  u=naqaNormImgPath(u);
  return /^media\//i.test(u)||/^p\//i.test(u);
}
function naqaIsWipeImgs(base, saved){
  base=(base||[]).map(naqaNormImgPath).filter(Boolean);
  saved=(saved||[]).map(naqaNormImgPath).filter(Boolean);
  if(!base.length||!saved.length) return false;
  var set={}; base.forEach(function(u){ set[u]=1; });
  if(saved.some(function(u){ return set[u]; })) return false;
  return saved.every(function(u){ return !naqaIsCatalogImg(u); });
}
function naqaKeepImgs(base, saved, removed){
  removed=removed||{};
  var rem={};
  Object.keys(removed).forEach(function(k){ rem[naqaNormImgPath(k)]=1; });
  base=(base||[]).map(naqaNormImgPath).filter(Boolean);
  saved=(saved||[]).map(function(u){ return String(u||"").trim(); }).filter(Boolean);
  var out=[], seen={};
  function add(raw){
    var u=String(raw||"").trim();
    if(!u) return;
    var key=naqaNormImgPath(u);
    if(!key||seen[key]||rem[key]||out.length>=6) return;
    seen[key]=1;
    out.push(u.indexOf("fs:")===0||/^https:\/\//i.test(u)?u:key);
  }
  if(naqaIsWipeImgs(base, saved)){
    saved.forEach(add);
    base.forEach(add);
    return out;
  }
  if(saved.length){
    saved.forEach(add);
    return out;
  }
  base.forEach(add);
  return out;
}

/** Repair: keep catalog sellable — stock floor 3, undo mass-hide flash. */
function naqaForceCatalogStock(){
  try{
    products.forEach(function(p){
      var n = Number(p.stock);
      if(!isFinite(n) || n < 1) p.stock = 3;
      else p.stock = n;
    });
  }catch(e){}
}
function naqaUnhideIfEmptyCatalog(){
  try{
    var vis = products.filter(function(p){ return !p.hidden; });
    if(!vis.length && products.length){
      products.forEach(function(p){ p.hidden = false; if(!isFinite(Number(p.stock))||Number(p.stock)<1) p.stock=3; });
    }
  }catch(e){}
}
function mergeOverrides(map){
  if(!map) map={};
  /* Inject admin-created products (_new) into live catalog */
  Object.keys(map).forEach(function(id){
    var o=map[id];
    if(!o || !o._new) return;
    var exists=products.some(function(p){ return String(p.id)===String(id); });
    if(exists) return;
    var nid=id;
    if(/^\d+$/.test(String(id))) nid=Number(id);
    products.push({
      id:nid,
      brand:o.brand||"",
      cat:o.cat||"",
      sku:o.sku||"",
      price:o.price!=null&&o.price!==""?Number(o.price):0,
      was:o.was!=null&&o.was!==""?Number(o.was):undefined,
      stock:o.stock!=null&&o.stock!==""?Number(o.stock):3,
      imgs:Array.isArray(o.imgs)?o.imgs.filter(Boolean).slice(0,6):[],
      nameAr:o.nameAr||"",
      nameEn:o.nameEn||"",
      descAr:o.descAr||"",
      descEn:o.descEn||"",
      useAr:o.useAr||"",
      useEn:o.useEn||"",
      skinAr:o.skinAr||"",
      skinEn:o.skinEn||"",
      hot:!!o.hot,
      hidden:!!o.hidden,
      taxMode:o.taxMode,
      taxCustom:o.taxCustom,
      _new:true
    });
  });
  products.forEach(function(p){
    var o=map[p.id]||map[String(p.id)];
    if(!o){ return; } /* never force-visible on empty/partial map — prevents flash */
    if(o.price!=null && o.price!=="") p.price=Number(o.price);
    if(o.was!=null && o.was!=="") p.was=Number(o.was);
    if(o.stock!=null && o.stock!=="") p.stock=Number(o.stock);
    if(Object.prototype.hasOwnProperty.call(o, "hidden")) p.hidden=!!o.hidden;
    if(Object.prototype.hasOwnProperty.call(o, "hot")) p.hot=!!o.hot;
    if(o.taxMode==="exempt"||o.taxMode==="custom"||o.taxMode==="vat5") p.taxMode=o.taxMode; else if(o.taxMode==null) delete p.taxMode;
    if(o.taxCustom!=null && o.taxCustom!=="") p.taxCustom=Number(o.taxCustom); else if(o.taxMode!=="custom") delete p.taxCustom;
    ["nameAr","nameEn","descAr","descEn","useAr","useEn","skinAr","skinEn","brand","cat","sku","em"].forEach(function(k){
      if(o[k]!=null && o[k]!=="") p[k]=o[k];
    });
    var rem={}; (o.removedImgs||[]).forEach(function(u){ rem[naqaNormImgPath(u)]=1; });
    if(Array.isArray(o.imgs)){
      if(naqaIsWipeImgs(p.imgs, o.imgs)) p.imgs=naqaKeepImgs(p.imgs, o.imgs, rem);
      else p.imgs=o.imgs.map(function(u){ return String(u||"").trim(); }).filter(Boolean).slice(0,6);
    } else if(o.removedImgs && o.removedImgs.length){
      p.imgs=(p.imgs||[]).filter(function(u){ return u && !rem[naqaNormImgPath(u)]; });
    }
  });
  naqaForceCatalogStock();
  naqaUnhideIfEmptyCatalog();
}

window.naqaHydrateFsImages = function () {
  var cache = window.__naqaFsCache = window.__naqaFsCache || {};
  var ids = [];
  var seen = {};
  products.forEach(function (p) {
    (p.imgs || []).forEach(function (s) {
      if (typeof s !== "string" || s.indexOf("fs:") !== 0) return;
      var id = s.slice(3);
      if (!id || seen[id] || cache[id]) return;
      seen[id] = 1;
      ids.push(id);
    });
  });
  function apply() {
    var changed = false;
    products.forEach(function (p) {
      if (!Array.isArray(p.imgs)) return;
      p.imgs = p.imgs.map(function (s) {
        if (typeof s === "string" && s.indexOf("fs:") === 0 && cache[s.slice(3)]) {
          changed = true;
          return cache[s.slice(3)];
        }
        return s;
      });
    });
    return changed;
  }
  if (!ids.length || !window.firebase || !firebase.apps || !firebase.apps.length || !firebase.firestore) {
    apply();
    return Promise.resolve(false);
  }
  var db = firebase.firestore();
  return Promise.all(ids.map(function (id) {
    return db.collection("naqa_imgs").doc(id).get().then(function (snap) {
      var j = snap.exists && snap.data() && snap.data().jpeg;
      if (j) cache[id] = "data:image/jpeg;base64," + j;
    }).catch(function () {});
  })).then(apply);
};
/* Storefront trusts only published data/overrides.json (fetched in boot).
   Do NOT merge localStorage naqa_overrides here — that let any browser rewrite prices into WhatsApp. */
try {
  /* Default stock: 3 when missing/empty. Do not wipe uniform stock. */
  products.forEach(function (p) {
    if (p.stock == null || p.stock === "" || !isFinite(Number(p.stock)) || Number(p.stock) < 1) p.stock = 3;
    if (p.hidden == null) p.hidden = false;
  });
  naqaForceCatalogStock();
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
  shop:"تسوّقي الآن", wa:"واتساب نقاء", products:"المنتجات", catalog:"الكتالوج", count:n=>n+" منتج", empty:"ما لقينا نتائج — جرّبي اسم الماركة أو SKU أو نوع (سكراب، سيروم…)",
  cart:"السلة", emptyCart:"السلة فاضية<br/>أضيفي من القائمة", total:"المجموع", checkout:"إتمام الطلب عبر واتساب",
  add:"أضف", addCart:"أضف للسلة", addBoth:"أضف الاثنين", qty:"الكمية", qv:"نظرة سريعة", open:"التفاصيل", del:"حذف", noSku:"SKU غير متوفر",
  heroTitle:"نقاء — ", heroEm:"عناية ومكياج",
  hero:"متجر عُماني موثوق: عناية كورية ومكياج يومي بأسعار واضحة وتوصيل داخل السلطنة. اختاري منتجك — وأكملي الطلب بواتساب خلال دقائق.",
  alertEmpty:"السلة فاضية", coNeedName:"اكتبي الاسم", coNeedPhone:"اكتبي رقم جوال صحيح", coNeedGov:"اختاري الولاية", stockLimit:"ما في كمية أكثر", greet:"السلام عليكم، أبغى أطلب من نقاء",
  ship:"توصيل عُمان", order:"طلب واتساب", contact:"تواصلي", shopH:"التسوق", orders:"واتساب الطلبات",
  skin:"عناية", faceL:"وجه", hairL:"شعر", admin:"لوحة التحكم", blurb:"عناية ومكياج · متجر عُماني", copy:"نقاء · Naqa · عُمان",
  about:"عن المنتج", how:"طريقة الاستعمال", skinT:"يناسب", also:"قد يعجبكِ أيضاً", same:"باقي منتجات الماركة", back:"رجوع",
  sku:"SKU", logo:"نقاء", tag:"عناية ومكياج", footAbout:"نقاء — وجهتكِ في عُمان للعناية الأصيلة والمكياج المختار. أسعار شاملة الضريبة، وتوصيل داخل السلطنة.", shipBar:"نقاء · توصيل عُمان · تحت ٣٠: +٢ ر.ع · ٣٠+: مجاني · استلام +١.٥ · أسعار شاملة الضريبة ٥٪", shipFree:"تحت ٣٠: توصيل ٢ · ٣٠+: مجاني · استلام +١.٥", sortNew:"الأحدث", sortLow:"الأقل سعراً", sortHigh:"الأعلى سعراً", sortOff:"الأعلى خصماً", banHotSub:"مختارات الزبائن · ماركات عليها طلب", banYearSub:"عرض −٣٠٪ على منتجات مختارة (سعر القائمة مشطوب)",
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
  shop:"Shop now", wa:"WhatsApp Naqa", products:"Products", catalog:"Catalog", count:n=>n+" products", empty:"No matches — try brand name, SKU, or type (scrub, serum…)",
  cart:"Cart", emptyCart:"Your cart is empty<br/>Add from the list", total:"Total", checkout:"Checkout on WhatsApp",
  add:"Add", addCart:"Add to cart", addBoth:"Add both", qty:"Qty", qv:"Quick view", open:"Details", del:"Remove", noSku:"SKU unavailable",
  heroTitle:"Naqa — ", heroEm:"Care & Makeup",
  hero:"Trusted Omani store: K-beauty and everyday makeup with clear prices and delivery across Oman. Pick your products — finish on WhatsApp in minutes.",
  alertEmpty:"Cart is empty", coNeedName:"Enter your name", coNeedPhone:"Enter a valid mobile number", coNeedGov:"Choose a wilayat", stockLimit:"No more stock", greet:"Hello, I want to order from Naqa",
  ship:"Oman delivery", order:"WhatsApp order", contact:"Contact", shopH:"Shop", orders:"Order on WhatsApp",
  skin:"Skincare", faceL:"Face", hairL:"Hair", admin:"Admin", blurb:"Care and makeup · Oman store", copy:"Naqa · Oman",
  about:"About", how:"How to use", skinT:"Best for", also:"You may also like", same:"More from this brand", back:"Back",
  sku:"SKU", logo:"Naqa", tag:"Care & Makeup", footAbout:"Naqa — your Omani destination for authentic care and curated makeup. VAT-inclusive prices and delivery across Oman.", shipBar:"Naqa · Oman delivery · under 30: +2 · 30+: free · COD +1.5 · prices include 5% VAT", shipFree:"Under 30: delivery 2 · 30+: free · COD +1.5", sortNew:"Newest", sortLow:"Lowest price", sortHigh:"Highest price", sortOff:"Biggest discount", banHotSub:"Customer favorites · in-demand brands", banYearSub:"30% off selected items for a limited time",
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
function productTaxRate(p){
  var m=(p&&p.taxMode)||"vat5";
  if(m==="exempt") return 0;
  if(m==="custom"){
    var r=Number(p.taxCustom);
    return (isFinite(r)&&r>=0)?(r/100):vatRate();
  }
  return vatRate();
}
const vatOf=(amount, rate)=>{
  const r=(rate==null?vatRate():Number(rate));
  const n=Number(amount)||0;
  return r<=0?0:n*r/(1+r);
};
const exVat=(amount, rate)=>(Number(amount)||0)-vatOf(amount, rate);
function productTaxLabel(p){
  var m=(p&&p.taxMode)||"vat5";
  if(m==="exempt") return (lang==="en"?"VAT exempt":"معفى من الضريبة");
  if(m==="custom"){
    var r=Number(p.taxCustom); if(!isFinite(r)||r<0) r=0;
    return (lang==="en"?("Tax "+r+"% incl."):("ضريبة "+r+"٪ شاملة"));
  }
  return T("vatInc")||"شامل الضريبة ٥٪";
}
function cartVatFromLines(lines){
  return (lines||[]).reduce(function(s,x){
    var rate=productTaxRate(x);
    return s+vatOf(Number(x.price)||0, rate)*(Number(x.qty)||0);
  },0);
}
function vatNoteHTML(p){return '<span class="vat-note">'+productTaxLabel(p)+'</span>';}

const pname=p=>lang==="en"?(p.nameEn||p.nameAr):(p.nameAr||p.nameEn);
const pdesc=p=>cleanProductCopy(lang==="en"?(p.descEn||p.descAr||""):(p.descAr||p.descEn||""));
const puse=p=>cleanProductCopy(lang==="en"?(p.useEn||p.useAr||""):(p.useAr||p.useEn||""));
const pskin=p=>lang==="en"?(p.skinEn||p.skinAr||""):(p.skinAr||p.skinEn||"");
const pimgs=p=>(Array.isArray(p.imgs)?p.imgs:[]).filter(Boolean).slice(0,6);
function saveCart(){try{localStorage.setItem("naqa_cart",JSON.stringify(cart))}catch(e){}}
function nl2br(t){return esc(t).split("\n").join("<br>");}
