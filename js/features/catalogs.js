var catalogBrowse = false;
/* Home catalogs — clean tile grid (Nice One / Nazih style). No product dumps on home. */
var currentCatalog = "";
var NAQA_K_BEAUTY = {
  "Anua":1,"Medicube":1,"Cosrx":1,"Celimax":1,"AXIS-Y":1,"Dr.Althea":1,"Numbuzin":1,
  "Beauty of Joseon":1,"SKIN1004":1,"Purito":1,"HaruHaru":1,"Laneige":1,"LANEIGE":1,
  "MISSHA":1,"TIRTIR":1,"TOCOBO":1,"EQQUALBERRY":1,"Abib":1,"Mary&May":1,"Biodance":1,
  "Centellian24":1,"Arencia":1,"Aromatica":1
};

function naqaOffPct(p){
  if(!(p && p.was > p.price)) return 0;
  return (1 - p.price / p.was);
}
function naqaBlob(p){
  return [p.nameAr, p.nameEn, p.descAr, p.descEn, p.brand, p.cat, p.em].join(" ");
}
function naqaIsStraightener(p){
  if(!p || p.hidden) return false;
  var b = naqaBlob(p);
  if(/straight|استشوار|مملس|مكواة فرد|flat.?iron|ghd|babyliss|donatella|hair.?tool|straightener/i.test(b)) return true;
  if(p.cat === "أدوات" && /شعر|hair|ghd|babyliss|pro/i.test(b)) return true;
  return false;
}
function naqaIsSerum(p){
  return /سيروم|serum|ampoule|أمبول/i.test(naqaBlob(p));
}

/**
 * Curated catalogs. Order = homepage order.
 * featured:true → large hero tiles row
 * group: "deal" | "shop" for section headers
 */
function getNaqaCatalogs(){
  return [
    /* —— Featured deals / discovery —— */
    { id:"hot", cover:"media/catalogs/hot.webp", ar:"الأكثر طلباً", en:"Bestsellers", em:"★", tone:"hot", featured:true, group:"deal",
      subAr:"مختارات عليها طلب", subEn:"Customer favourites",
      sort:"new", match:function(p){ return !!p.hot; } },
    { id:"eoy", cover:"media/catalogs/eoy.webp", ar:"عروض وتخفيضات", en:"Deals & offers", em:"٪", tone:"deal", featured:true, group:"deal",
      subAr:"أسعار مشطوبة الآن", subEn:"Marked-down prices",
      sort:"off", match:function(p){ return p.was > p.price; } },
    { id:"u10", cover:"media/catalogs/u10.webp", ar:"تحت ١٠ ر.ع", en:"Under 10 OMR", em:"١٠", tone:"price", featured:true, group:"deal",
      subAr:"أسعار يومية لطيفة", subEn:"Everyday prices",
      sort:"price-asc", match:function(p){ return Number(p.price) < 10; } },
    { id:"korean", cover:"media/catalogs/korean.webp", ar:"عناية كورية", en:"K-beauty", em:"🌸", tone:"care", featured:true, group:"deal",
      subAr:"سيروم وماسكات كورية", subEn:"Korean skincare picks",
      sort:"new", match:function(p){ return !!NAQA_K_BEAUTY[p.brand]; } },

    /* —— Shop by section —— */
    { id:"care", cover:"media/catalogs/care.webp", ar:"عناية بالبشرة", en:"Skincare", em:"✨", tone:"care", group:"shop",
      subAr:"غسول · سيروم · مرطب", subEn:"Cleanse · treat · moisturise",
      sort:"new", match:function(p){ return p.cat === "عناية"; } },
    { id:"face", cover:"media/catalogs/face.webp", ar:"مكياج الوجه", en:"Face makeup", em:"💄", tone:"makeup", group:"shop",
      subAr:"فاونديشن · كونسيلر", subEn:"Foundation · concealer",
      sort:"new", match:function(p){ return p.cat === "وجه"; } },
    { id:"lips", cover:"media/catalogs/lips.webp", ar:"الشفاه", en:"Lips", em:"💋", tone:"makeup", group:"shop",
      subAr:"أحمر · ملمع · ليب كير", subEn:"Lipstick · gloss · care",
      sort:"new", match:function(p){ return p.cat === "شفاه"; } },
    { id:"eyes", cover:"media/catalogs/eyes.webp", ar:"العيون والحواجب", en:"Eyes & brows", em:"👁", tone:"makeup", group:"shop",
      subAr:"مسكرة · آيلاينر · ظلال", subEn:"Mascara · liner · shadow",
      sort:"new", match:function(p){ return p.cat === "عيون" || p.cat === "حواجب"; } },
    { id:"hair", cover:"media/catalogs/hair.webp", ar:"العناية بالشعر", en:"Hair care", em:"🧴", tone:"hair", group:"shop",
      subAr:"Olaplex · Cantu · L'Oréal", subEn:"Olaplex · Cantu · L'Oréal",
      sort:"new", match:function(p){ return p.cat === "شعر"; } },
    { id:"straight", cover:"media/catalogs/straight.webp", ar:"استشوارات وفرد", en:"Straighteners", em:"💇", tone:"tools", group:"shop",
      subAr:"GHD · BaByliss · أدوات", subEn:"GHD · BaByliss tools",
      sort:"price-desc", match:function(p){ return naqaIsStraightener(p); } },
    { id:"tools", cover:"media/catalogs/tools.webp", ar:"أدوات التجميل", en:"Beauty tools", em:"🔧", tone:"tools", group:"shop",
      subAr:"أدوات · أجهزة", subEn:"Tools & devices",
      sort:"new", match:function(p){ return p.cat === "أدوات"; } },
    { id:"serum", cover:"media/catalogs/serum.webp", ar:"سيرومات", en:"Serums", em:"💧", tone:"care", group:"shop",
      subAr:"نضارة · تصبغ · ترطيب", subEn:"Glow · spots · hydration",
      sort:"new", match:function(p){ return naqaIsSerum(p); } },
    { id:"new", cover:"media/catalogs/new.webp", ar:"وصل حديثاً", en:"New arrivals", em:"✦", tone:"new", group:"shop",
      subAr:"آخر الإضافات", subEn:"Latest drops",
      sort:"new", match:function(p){ return Number(p.id) >= 250; } },
    { id:"all", cover:"media/catalogs/all.webp", ar:"كل المنتجات", en:"All products", em:"▣", tone:"all", group:"shop",
      subAr:"الكتالوج الكامل", subEn:"Full catalog",
      sort:"new", match:function(){ return true; } }
  ];
}

function catalogById(id){
  return getNaqaCatalogs().find(function(c){ return c.id === id; }) || null;
}
function catalogMatch(p, id){
  if(!id) return true;
  var c = catalogById(id);
  if(!c || !c.match) return true;
  try{ return !!c.match(p); }catch(e){ return true; }
}
function catalogLabel(id){
  var c = catalogById(id);
  if(!c) return id || "";
  return (typeof lang !== "undefined" && lang === "en") ? c.en : c.ar;
}
function catalogList(id, limit){
  var list = (typeof products !== "undefined" ? products : []).filter(function(p){
    return p && !p.hidden && catalogMatch(p, id);
  });
  var c = catalogById(id);
  var offOf = function(p){ return naqaOffPct(p); };
  if(c && c.sort === "off") list.sort(function(a,b){ return offOf(b)-offOf(a) || a.price-b.price; });
  else if(c && c.sort === "price-asc") list.sort(function(a,b){ return a.price-b.price; });
  else if(c && c.sort === "price-desc") list.sort(function(a,b){ return b.price-a.price; });
  else list.sort(function(a,b){ return b.id - a.id; });
  if(limit) list = list.slice(0, limit);
  return list;
}

function isHomeCatalogView(){
  try{
    if(typeof query !== "undefined" && query && String(query).trim()) return false;
    if(typeof currentBrand !== "undefined" && currentBrand) return false;
    if(typeof currentConcern !== "undefined" && currentConcern) return false;
    if(typeof wishView !== "undefined" && wishView) return false;
    if(typeof currentCat !== "undefined" && currentCat !== "all") return false;
    if(typeof currentCatalog !== "undefined" && currentCatalog) return false;
    return true;
  }catch(e){ return false; }
}

function openCatalog(id){
  var c = catalogById(id) || { id: id || "all", sort: "new" };
  currentCatalog = c.id === "all" ? "all" : c.id;
  currentBrand = "";
  currentConcern = "";
  if(typeof wishView !== "undefined") wishView = false;
  query = "";
  currentCat = "all";
  currentPrice = "all";
  currentSort = c.sort || "new";
  var s = document.getElementById("search"); if(s) s.value = "";
  var clr = document.getElementById("searchClear"); if(clr) clr.hidden = true;
  document.querySelectorAll("#cats [data-cat]").forEach(function(x){
    x.classList.toggle("on", x.dataset.cat === "all");
  });
  var sel = document.getElementById("sortSel"); if(sel) sel.value = currentSort;
  try{ history.pushState({ naqa: "catalog" }, "", "#cat/"+encodeURIComponent(currentCatalog)); }catch(e){}
  if(typeof closeSheet === "function") closeSheet(true);
  if(typeof render === "function") render();
  var prod = document.getElementById("products");
  if(prod) prod.scrollIntoView({ behavior: "smooth", block: "start" });
}

function backToCatalogs(){
  currentCatalog = "";
  currentBrand = "";
  currentConcern = "";
  if(typeof wishView !== "undefined") wishView = false;
  query = "";
  currentCat = "all";
  currentPrice = "all";
  currentSort = "new";
  var s = document.getElementById("search"); if(s) s.value = "";
  document.querySelectorAll("#cats [data-cat]").forEach(function(x){
    x.classList.toggle("on", x.dataset.cat === "all");
  });
  var sel = document.getElementById("sortSel"); if(sel) sel.value = "new";
  try{ history.pushState({ naqa: "shop" }, "", "#shop"); }catch(e){}
  if(typeof render === "function") render();
  var box = document.getElementById("shelves") || document.getElementById("homeCatalog");
  if(box) box.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Mosaic cover: 1 big + up to 3 small, or single if few images */
function catalogThumbHTML(list, c){
  if(c && c.cover){
    return '<div class="cat-cover cat-cover-art" aria-hidden="true">'
      + '<img src="'+esc(c.cover)+'" alt="" loading="lazy" decoding="async" width="640" height="570">'
      + '</div>';
  }
  var imgs = [];
  (list || []).forEach(function(p){
    if(imgs.length >= 4) return;
    var g = typeof pimgs === "function" ? pimgs(p) : (p.imgs || []);
    if(g && g[0] && imgs.indexOf(g[0]) < 0) imgs.push(g[0]);
  });
  if(!imgs.length) return '<div class="cat-cover cat-cover-empty"><span>✨</span></div>';
  var n = Math.min(imgs.length, 4);
  return '<div class="cat-cover cat-cover-'+n+'" aria-hidden="true">'
    + imgs.slice(0,n).map(function(src){
        return '<span class="cat-cover-cell"><img src="'+esc(src)+'" alt="" loading="lazy" decoding="async" width="240" height="240"></span>';
      }).join("")
    + '</div>';
}

function catalogTileHTML(c, size){
  var list = catalogList(c.id, 8);
  if(!list.length && c.id !== "all") return "";
  var name = lang==="en" ? c.en : c.ar;
  var sub = lang==="en" ? c.subEn : c.subAr;
  var n = catalogList(c.id).length;
  var sizeCls = size === "hero" ? " home-cat-card--hero" : "";
  return '<button type="button" class="home-cat-card tone-'+esc(c.tone||"care")+sizeCls+'" data-open-catalog="'+esc(c.id)+'">'
    + catalogThumbHTML(list, c)
    + '<div class="home-cat-body">'
    + '<div class="home-cat-topline"><span class="home-cat-em" aria-hidden="true">'+c.em+'</span>'
    + '<i class="home-cat-n">'+n+(lang==="en"?" items":" منتج")+'</i></div>'
    + '<b>'+esc(name)+'</b>'
    + '<span class="home-cat-sub">'+esc(sub)+'</span>'
    + '<span class="home-cat-cta">'+(lang==="en"?"Open →":"افتحي ←")+'</span>'
    + '</div></button>';
}

function catalogMiniHTML(c){
  var list = catalogList(c.id, 1);
  if(!list.length && c.id !== "all") return "";
  var name = lang==="en" ? c.en : c.ar;
  var photo = c.cover
    ? '<img src="'+esc(c.cover)+'" alt="" loading="lazy" decoding="async" width="76" height="76">'
    : '<span class="home-cat-mini-fallback" aria-hidden="true">'+c.em+'</span>';
  return '<button type="button" class="home-cat-mini" data-open-catalog="'+esc(c.id)+'">'
    + '<span class="home-cat-mini-photo">'+photo+'</span>'
    + '<b>'+esc(name)+'</b>'
    + '</button>';
}

function renderHomeCatalogs(){
  var box = document.getElementById("shelves");
  if(!box) return;
  if(!isHomeCatalogView()){
    box.innerHTML = "";
    box.hidden = true;
    return;
  }
  box.hidden = false;
  var cats = getNaqaCatalogs();
  var en = (typeof lang !== "undefined" && lang === "en");
  var html = '<div class="home-catalog home-catalog--mini" id="homeCatalog">'
    + '<div class="home-cat-section-head home-cat-section-head--slim">'
    + '<h3>'+(en?"Catalogs":"الكتالوجات")+'</h3>'
    + '<span>'+(en?"Swipe":"اسحبي")+'</span>'
    + '</div>'
    + '<div class="home-cat-strip">';
  cats.forEach(function(c){ html += catalogMiniHTML(c); });
  html += '</div></div>';
  box.innerHTML = html;
}

function renderShelves(){
  if(typeof renderHomeCatalogs === "function") renderHomeCatalogs();
  else {
    var box = document.getElementById("shelves");
    if(box){ box.innerHTML = ""; box.hidden = true; }
  }
}
