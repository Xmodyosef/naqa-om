/* features: concerns, quiz, wishlist, brands, bundles, trust */
const CONCERNS = [
  /* classic skin types (dermatology) */
  {id:"oily", ar:"دهنية", en:"Oily", re:/دهن|لامع|oily|shiny|sebum|sebium|مسام واسعة|blackhead|رؤوس سوداء/i},
  {id:"dry", ar:"جافة", en:"Dry", re:/جافة|جاف\s|عطشان|مشدود|تقشر|dehydrated|\bdry\b|flaky|parched|xerosis/i},
  {id:"combo", ar:"مختلطة", en:"Combination", re:/مختلط|combination|combo|T-zone|تي زون|zone T/i},
  {id:"sens", ar:"حساسة", en:"Sensitive", re:/حساس|sensitive|تهدئ|sooth|centella|سنتيلا|calm|reactive|احمرار|redness/i},
  {id:"normal", ar:"عادية / متوازنة", en:"Normal / Balanced", re:/عادي|متوازن|normal|balanced|all skin|كل أنواع/i},
  /* goals / concerns */
  {id:"pore", ar:"مسام / نضارة", en:"Pores / Glow", re:/مسام|pore|نضار|glow|vitamin c|فيتامين|bright|تفت|إشراق/i},
  {id:"spot", ar:"تصبغ / توحيد", en:"Spots / Tone", re:/تصبغ|بقع|dark spot|niacinamide|نياسين|توحيد|whit|tone|txa|tranex|melasma/i},
  {id:"acne", ar:"حبوب / شوائب", en:"Acne / Blemish", re:/حبوب|acne|شوائب|blemish|salicylic|ساليسيليك|benzoyl|رؤوس/i},
  {id:"hair", ar:"شعر", en:"Hair", re:/شعر|hair|scalp|فروة|olaplex|k18/i}
];

let currentConcern = "";
var wishView = false;
let wishlist = [];
try { wishlist = JSON.parse(localStorage.getItem("naqa_wish") || "[]"); if (!Array.isArray(wishlist)) wishlist = []; } catch (e) { wishlist = []; }
let quizStep = 0, quizAns = {};

function saveWish() { try { localStorage.setItem("naqa_wish", JSON.stringify(wishlist)); } catch (e) {} }
function isWish(id) { return wishlist.indexOf(+id) >= 0; }
function toggleWish(id) {
  id = +id;
  if (isWish(id)) wishlist = wishlist.filter(function (x) { return x !== id; });
  else wishlist.push(id);
  saveWish();
  document.querySelectorAll('[data-wish="' + id + '"]').forEach(function (b) {
    b.classList.toggle("on", isWish(id));
  });
  var n = wishlist.length, wb = $("#wishBadge");
  if (wb) { wb.hidden = !n; wb.textContent = n; }
  var hb = $("#wishBtn"); if (hb) hb.classList.toggle("on", !!wishView);
  if (typeof toast === "function") toast(isWish(id) ? (lang === "en" ? "Saved" : "انحفظ") : (lang === "en" ? "Removed from saved" : "انشال من المحفوظات"));
  if (wishView && typeof render === "function") render();
}

function tagConcerns() {
  products.forEach(function (p) {
    var blob = [p.skinAr, p.skinEn, p.nameAr, p.nameEn, p.descAr, p.descEn, p.cat, p.brand].join(" ");
    var tags = [];
    CONCERNS.forEach(function (c) { if (c.re.test(blob)) tags.push(c.id); });
    if (!tags.length) tags.push("all");
    p.concerns = tags;
  });
}

function concernLabel(id) {
  var c = CONCERNS.find(function (x) { return x.id === id; });
  if (!c) return id;
  return lang === "en" ? c.en : c.ar;
}

function renderConcernBar() {
  var el = $("#concernBar"); if (!el) return;
  /* keep bar on product browse; light hide only when pure home catalogs */
  if (typeof isHomeCatalogView === "function" && isHomeCatalogView()) {
    el.innerHTML = '<button type="button" class="cchip quiz-chip" id="openQuizBtn">' + (lang === "en" ? "Skin quiz ✨" : "اختبار البشرة ✨") + "</button>";
    return;
  }
  var html = '<button type="button" class="cchip' + (currentConcern === "" ? " on" : "") + '" data-concern="">' + (lang === "en" ? "All needs" : "كل الاحتياجات") + "</button>";
  CONCERNS.forEach(function (c) {
    /* skin types first, skip hair on face concerns? keep all */
    html += '<button type="button" class="cchip' + (currentConcern === c.id ? " on" : "") + '" data-concern="' + c.id + '">' + (lang === "en" ? c.en : c.ar) + "</button>";
  });
  html += '<button type="button" class="cchip quiz-chip" id="openQuizBtn">' + (lang === "en" ? "Skin quiz ✨" : "اختبار البشرة ✨") + "</button>";
  el.innerHTML = html;
}

function renderBrandsGrid() {
  var el = $("#brandsGrid"); if (!el) return;
  if (query || currentCat !== "all" || currentBrand || currentConcern || wishView || (typeof currentCatalog!=="undefined" && currentCatalog)) { el.hidden = true; return; }
  el.hidden = false;
  var counts = {};
  products.forEach(function (p) { if (!p.hidden) counts[p.brand] = (counts[p.brand] || 0) + 1; });
  var brands = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
  var title = lang === "en" ? "Brands" : "الماركات";
  el.innerHTML = '<div class="brands-head"><h3>' + title + "</h3><span>" + brands.length + (lang === "en" ? " brands" : " ماركة") + "</span></div>"
    + '<div class="brands-row">' + brands.map(function (b) {
      var logo = (typeof BRAND_LOGO !== "undefined" && BRAND_LOGO[b]) ? BRAND_LOGO[b] : "";
      var d = (typeof BRAND_DOMAIN !== "undefined" && BRAND_DOMAIN[b]) ? BRAND_DOMAIN[b] : "";
      var fav = logo || (d ? ("https://www.google.com/s2/favicons?domain=" + encodeURIComponent(d) + "&sz=128") : "");
      var ini = String(b || "?").replace(/[^A-Za-z\u0600-\u06FF0-9]/g, "").slice(0, 2).toUpperCase() || "•";
      var mark = fav
        ? '<img src="' + fav + '" alt="" loading="lazy" width="40" height="40">'
        : '<span class="bmono">' + esc(ini) + "</span>";
      return '<button type="button" class="brand-tile" data-brand="' + esc(b) + '">' + mark + "<span>" + esc(b) + "</span><i>" + counts[b] + "</i></button>";
    }).join("") + "</div>";
}


