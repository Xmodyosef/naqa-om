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
    /* 10 homepage banners (Nice One style) — full page width, products below */
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

function campaignProductHTML(p){
  if(!p) return "";
  var imgs = (typeof pimgs === "function") ? pimgs(p) : (p.imgs || []);
  var src = imgs[0] || "";
  var name = (typeof pname === "function") ? pname(p) : (p.nameAr || p.nameEn || "");
  var catLab = "";
  try{
    if(typeof T === "function" && typeof catLabel !== "undefined")
      catLab = T(catLabel[p.cat] || "all");
    else catLab = p.cat || "";
  }catch(e){ catLab = p.cat || ""; }
  var price = (typeof money === "function") ? money(p.price) : (p.price + "");
  var old = "";
  if(p.was > p.price){
    old = (typeof money === "function") ? money(p.was) : (p.was + "");
  }
  return '<article class="camp-product" data-id="'+p.id+'">'
    + '<button type="button" class="camp-product-media" data-open="'+p.id+'" aria-label="'+esc(name)+'">'
    + (src
        ? '<img src="'+esc(src)+'" alt="" loading="lazy" decoding="async" width="200" height="200">'
        : '<span class="camp-product-em">'+(p.em||"✨")+'</span>')
    + '</button>'
    + '<div class="camp-product-body">'
    + '<small>'+esc(catLab)+'</small>'
    + '<button type="button" class="camp-product-name" data-open="'+p.id+'">'+esc(name)+'</button>'
    + '<span class="camp-product-price">'+price
    + (old ? ' <i class="camp-old">'+old+'</i>' : '')
    + '</span>'
    + '</div></article>';
}

function getHomeCampaigns(){
  var en = (typeof lang !== "undefined" && lang === "en");
  return [
    {
      id: "hot",
      tone: "best",
      ar: "الأكثر مبيعًا", en: "Bestsellers",
      subAr: "اختيارات نقاء التي تحبها العميلات", subEn: "Customer favourites this week",
      eyeAr: "اختيارات الأسبوع", eyeEn: "This week's picks",
      bodyAr: "روتينات ومنتجات عليها إقبال كبير.", bodyEn: "Routines and products customers love.",
      chipsAr: ["عناية","وجه","شفاه","شعر"], chipsEn: ["Care","Face","Lips","Hair"],
      ctaAr: "عرض الكل ←", ctaEn: "View all →",
      art: "media/products/p3_0.webp",
      list: function(){ return catalogList("hot", 8); }
    },
    {
      id: "eoy",
      tone: "year",
      ar: "عروض وتخفيضات", en: "Deals & offers",
      subAr: "أسعار مشطوبة على منتجات مختارة", subEn: "Marked-down picks for the season",
      eyeAr: "موسم العروض", eyeEn: "Offer season",
      bodyAr: "هدايا، عناية، ومكياج بأسعار أجمل.", bodyEn: "Gifts, care, and makeup for less.",
      chipsAr: ["عروض","عناية","وجه","أدوات"], chipsEn: ["Deals","Care","Face","Tools"],
      ctaAr: "استكشفي العروض ←", ctaEn: "Explore deals →",
      art: "media/products/p23_0.webp",
      list: function(){ return catalogList("eoy", 8); }
    },
    {
      id: "sale30",
      tone: "sale",
      ar: "خصم قوي", en: "Big discount",
      subAr: "تخفيضات مختارة لفترة محدودة", subEn: "Selected markdowns for a limited time",
      eyeAr: "لا تفوّتي الفرصة", eyeEn: "Don't miss it",
      bodyAr: "اختاري روتينك المفضل بخصم أوضح.", bodyEn: "Build your routine with clearer savings.",
      chipsAr: ["وجه","شفاه","عيون","شعر"], chipsEn: ["Face","Lips","Eyes","Hair"],
      ctaAr: "شاهدي المنتجات ←", ctaEn: "See products →",
      art: "media/products/p6_0.webp",
      list: function(){
        var list = (typeof products !== "undefined" ? products : []).filter(function(p){
          return p && !p.hidden && p.was > p.price && naqaOffPct(p) >= 0.2;
        });
        list.sort(function(a,b){ return naqaOffPct(b) - naqaOffPct(a); });
        return list.slice(0, 8);
      }
    },
    {
      id: "korean",
      tone: "korean",
      ar: "منتجات كورية", en: "K-beauty",
      subAr: "روتينات آسيوية لبشرة تحب العناية", subEn: "Korean skincare favourites",
      eyeAr: "K-Beauty edit", eyeEn: "K-Beauty edit",
      bodyAr: "سيرومات، أقنعة، وترطيب بلمسة كورية ناعمة.", bodyEn: "Serums, masks, and soft Korean hydration.",
      chipsAr: ["سيرومات","أقنعة","ترطيب","واقي شمس"], chipsEn: ["Serums","Masks","Hydration","SPF"],
      ctaAr: "تسوّقي الكوري ←", ctaEn: "Shop K-beauty →",
      art: "media/products/p15_0.webp",
      list: function(){ return catalogList("korean", 8); }
    },
    {
      id: "essence",
      tone: "essence",
      ar: "ماركة Essence", en: "Essence brand",
      subAr: "مكياج مرح وسهل للاستخدام اليومي", subEn: "Playful everyday makeup",
      eyeAr: "New in · Essence", eyeEn: "New in · Essence",
      bodyAr: "لمسات للعيون، الشفاه، والوجه.", bodyEn: "Looks for eyes, lips, and face.",
      chipsAr: ["عيون","شفاه","وجه","أدوات"], chipsEn: ["Eyes","Lips","Face","Tools"],
      ctaAr: "شاهدي الماركة ←", ctaEn: "View brand →",
      art: "media/products/p1_0.webp",
      list: function(){
        var list = (typeof products !== "undefined" ? products : []).filter(function(p){
          return p && !p.hidden && /essence/i.test(String(p.brand||""));
        });
        list.sort(function(a,b){ return b.id - a.id; });
        return list.slice(0, 8);
      },
      openBrand: "essence"
    }
  ];
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
  var html = '<div class="home-campaigns" id="homeCatalog">';

  /* top category chips — same idea as preview */
  var topCats = [
    { cat:"عناية", ar:"عناية", en:"Care", em:"🫧" },
    { cat:"وجه", ar:"وجه", en:"Face", em:"✨" },
    { cat:"شفاه", ar:"شفاه", en:"Lips", em:"💄" },
    { cat:"عيون", ar:"عيون", en:"Eyes", em:"👁" },
    { cat:"حواجب", ar:"حواجب", en:"Brows", em:"〰️" },
    { cat:"عطور", ar:"عطور", en:"Scents", em:"🌸" },
    { cat:"أدوات", ar:"أدوات", en:"Tools", em:"🖌" },
    { cat:"شعر", ar:"شعر", en:"Hair", em:"💇" }
  ];
  html += '<div class="top-cats" aria-label="'+(en?"Categories":"الأصناف")+'">';
  topCats.forEach(function(c){
    html += '<button type="button" class="top-cat" data-cat-jump="'+esc(c.cat)+'">'
      + '<b aria-hidden="true">'+c.em+'</b>'
      + (en ? c.en : c.ar)
      + '</button>';
  });
  html += '</div>';

  getHomeCampaigns().forEach(function(c){
    var list = [];
    try{ list = c.list() || []; }catch(e){ list = []; }
    if(!list.length) return;
    var title = en ? c.en : c.ar;
    var sub = en ? c.subEn : c.subAr;
    var eye = en ? c.eyeEn : c.eyeAr;
    var body = en ? c.bodyEn : c.bodyAr;
    var cta = en ? c.ctaEn : c.ctaAr;
    var chips = en ? c.chipsEn : c.chipsAr;
    var art = c.art;
    // prefer a real packshot from the list if art missing
    try{
      var g0 = (typeof pimgs === "function") ? pimgs(list[0]) : (list[0].imgs||[]);
      if(g0 && g0[0]) art = g0[0];
      if(list[1]){
        var g1 = (typeof pimgs === "function") ? pimgs(list[1]) : (list[1].imgs||[]);
        if(g1 && g1[0] && c.tone === "best") art = g1[0];
      }
    }catch(e){}

    var openAttr = c.openBrand
      ? ' data-brand="'+esc(c.openBrand)+'"'
      : ' data-open-catalog="'+esc(c.id === "sale30" ? "eoy" : c.id)+'"';

    html += '<section class="campaign" id="camp-'+esc(c.id)+'">'
      + '<div class="campaign-head">'
      + '<div><h2>'+esc(title)+'</h2><p>'+esc(sub)+'</p></div>'
      + '<button type="button" class="campaign-all"'+openAttr+'>'+esc(cta)+'</button>'
      + '</div>'
      + '<button type="button" class="campaign-banner tone-'+esc(c.tone)+'"'+openAttr+'>'
      + '<div class="campaign-copy">'
      + '<small>'+esc(eye)+'</small>'
      + '<h3>'+esc(title)+'</h3>'
      + '<p>'+esc(body)+'</p>'
      + '<div class="chips">'
      + chips.map(function(ch){ return '<span class="chip">'+esc(ch)+'</span>'; }).join("")
      + '</div></div>'
      + (art ? '<img class="campaign-art" src="'+esc(art)+'" alt="" loading="lazy" decoding="async" width="270" height="260">' : '')
      + '</button>'
      + '<div class="campaign-products">'
      + list.slice(0,4).map(campaignProductHTML).join("")
      + '</div></section>';
  });

  html += '</div>';
  box.innerHTML = html;

  /* bind category jump chips if app didn't already */
  try{
    box.querySelectorAll("[data-cat-jump]").forEach(function(btn){
      if(btn.__naqaJump) return;
      btn.__naqaJump = true;
      btn.addEventListener("click", function(e){
        e.preventDefault();
        var cat = btn.getAttribute("data-cat-jump");
        if(!cat) return;
        currentCatalog = "";
        currentBrand = "";
        currentConcern = "";
        if(typeof wishView !== "undefined") wishView = false;
        query = "";
        currentCat = cat;
        catalogBrowse = true;
        document.querySelectorAll("#cats [data-cat]").forEach(function(x){
          x.classList.toggle("on", x.dataset.cat === cat);
        });
        try{ history.pushState({ naqa:"cat" }, "", "#c/"+encodeURIComponent(cat)); }catch(err){}
        if(typeof render === "function") render();
        var prod = document.getElementById("products");
        if(prod) prod.scrollIntoView({ behavior:"smooth", block:"start" });
      });
    });
  }catch(e){}
}

function renderShelves(){
  if(typeof renderHomeCatalogs === "function") renderHomeCatalogs();
  else {
    var box = document.getElementById("shelves");
    if(box){ box.innerHTML = ""; box.hidden = true; }
  }
}
