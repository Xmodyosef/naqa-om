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
      subAr:"مختارات عليها طلب", subEn:"Customer favourites",
      sort:"new", match:function(p){ return !!p.hot; } },
    { id:"eoy", cover:"media/catalogs/eoy.webp", ar:"عروض وتخفيضات", en:"Deals & offers", em:"٪", tone:"deal", home:true, group:"deal",
      subAr:"أسعار مشطوبة الآن", subEn:"Marked-down prices",
      sort:"off", match:function(p){ return p.was > p.price; } },
    { id:"u10", cover:"media/catalogs/u10.webp", ar:"تحت ١٠ ر.ع", en:"Under 10 OMR", em:"١٠", tone:"price", home:true, group:"deal",
      subAr:"أسعار يومية لطيفة", subEn:"Everyday prices",
      sort:"price-asc", match:function(p){ return Number(p.price) < 10; } },
    { id:"korean", cover:"media/catalogs/korean.webp", ar:"عناية كورية", en:"K-beauty", em:"🌸", tone:"care", home:true, group:"deal",
      subAr:"سيروم وماسكات كورية", subEn:"Korean skincare picks",
      sort:"new", match:function(p){ return !!NAQA_K_BEAUTY[p.brand]; } },
    { id:"care", cover:"media/catalogs/care.webp", ar:"عناية بالبشرة", en:"Skincare", em:"✨", tone:"care", home:true, group:"shop",
      subAr:"غسول · سيروم · مرطب", subEn:"Cleanse · treat · moisturise",
      sort:"new", match:function(p){ return p.cat === "عناية"; } },
    { id:"face", cover:"media/catalogs/face.webp", ar:"مكياج الوجه", en:"Face makeup", em:"💄", tone:"makeup", home:true, group:"shop",
      subAr:"فاونديشن · كونسيلر", subEn:"Foundation · concealer",
      sort:"new", match:function(p){ return p.cat === "وجه"; } },
    { id:"lips", cover:"media/catalogs/lips.webp", ar:"الشفاه", en:"Lips", em:"💋", tone:"makeup", home:true, group:"shop",
      subAr:"أحمر · ملمع · ليب كير", subEn:"Lipstick · gloss · care",
      sort:"new", match:function(p){ return p.cat === "شفاه"; } },
    { id:"eyes", cover:"media/catalogs/eyes.webp", ar:"العيون والحواجب", en:"Eyes & brows", em:"👁", tone:"makeup", home:true, group:"shop",
      subAr:"مسكرة · آيلاينر · ظلال", subEn:"Mascara · liner · shadow",
      sort:"new", match:function(p){ return p.cat === "عيون" || p.cat === "حواجب"; } },
    { id:"hair", cover:"media/catalogs/hair.webp", ar:"العناية بالشعر", en:"Hair care", em:"🧴", tone:"hair", home:true, group:"shop",
      subAr:"Olaplex · Cantu · L'Oréal", subEn:"Olaplex · Cantu · L'Oréal",
      sort:"new", match:function(p){ return p.cat === "شعر"; } },
    { id:"straight", cover:"media/catalogs/straight.webp", ar:"استشوارات وفرد", en:"Straighteners", em:"💇", tone:"tools", home:true, group:"shop",
      subAr:"GHD · BaByliss · أدوات", subEn:"GHD · BaByliss tools",
      sort:"price-desc", match:function(p){ return naqaIsStraightener(p); } },

    /* Extra catalogs (openable, not on the 10-banner home strip) */
    /* +5 extra home banners */
    { id:"serum", cover:"media/catalogs/serum.webp", ar:"سيرومات", en:"Serums", em:"💧", tone:"care", home:true, group:"shop",
      subAr:"نضارة · تصبغ · ترطيب", subEn:"Glow · spots · hydration",
      sort:"new", match:function(p){ return naqaIsSerum(p); } },
    { id:"new", cover:"media/catalogs/new.webp", ar:"وصل حديثاً", en:"New arrivals", em:"✦", tone:"new", home:true, group:"shop",
      subAr:"آخر الإضافات", subEn:"Latest drops",
      sort:"new", match:function(p){ return Number(p.id) >= 250; } },
    { id:"tools", cover:"media/catalogs/tools.webp", ar:"أدوات التجميل", en:"Beauty tools", em:"🔧", tone:"tools", home:true, group:"shop",
      subAr:"أدوات · أجهزة", subEn:"Tools & devices",
      sort:"new", match:function(p){ return p.cat === "أدوات"; } },
    { id:"sheglam", cover:"media/catalogs/sheglam.webp", ar:"ماركة SHEGLAM", en:"SHEGLAM", em:"💎", tone:"makeup", home:true, group:"shop",
      subAr:"مكياج ترندي بأسعار حلوة", subEn:"Trendy makeup picks",
      sort:"new", match:function(p){ return /sheglam/i.test(String(p.brand||"")); } },
    { id:"olaplex", cover:"media/catalogs/olaplex.webp", ar:"Olaplex للشعر", en:"Olaplex hair", em:"🧪", tone:"hair", home:true, group:"shop",
      subAr:"إصلاح وحماية الشعر", subEn:"Repair & protect",
      sort:"new", match:function(p){ return /olaplex/i.test(String(p.brand||"")); } },

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
  getNaqaCatalogs().forEach(function(c){
    if(!c.home) return;
    var list = [];
    try{ list = catalogList(c.id, 12) || []; }catch(e){ list = []; }
    if(!list.length) return;
    var art = c.cover || "";
    try{
      var g0 = (typeof pimgs === "function") ? pimgs(list[0]) : (list[0].imgs||[]);
      if(g0 && g0[0]) art = g0[0];
    }catch(e){}
    out.push({
      id: c.id,
      tone: c.tone || "all",
      ar: c.ar, en: c.en,
      subAr: c.subAr || "", subEn: c.subEn || "",
      eyeAr: c.em || "✦", eyeEn: c.em || "✦",
      ctaAr: "عرض الكل ←", ctaEn: "View all →",
      art: art,
      cover: c.cover || "",
      list: list
    });
  });
  return out;
}

function naqaStartCampRails(root){
  if(!root || root.__naqaRails) return;
  root.__naqaRails = true;
  var rails = root.querySelectorAll(".campaign-rail");
  rails.forEach(function(rail){
    if(rail.__naqaSpin) return;
    rail.__naqaSpin = true;
    var track = rail.querySelector(".campaign-products");
    if(!track) return;
    /* duplicate children for seamless loop when few items */
    var kids = Array.prototype.slice.call(track.children);
    if(kids.length && kids.length < 16){
      kids.forEach(function(node){
        var clone = node.cloneNode(true);
        clone.setAttribute("aria-hidden","true");
        clone.querySelectorAll("button").forEach(function(b){ b.tabIndex = -1; });
        track.appendChild(clone);
      });
    }
    var paused = false;
    var dir = (document.documentElement.getAttribute("dir") === "rtl") ? -1 : 1;
    /* RTL scrollLeft quirks: use scrollBy positive toward "start" content flow */
    var timer = setInterval(function(){
      if(paused || document.hidden) return;
      if(!document.body.contains(track)){ clearInterval(timer); return; }
      var max = track.scrollWidth - track.clientWidth;
      if(max <= 8) return;
      track.scrollLeft += 1.2 * dir;
      /* loop */
      if(dir < 0){
        /* rtl: when near end, wrap */
        if(Math.abs(track.scrollLeft) >= max - 2 || track.scrollLeft <= 2 - max){
          /* keep moving; reset mid */
        }
        if(track.scrollLeft <= 1){
          track.scrollLeft = max / 2;
        } else if(track.scrollLeft >= max - 1){
          track.scrollLeft = max / 2;
        }
      } else {
        if(track.scrollLeft >= max - 1) track.scrollLeft = 0;
      }
    }, 30);
    track.addEventListener("pointerenter", function(){ paused = true; });
    track.addEventListener("pointerleave", function(){ paused = false; });
    track.addEventListener("touchstart", function(){ paused = true; }, {passive:true});
    track.addEventListener("touchend", function(){ setTimeout(function(){ paused = false; }, 1800); }, {passive:true});
  });
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
  var en = (typeof lang !== "undefined" && lang === "en");
  var html = '<div class="home-campaigns home-rails" id="homeCatalog">';

  getHomeCampaigns().forEach(function(c){
    var list = c.list || [];
    if(!list.length) return;
    var title = en ? c.en : c.ar;
    var sub = en ? c.subEn : c.subAr;
    var eye = en ? c.eyeEn : c.eyeAr;
    var cta = en ? c.ctaEn : c.ctaAr;
    var art = c.art || c.cover || "";
    var openAttr = ' data-open-catalog="'+esc(c.id)+'"';

    var styleBg = "";
    if(c.cover){
      styleBg = " style=\"background-image:linear-gradient(100deg,rgba(32,12,20,.78) 0%,rgba(32,12,20,.4) 55%,rgba(32,12,20,.18) 100%),url('" + esc(c.cover) + "');background-size:cover;background-position:center;\"";
    }

    html += '<section class="campaign" id="camp-'+esc(c.id)+'">'
      + '<div class="campaign-head">'
      + '<div><h2>'+esc(title)+'</h2>'
      + (sub ? '<p>'+esc(sub)+'</p>' : '')
      + '</div>'
      + '<button type="button" class="campaign-all"'+openAttr+'>'+esc(cta)+'</button>'
      + '</div>'
      + '<button type="button" class="campaign-banner tone-'+esc(c.tone)+'"'+openAttr+styleBg+'>'
      + '<div class="campaign-copy">'
      + '<small>'+esc(eye)+'</small>'
      + '<h3>'+esc(title)+'</h3>'
      + (sub ? '<p>'+esc(sub)+'</p>' : '')
      + '<span class="chip chip-cta">'+esc(cta)+'</span>'
      + '</div>'
      + (art ? '<img class="campaign-art" src="'+esc(art)+'" alt="" loading="lazy" decoding="async" width="240" height="240">' : '')
      + '</button>'
      + '<div class="campaign-rail" data-camp="'+esc(c.id)+'">'
      + '<div class="campaign-products" role="list">'
      + list.slice(0, 10).map(campaignProductHTML).join("")
      + '</div></div>'
      + '</section>';
  });

  html += '</div>';
  box.innerHTML = html;
  try{ naqaStartCampRails(box); }catch(e){}
}

function renderShelves(){
  if(typeof renderHomeCatalogs === "function") renderHomeCatalogs();
  else {
    var box = document.getElementById("shelves");
    if(box){ box.innerHTML = ""; box.hidden = true; }
  }
}
