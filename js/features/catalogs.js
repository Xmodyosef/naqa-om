var NAQA_BANNER_HEROES = {"straight": [329, 310, 332], "tools": [193, 328, 333], "olaplex": [171, 172, 299], "sheglam": [84, 154, 158, 88, 122], "eyes": [116, 111, 93], "lips": [157, 204, 133], "eoy": [1, 3, 4, 2, 70], "face": [72, 197, 80], "hot": [293, 166, 264, 1, 3], "serum": [105, 185, 103], "hair": [189, 188, 176], "new": [255, 275, 291], "korean": [3, 24, 17, 8, 34], "care": [76, 67, 27], "u10": [113, 88, 34, 100, 111], "all": [82, 47, 32]};
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
    /* Homepage banners only — full width; products open after click */
    { id:"hot", cover:"media/catalogs/hot.webp", ar:"الأكثر طلباً", en:"Bestsellers", em:"★", tone:"hot", home:true, group:"deal",
      subAr:"الأكثر طلباً هذا الأسبوع — جاهزة للشحن", subEn:"This week's most wanted — ready to ship",
      sort:"new", match:function(p){ return !!p.hot; } },
    { id:"eoy", cover:"media/catalogs/eoy.webp", ar:"عروض وتخفيضات", en:"Deals & offers", em:"٪", tone:"deal", home:true, group:"deal",
      subAr:"أسعار مشطوبة لفترة محدودة", subEn:"Marked-down prices for a limited time",
      sort:"off", match:function(p){ return p.was > p.price; } },
    { id:"u10", cover:"media/catalogs/u10.webp", ar:"تحت ١٠ ر.ع", en:"Under 10 OMR", em:"١٠", tone:"price", home:true, group:"deal",
      subAr:"قطع مختارة بأقل من ١٠ ر.ع", subEn:"Curated picks under 10 OMR",
      sort:"price-asc", match:function(p){ return Number(p.price) < 10; } },
    { id:"korean", cover:"media/catalogs/korean.webp", ar:"عناية كورية", en:"K-beauty", em:"🌸", tone:"care", home:true, group:"deal",
      subAr:"سيروم وماسكات كورية بنتائج واضحة", subEn:"Korean serums & masks with clear results",
      sort:"new", match:function(p){ return !!NAQA_K_BEAUTY[p.brand]; } },
    { id:"care", cover:"media/catalogs/care.webp", ar:"عناية بالبشرة", en:"Skincare", em:"✨", tone:"care", home:true, group:"shop",
      subAr:"غسول · سيروم · مرطب — روتين كامل", subEn:"Cleanse · treat · moisturise — full routine",
      sort:"new", match:function(p){ return p.cat === "عناية"; } },
    { id:"face", cover:"media/catalogs/face.webp", ar:"مكياج الوجه", en:"Face makeup", em:"💄", tone:"makeup", home:true, group:"shop",
      subAr:"فاونديشن وكونسيلر لمظهر طبيعي", subEn:"Foundation & concealer for a natural finish",
      sort:"new", match:function(p){ return p.cat === "وجه"; } },
    { id:"lips", cover:"media/catalogs/lips.webp", ar:"الشفاه", en:"Lips", em:"💋", tone:"makeup", home:true, group:"shop",
      subAr:"أحمر وملمع وليب كير بدرجات متنوعة", subEn:"Colour, gloss & care in everyday shades",
      sort:"new", match:function(p){ return p.cat === "شفاه"; } },
    { id:"eyes", cover:"media/catalogs/eyes.webp", ar:"العيون والحواجب", en:"Eyes & brows", em:"👁", tone:"makeup", home:true, group:"shop",
      subAr:"مسكرة وآيلاينر وظلال بتثبيت يومي", subEn:"Mascara, liner & shadow that holds",
      sort:"new", match:function(p){ return p.cat === "عيون" || p.cat === "حواجب"; } },
    { id:"hair", cover:"media/catalogs/hair.webp", ar:"العناية بالشعر", en:"Hair care", em:"🧴", tone:"hair", home:true, group:"shop",
      subAr:"Olaplex وCantu وL'Oréal لإصلاح وترطيب", subEn:"Olaplex, Cantu & L'Oréal repair & moisture",
      sort:"new", match:function(p){ return p.cat === "شعر"; } },
    { id:"straight", cover:"media/catalogs/straight.webp", ar:"استشوارات وفرد", en:"Straighteners", em:"💇", tone:"tools", home:true, group:"shop",
      subAr:"استشوارات وأدوات حرارية بجودة عالية", subEn:"Straighteners & heat tools, pro quality",
      sort:"price-desc", match:function(p){ return naqaIsStraightener(p); } },

    /* Extra catalogs (openable, not on the 10-banner home strip) */
    /* +5 extra home banners */
    { id:"serum", cover:"media/catalogs/serum.webp", ar:"سيرومات", en:"Serums", em:"💧", tone:"care", home:true, group:"shop",
      subAr:"نضارة وتصبغ وترطيب في خطوة واحدة", subEn:"Glow, spots & hydration in one step",
      sort:"new", match:function(p){ return naqaIsSerum(p); } },
    { id:"new", cover:"media/catalogs/new.webp", ar:"وصل حديثاً", en:"New arrivals", em:"✦", tone:"new", home:true, group:"shop",
      subAr:"آخر الإضافات وصلت للمتجر", subEn:"Latest drops just landed",
      sort:"new", match:function(p){ return Number(p.id) >= 250; } },
    { id:"tools", cover:"media/catalogs/tools.webp", ar:"أدوات التجميل", en:"Beauty tools", em:"🔧", tone:"tools", home:true, group:"shop",
      subAr:"فرش وأجهزة تكمّل روتينك", subEn:"Brushes & devices for your routine",
      sort:"new", match:function(p){ return p.cat === "أدوات"; } },
    { id:"sheglam", cover:"media/catalogs/sheglam.webp", ar:"ماركة SHEGLAM", en:"SHEGLAM", em:"💎", tone:"makeup", home:true, group:"shop",
      subAr:"مكياج ترندي بأسعار مناسبة يومياً", subEn:"Trendy makeup at everyday prices",
      sort:"new", match:function(p){ return /sheglam/i.test(String(p.brand||"")); } },
    { id:"olaplex", cover:"media/catalogs/olaplex.webp", ar:"Olaplex للشعر", en:"Olaplex hair", em:"🧪", tone:"hair", home:true, group:"shop",
      subAr:"إصلاح الروابط وحماية من الحرارة", subEn:"Bond repair & heat protection",
      sort:"new", match:function(p){ return /olaplex/i.test(String(p.brand||"")); } },

    { id:"all", cover:"media/catalogs/all.webp", ar:"كل المنتجات", en:"All products", em:"▣", tone:"all", group:"shop",
      subAr:"تصفّحي الكتالوج الكامل", subEn:"Browse the full catalog",
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
  try {
    var hero = document.getElementById("heroSwipe");
    if (hero) { hero.hidden = false; hero.removeAttribute("aria-hidden"); }
    var shelves = document.getElementById("shelves");
    if (shelves) shelves.hidden = false;
    if (typeof bindHeroSwipe === "function") bindHeroSwipe(true);
  } catch (e) {}
  var box = document.getElementById("shelves") || document.getElementById("homeCatalog") || document.getElementById("heroSlot");
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

function campaignProductHTML(p){
  if(!p) return "";
  var imgs = (typeof pimgs === "function") ? pimgs(p) : (p.imgs || []);
  var src = imgs[0] || "";
  var name = (typeof pname === "function") ? pname(p) : (p.nameAr || p.nameEn || "");
  var brand = p.brand || "";
  var price = (typeof money === "function") ? money(p.price) : (p.price + "");
  var old = "";
  if(p.was > p.price){
    old = (typeof money === "function") ? money(p.was) : (p.was + "");
  }
  return '<article class="camp-product" data-id="'+p.id+'">'
    + '<button type="button" class="camp-product-media" data-open="'+p.id+'" aria-label="'+esc(name)+'">'
    + (src
        ? '<img src="'+esc(src)+'" alt="" loading="lazy" decoding="async" width="180" height="180">'
        : '<span class="camp-product-em">'+(p.em||"✨")+'</span>')
    + '</button>'
    + '<div class="camp-product-body">'
    + (brand ? '<small>'+esc(brand)+'</small>' : '')
    + '<button type="button" class="camp-product-name" data-open="'+p.id+'">'+esc(name)+'</button>'
    + '<span class="camp-product-price">'+price
    + (old ? ' <i class="camp-old">'+old+'</i>' : '')
    + '</span></div></article>';
}

/** 15 campaigns: banner then product rail (Nice One style) */
function getHomeCampaigns(){
  var out = [];
  /* a product appears once on the whole homepage — never in a banner and a rail, never in two rails */
  var used = {};
  if(typeof NAQA_BANNER_HEROES !== "undefined" && NAQA_BANNER_HEROES){
    Object.keys(NAQA_BANNER_HEROES).forEach(function(k){
      (NAQA_BANNER_HEROES[k] || []).forEach(function(id){ used[id] = 1; });
    });
  }
  getNaqaCatalogs().forEach(function(c){
    if(!c.home) return;
    var pool = [];
    try{ pool = catalogList(c.id, 80) || []; }catch(e){ pool = []; }
    var heroes = (typeof NAQA_BANNER_HEROES !== "undefined" && NAQA_BANNER_HEROES[c.id]) || [];
    var onBanner = {};
    heroes.forEach(function(id){ onBanner[id] = 1; });
    var fresh = [];
    var again = [];
    pool.forEach(function(p){
      if(!p || onBanner[p.id]) return;
      if(used[p.id]) again.push(p);
      else fresh.push(p);
    });
    var list = fresh.slice(0, 8);
    list.forEach(function(p){ used[p.id] = 1; });
    /* tiny brands (Olaplex) may have nothing left — fill without repeating this banner */
    if(list.length < 6){
      again.forEach(function(p){
        if(list.length >= 8) return;
        if(list.some(function(x){ return x.id === p.id; })) return;
        list.push(p);
      });
    }
    if(!list.length) return;
    /* banner art = designed cover (product shelf). Fallback to first product. */
    var art = c.cover || "";
    if(!art){
      try{
        var g0 = (typeof pimgs === "function") ? pimgs(list[0]) : (list[0].imgs||[]);
        if(g0 && g0[0]) art = g0[0];
      }catch(e){}
    }
    out.push({
      id: c.id,
      tone: c.tone || "all",
      ar: c.ar, en: c.en,
      subAr: c.subAr || "", subEn: c.subEn || "",
      eyeAr: c.em || "✦", eyeEn: c.em || "✦",
      ctaAr: "شاهدي الكل", ctaEn: "View all",
      art: art,
      cover: c.cover || "",
      list: list
    });
  });
  return out;
}

function naqaStartCampRails(){
  /* Product rows stay still. The shopper swipes them. No auto-crawl. */
}


/* Never strip product photos — cutouts ruined packaging. Always use originals. */
var NAQA_HERO_CUTS = {};
function naqaHeroImage(id, fallback) {
  return { image: fallback || "", fallback: "" };
}

function heroSwipeHTML() {
  var en = typeof lang !== "undefined" && lang === "en";
  var catalogs = ["hot", "eoy", "korean", "u10", "sheglam"];
  var allProducts = typeof products !== "undefined" && Array.isArray(products) ? products : [];
  var byId = {};
  allProducts.forEach(function (p) { if (p && p.id != null) byId[String(p.id)] = p; });
  var slides = [];

  catalogs.forEach(function (id) {
    var c = typeof catalogById === "function" ? catalogById(id) : null;
    if (!c || !c.cover || typeof catalogList !== "function") return;

    /* Never advertise an empty or fully hidden campaign. */
    var available = [];
    try { available = catalogList(id, 1) || []; } catch (e) { available = []; }
    if (!available.length) return;

    var candidates = [];
    var curated = typeof NAQA_BANNER_HEROES !== "undefined" && NAQA_BANNER_HEROES
      ? NAQA_BANNER_HEROES[id] || [] : [];
    curated.forEach(function (productId) {
      var p = byId[String(productId)];
      if (p && !p.hidden && typeof pimgs === "function") {
        var images = pimgs(p) || [];
        if (images[0] && candidates.length < 5) {
          var pic = naqaHeroImage(productId, images[0]);
          candidates.push({ product: p, image: pic.image, fallback: pic.fallback });
        }
      }
    });

    if (candidates.length < 5) {
      var fallback = [];
      try { fallback = catalogList(id, 12) || []; } catch (e) { fallback = []; }
      fallback.forEach(function (p) {
        if (candidates.length >= 5 || !p || p.hidden || candidates.some(function (x) { return x.product.id === p.id; })) return;
        var images = typeof pimgs === "function" ? pimgs(p) || [] : [];
        if (images[0]) {
          var pic2 = naqaHeroImage(p.id, images[0]);
          candidates.push({ product: p, image: pic2.image, fallback: pic2.fallback });
        }
      });
    }
    if (!candidates.length) return;

    var title = en ? (c.en || c.ar || id) : (c.ar || c.en || id);
    var subtitle = en ? (c.subEn || "") : (c.subAr || "");
    var art = candidates.map(function (item, index) {
      var name = typeof pname === "function" ? pname(item.product) : (item.product.nameAr || item.product.nameEn || title);
      var loading = slides.length === 0 ? "eager" : "lazy";
      var priority = slides.length === 0 && index === 0 ? ' fetchpriority="high"' : "";
      var fb = item.fallback ? (' onerror="this.onerror=null;this.src=\'' + esc(item.fallback) + '\'"') : '';
      return '<img src="' + esc(item.image) + '" alt="' + esc(name) + '" loading="' + loading +
        '" decoding="async" width="520" height="520"' + priority + ' draggable="false"' + fb + '>';
    }).join("");

    slides.push(
      '<button type="button" class="hero-slide" data-tone="' + esc(c.tone || "all") +
        '" data-open-catalog="' + esc(c.id) + '" aria-label="' + esc(title) + '">' +
        '<span class="hero-slide-art" aria-hidden="true">' + art + '</span>' +
        '<span class="hero-slide-copy"><span class="hero-kicker">' + (en ? "Naqa" : "نقاء") + '</span><strong>' + esc(title) + '</strong>' +
        (subtitle ? '<small>' + esc(subtitle) + '</small>' : '') +
        '<em>' + (en ? "Explore collection" : "اكتشفي المجموعة") + '</em></span>' +
      '</button>'
    );
  });

  if (!slides.length) return "";
  var label = en ? "Featured collections" : "المجموعات المميزة";
  var hint = en ? "Swipe to browse. Use arrow keys to move." : "اسحب لاستعراض المجموعات، أو استخدم الأسهم للتنقل";
  return '<section class="hero-swipe" id="heroSwipe" role="region" aria-roledescription="' +
    (en ? "carousel" : "عارض") + '" aria-label="' + esc(label) + '">' +
    '<div class="hero-swipe-track" id="heroSwipeTrack" tabindex="0" role="group" aria-label="' +
    esc(hint) + '" aria-live="off">' + slides.join("") + '</div></section>';
}

function bindHeroSwipe(force) {
  /* Enhanced binder lives in hero-swipe.js (transform + autoplay). */
  var root = document.getElementById("heroSwipe");
  var track = document.getElementById("heroSwipeTrack");
  if (!root || !track) return;
  track.style.display = "flex";
  track.style.width = "100%";
  var slides = track.querySelectorAll(".hero-slide");
  Array.prototype.forEach.call(slides, function (s) {
    s.style.flex = "0 0 100%";
    s.style.minWidth = "100%";
    s.style.width = "100%";
  });
  if (typeof window.__naqaBindHeroEnhanced === "function") {
    window.__naqaBindHeroEnhanced(force);
  }
}

function naqaHomeSurfaceSig(){
  /* Stable signature for home rails + hero — skip rebuild when unchanged (kills FOUC) */
  try {
    var en = (typeof lang !== "undefined" && lang === "en") ? "1" : "0";
    var parts = [en];
    if (typeof getHomeCampaigns === "function") {
      getHomeCampaigns().forEach(function (c) {
        var ids = (c.list || []).slice(0, 8).map(function (p) {
          return p && p.id != null ? String(p.id) : "";
        }).join(",");
        parts.push(String(c.id) + ":" + ids);
      });
    }
    if (typeof NAQA_BANNER_HEROES === "object" && NAQA_BANNER_HEROES) {
      ["hot","eoy","korean","u10","sheglam"].forEach(function (k) {
        parts.push(k + ":" + ((NAQA_BANNER_HEROES[k] || []).join(",")));
      });
    }
    /* include hide flags of visible shelf products so real hide still updates */
    if (typeof products !== "undefined" && products) {
      var hid = 0;
      for (var i = 0; i < products.length; i++) if (products[i] && products[i].hidden) hid++;
      parts.push("h" + hid);
    }
    return parts.join("|");
  } catch (e) { return String(Date.now()); }
}

function renderHomeCatalogs(force){
  var box = document.getElementById("shelves");
  if(!box) return;
  var slot = document.getElementById("heroSlot");
  if(!isHomeCatalogView()){
    /* Park the home surface — never destroy the banner (return was broken). */
    var parked = document.getElementById("heroSwipe");
    if (parked) {
      parked.hidden = true;
      parked.setAttribute("aria-hidden", "true");
      if (parked.dataset) parked.dataset.naqaHoldUntil = String(Date.now() + 400);
    }
    if (slot) slot.hidden = true;
    box.hidden = true;
    return;
  }
  if (slot) slot.hidden = false;
  var sig = naqaHomeSurfaceSig();
  var hero = document.getElementById("heroSwipe");
  var home = document.getElementById("homeCatalog");
  if (!force && hero && hero.querySelector(".hero-slide-art") && box.__naqaHomeSig === sig) {
    /* Already painted — unhide banner + rails, keep the same carousel node. */
    box.hidden = false;
    hero.hidden = false;
    hero.removeAttribute("aria-hidden");
    if (hero.dataset) hero.dataset.naqaHoldUntil = String(Date.now() + 200);
    if (slot && hero.parentNode !== slot) slot.appendChild(hero);
    if (!home) {
      var enKeep = (typeof lang !== "undefined" && lang === "en");
      var rails = '<div class="home-campaigns home-rails" id="homeCatalog">';
      getHomeCampaigns().forEach(function(c){
        var list = c.list || [];
        if(!list.length) return;
        var title = enKeep ? c.en : c.ar;
        var sub = enKeep ? c.subEn : c.subAr;
        var cta = enKeep ? c.ctaEn : c.ctaAr;
        var openAttr = ' data-open-catalog="'+esc(c.id)+'"';
        rails += '<section class="campaign" id="camp-'+esc(c.id)+'">'
          + '<div class="campaign-head">'
          + '<div><h2>'+esc(title)+'</h2>'
          + (sub ? '<p>'+esc(sub)+'</p>' : '')
          + '</div>'
          + '<button type="button" class="campaign-all"'+openAttr+'>'+esc(cta)+'</button>'
          + '</div>'
          + '<div class="campaign-rail" data-camp="'+esc(c.id)+'">'
          + '<div class="campaign-products" role="list">'
          + list.slice(0, 8).map(campaignProductHTML).join("")
          + '</div></div>'
          + '</section>';
      });
      rails += '</div>';
      box.innerHTML = rails;
    }
    try { if (typeof bindHeroSwipe === "function") bindHeroSwipe(true); } catch (e) {}
    return;
  }
  /* Full rebuild — keep a healthy parked hero if present (unless force). */
  if (hero && (force || !hero.querySelector(".hero-slide-art"))) hero.remove();
  box.hidden = false;
  box.__naqaHomeSig = sig;
  var en = (typeof lang !== "undefined" && lang === "en");
  var html = '<div class="home-campaigns home-rails" id="homeCatalog">';
  var keepHero = document.getElementById("heroSwipe");
  if (!(keepHero && keepHero.querySelector(".hero-slide-art"))) {
    html += heroSwipeHTML();
  }

  getHomeCampaigns().forEach(function(c){
    var list = c.list || [];
    if(!list.length) return;
    var title = en ? c.en : c.ar;
    var sub = en ? c.subEn : c.subAr;
    var cta = en ? c.ctaEn : c.ctaAr;
    var openAttr = ' data-open-catalog="'+esc(c.id)+'"';

    html += '<section class="campaign" id="camp-'+esc(c.id)+'">'
      + '<div class="campaign-head">'
      + '<div><h2>'+esc(title)+'</h2>'
      + (sub ? '<p>'+esc(sub)+'</p>' : '')
      + '</div>'
      + '<button type="button" class="campaign-all"'+openAttr+'>'+esc(cta)+'</button>'
      + '</div>'
      + '<div class="campaign-rail" data-camp="'+esc(c.id)+'">'
      + '<div class="campaign-products" role="list">'
      + list.slice(0, 8).map(campaignProductHTML).join("")
      + '</div></div>'
      + '</section>';
  });

  html += '</div>';
  box.innerHTML = html;
  var swipe = document.getElementById("heroSwipe");
  if (swipe && slot) {
    swipe.hidden = false;
    swipe.removeAttribute("aria-hidden");
    if (swipe.dataset) swipe.dataset.naqaHoldUntil = String(Date.now() + 200);
    if (swipe.parentNode !== slot) slot.appendChild(swipe);
  } else {
    var main = document.getElementById("main");
    if (swipe && main && swipe.parentNode !== main) main.insertBefore(swipe, main.firstChild);
  }
  try{ bindHeroSwipe(true); }catch(e){}
}

function renderShelves(){
  if(typeof renderHomeCatalogs === "function") renderHomeCatalogs();
  else {
    var box = document.getElementById("shelves");
    if(box){ box.innerHTML = ""; box.hidden = true; }
  }
}
