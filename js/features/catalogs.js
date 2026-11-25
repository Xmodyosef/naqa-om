/* Curated home catalogs — inspired by Noon / Nice One / Nazih deal rails */
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

/** Catalog definitions — each opens a filtered product view */
function getNaqaCatalogs(){
  return [
    { id:"hot", ar:"الأكثر طلباً", en:"Bestsellers", em:"★", tone:"hot",
      subAr:"مختارات عليها طلب", subEn:"Customer favourites",
      sort:"new", match:function(p){ return !!p.hot; } },
    { id:"eoy", ar:"عروض آخر السنة", en:"Year-end offers", em:"🎁", tone:"deal",
      subAr:"أسعار مشطوبة · وفّري الآن", subEn:"Marked-down prices now",
      sort:"off", match:function(p){ return p.was > p.price; } },
    { id:"off30", ar:"خصم ٣٠٪ فأكثر", en:"30% off & more", em:"٪", tone:"deal",
      subAr:"أقوى التخفيضات", subEn:"Biggest discounts",
      sort:"off", match:function(p){ return naqaOffPct(p) >= 0.3; } },
    { id:"u5", ar:"تحت ٥ ر.ع", en:"Under 5 OMR", em:"٥", tone:"price",
      subAr:"تجربة بأسعار لطيفة", subEn:"Great starters",
      sort:"price-asc", match:function(p){ return Number(p.price) < 5; } },
    { id:"u10", ar:"تحت ١٠ ر.ع", en:"Under 10 OMR", em:"١٠", tone:"price",
      subAr:"مثل نون — أسعار يومية", subEn:"Everyday beauty prices",
      sort:"price-asc", match:function(p){ return Number(p.price) < 10; } },
    { id:"straight", ar:"استشوارات وفرد", en:"Straighteners", em:"💇", tone:"tools",
      subAr:"GHD · BaByliss · من النزيه", subEn:"GHD · BaByliss style tools",
      sort:"price-desc", match:function(p){ return naqaIsStraightener(p); } },
    { id:"korean", ar:"عناية كورية", en:"K-beauty", em:"🌸", tone:"care",
      subAr:"سيروم وماسكات كورية", subEn:"Korean serums & masks",
      sort:"new", match:function(p){ return !!NAQA_K_BEAUTY[p.brand]; } },
    { id:"serum", ar:"سيرومات", en:"Serums", em:"💧", tone:"care",
      subAr:"نضارة · تصبغ · ترطيب", subEn:"Glow · spots · hydration",
      sort:"new", match:function(p){ return naqaIsSerum(p); } },
    { id:"care", ar:"عناية بالبشرة", en:"Skincare", em:"✨", tone:"care",
      subAr:"غسول · سيروم · مرطب", subEn:"Cleanse · treat · moisturise",
      sort:"new", match:function(p){ return p.cat === "عناية"; } },
    { id:"face", ar:"مكياج الوجه", en:"Face makeup", em:"💄", tone:"makeup",
      subAr:"فاونديشن · كونسيلر", subEn:"Foundation · concealer",
      sort:"new", match:function(p){ return p.cat === "وجه"; } },
    { id:"lips", ar:"الشفاه", en:"Lips", em:"💋", tone:"makeup",
      subAr:"أحمر · ملمع · ليب كير", subEn:"Lipstick · gloss · care",
      sort:"new", match:function(p){ return p.cat === "شفاه"; } },
    { id:"eyes", ar:"العيون", en:"Eyes", em:"👁", tone:"makeup",
      subAr:"مسكرة · آيلاينر · ظلال", subEn:"Mascara · liner · shadow",
      sort:"new", match:function(p){ return p.cat === "عيون" || p.cat === "حواجب"; } },
    { id:"hair", ar:"العناية بالشعر", en:"Hair care", em:"🧴", tone:"hair",
      subAr:"Olaplex · Cantu · L'Oréal", subEn:"Olaplex · Cantu · L'Oréal",
      sort:"new", match:function(p){ return p.cat === "شعر"; } },
    { id:"tools", ar:"أدوات التجميل", en:"Beauty tools", em:"🔧", tone:"tools",
      subAr:"أدوات · أجهزة", subEn:"Tools & devices",
      sort:"new", match:function(p){ return p.cat === "أدوات"; } },
    { id:"new", ar:"وصل حديثاً", en:"New arrivals", em:"✦", tone:"new",
      subAr:"آخر الإضافات للكتالوج", subEn:"Latest catalog drops",
      sort:"new", match:function(p){ return Number(p.id) >= 250; } },
    { id:"all", ar:"كل المنتجات", en:"All products", em:"▣", tone:"all",
      subAr:"الكتالوج الكامل", subEn:"Full store catalog",
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

function catalogThumbHTML(list){
  var imgs = [];
  (list || []).forEach(function(p){
    if(imgs.length >= 4) return;
    var g = typeof pimgs === "function" ? pimgs(p) : (p.imgs || []);
    if(g && g[0]) imgs.push(g[0]);
  });
  if(!imgs.length) return '<div class="cat-cover cat-cover-empty">✨</div>';
  var n = Math.min(imgs.length, 4);
  return '<div class="cat-cover cat-cover-'+n+'">'
    + imgs.map(function(src){
        return '<img src="'+esc(src)+'" alt="" loading="lazy" decoding="async" width="200" height="200">';
      }).join("")
    + '</div>';
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
  var total = products.filter(function(p){ return !p.hidden; }).length;
  var brandN = (function(){ var s={}; products.forEach(function(p){ if(!p.hidden) s[p.brand]=1; }); return Object.keys(s).length; })();
  var offN = products.filter(function(p){ return !p.hidden && p.was > p.price; }).length;

  var html = '';
  html += '<div class="home-catalog" id="homeCatalog">';
  html += '<header class="home-cat-hero">'
    + '<div class="home-cat-hero-copy">'
    + '<p class="home-cat-kicker">'+(lang==="en"?"Shop like the big beauty apps":"تسوقي بأسلوب نون ونايس ون")+'</p>'
    + '<h2>'+(lang==="en"?"Naqa catalogs":"كتالوجات نقاء")+'</h2>'
    + '<p>'+(lang==="en"
      ?"Deals, price drops, brands & tools — open a catalog to see its products"
      :"عروض · أسعار · ماركات · أدوات — افتحي كتالوجاً لعرض منتجاته")+'</p>'
    + '</div>'
    + '<div class="home-cat-stats" aria-hidden="true">'
    + '<span><b>'+total+'</b><i>'+(lang==="en"?"products":"منتج")+'</i></span>'
    + '<span><b>'+brandN+'</b><i>'+(lang==="en"?"brands":"ماركة")+'</i></span>'
    + '<span><b>'+offN+'</b><i>'+(lang==="en"?"on sale":"عرض")+'</i></span>'
    + '</div></header>';

  /* Mega deal strip */
  var mega = catalogList("eoy", 8);
  if(mega.length){
    html += '<section class="catalog-mega">'
      + '<div class="catalog-mega-head">'
      + '<b>'+(lang==="en"?"🔥 Mega deals":"🔥 عروض قوية")+'</b>'
      + '<button type="button" data-open-catalog="eoy">'+(lang==="en"?"See all offers":"كل العروض")+'</button>'
      + '</div>'
      + '<div class="shelf-row catalog-mega-row">'+mega.map(cardHTML).join("")+'</div>'
      + '</section>';
  }

  html += '<div class="home-cat-grid-head">'
    + '<h3>'+(lang==="en"?"Browse catalogs":"تصفّحي الكتالوجات")+'</h3>'
    + '<span>'+(lang==="en"?"Tap a tile":"اضغطي بطاقة")+'</span></div>';
  html += '<div class="home-cat-grid">';

  cats.forEach(function(c){
    var list = catalogList(c.id, 12);
    if(!list.length && c.id !== "all") return;
    var name = lang==="en" ? c.en : c.ar;
    var sub = lang==="en" ? c.subEn : c.subAr;
    var n = catalogList(c.id).length;
    html += '<button type="button" class="home-cat-card tone-'+esc(c.tone||"care")+'" data-open-catalog="'+esc(c.id)+'">'
      + catalogThumbHTML(list)
      + '<div class="home-cat-body">'
      + '<span class="home-cat-em" aria-hidden="true">'+c.em+'</span>'
      + '<b>'+esc(name)+'</b>'
      + '<span class="home-cat-sub">'+esc(sub)+'</span>'
      + '<i class="home-cat-n">'+n+(lang==="en"?" items":" منتج")+'</i>'
      + '</div></button>';
  });
  html += '</div>';

  /* Mini rails: under 10 + straighteners if any */
  var u10 = catalogList("u10", 10);
  if(u10.length){
    html += '<section class="shelf shelf-featured">'
      + '<div class="shelf-head"><h2>'+(lang==="en"?"Under 10 OMR":"تحت ١٠ ر.ع")+'</h2>'
      + '<button type="button" data-open-catalog="u10">'+(lang==="en"?"Open catalog":"فتح الكتالوج")+'</button></div>'
      + '<div class="shelf-row">'+u10.map(cardHTML).join("")+'</div></section>';
  }
  var st = catalogList("straight", 10);
  if(st.length){
    html += '<section class="shelf shelf-featured">'
      + '<div class="shelf-head"><h2>'+(lang==="en"?"Straighteners":"استشوارات")+'</h2>'
      + '<button type="button" data-open-catalog="straight">'+(lang==="en"?"Open catalog":"فتح الكتالوج")+'</button></div>'
      + '<div class="shelf-row">'+st.map(cardHTML).join("")+'</div></section>';
  }
  var kr = catalogList("korean", 10);
  if(kr.length){
    html += '<section class="shelf shelf-featured">'
      + '<div class="shelf-head"><h2>'+(lang==="en"?"K-beauty":"عناية كورية")+'</h2>'
      + '<button type="button" data-open-catalog="korean">'+(lang==="en"?"Open catalog":"فتح الكتالوج")+'</button></div>'
      + '<div class="shelf-row">'+kr.map(cardHTML).join("")+'</div></section>';
  }

  html += '</div>'; /* home-catalog */
  box.innerHTML = html;
}

/* shelves entry — home catalogs only */
function renderShelves(){
  if(typeof renderHomeCatalogs === "function") renderHomeCatalogs();
  else {
    var box = document.getElementById("shelves");
    if(box){ box.innerHTML = ""; box.hidden = true; }
  }
}
