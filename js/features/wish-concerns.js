/* features: concerns, quiz, wishlist, brands, bundles, trust */
const CONCERNS = [
  {id:"oily", ar:"دهنية / مختلطة", en:"Oily / Combo", re:/دهن|مختلط|oily|combination|مسام|acne|رؤوس/i},
  {id:"dry", ar:"جافة / عطشانة", en:"Dry / Dehydrated", re:/جافة|جاف\s|عطشان|مشدود|تقشر|dehydrated|\bdry\b|flaky|parched/i},
  {id:"sens", ar:"حساسة", en:"Sensitive", re:/حساس|sensitive|تهدئ|sooth|centella|سنتيلا|calm/i},
  {id:"pore", ar:"مسام / نضارة", en:"Pores / Glow", re:/مسام|pore|نضار|glow|vitamin c|فيتامين|bright|تفت/i},
  {id:"spot", ar:"تصبغ / توحيد", en:"Spots / Tone", re:/تصبغ|بقع|dark spot|niacinamide|نياسين|توحيد|whit|tone|txa|tranex/i},
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
  var html = '<button type="button" class="cchip' + (currentConcern === "" ? " on" : "") + '" data-concern="">' + (lang === "en" ? "All needs" : "كل الاحتياجات") + "</button>";
  CONCERNS.forEach(function (c) {
    html += '<button type="button" class="cchip' + (currentConcern === c.id ? " on" : "") + '" data-concern="' + c.id + '">' + (lang === "en" ? c.en : c.ar) + "</button>";
  });
  html += '<button type="button" class="cchip quiz-chip" id="openQuizBtn">' + (lang === "en" ? "Skin quiz ✨" : "اختبار البشرة ✨") + "</button>";
  el.innerHTML = html;
}

function renderBrandsGrid() {
  var el = $("#brandsGrid"); if (!el) return;
  /* home only — compact brand chips, not brand catalogs */
  if (query || currentCat !== "all" || currentBrand || currentConcern || wishView || (typeof catalogBrowse!=="undefined" && catalogBrowse)) {
    el.hidden = true; return;
  }
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
      var mark = fav
        ? '<img src="' + fav + '" alt="' + esc(b) + '" loading="lazy" width="40" height="40" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'bmono\',textContent:\'' + esc(String(b).slice(0,2).toUpperCase()) + '\'}))">'
        : '<span class="bmono">' + esc(String(b).slice(0, 2).toUpperCase()) + "</span>";
      return '<button type="button" class="brand-tile" data-brand="' + esc(b) + '">' + mark + "<span>" + esc(b) + "</span><i>" + counts[b] + "</i></button>";
    }).join("") + "</div>";
}

