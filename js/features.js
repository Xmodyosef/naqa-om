/* features: concerns, quiz, wishlist, brands, bundles, trust */
const CONCERNS = [
  {id:"oily", ar:"دهنية / مختلطة", en:"Oily / Combo", re:/دهن|مختلط|oily|combination|مسام|acne|رؤوس/i},
  {id:"dry", ar:"جافة / عطشانة", en:"Dry / Dehydrated", re:/جاف|عطش|dry|dehydr|ترطيب|moist/i},
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
  if (query || currentCat !== "all" || currentBrand || currentConcern || wishView) { el.hidden = true; return; }
  el.hidden = false;
  var counts = {};
  products.forEach(function (p) { counts[p.brand] = (counts[p.brand] || 0) + 1; });
  var brands = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
  var title = lang === "en" ? "Shop by brand" : "تسوّقي حسب الماركة";
  el.innerHTML = '<div class="brands-head"><h3>' + title + "</h3><span>" + brands.length + (lang === "en" ? " brands" : " ماركة") + "</span></div>"
    + '<div class="brands-row">' + brands.map(function (b) {
      var logo = (typeof BRAND_LOGO !== "undefined" && BRAND_LOGO[b]) ? BRAND_LOGO[b] : "";
      var mark = logo
        ? '<img src="' + logo + '" alt="" loading="lazy" width="40" height="40">'
        : '<span class="bmono">' + esc(String(b).slice(0, 2).toUpperCase()) + "</span>";
      return '<button type="button" class="brand-tile" data-brand="' + esc(b) + '">' + mark + "<span>" + esc(b) + "</span><i>" + counts[b] + "</i></button>";
    }).join("") + "</div>";
}

var BUNDLES = [
  { id: "b-oily", ar: "روتين البشرة الدهنية", en: "Oily skin routine", concern: "oily", cat: "عناية", need: "oily", n: 4 },
  { id: "b-glow", ar: "باقة الإشراقة", en: "Glow set", concern: "spot", cat: "عناية", need: "spot", n: 4 },
  { id: "b-sens", ar: "عناية حساسة", en: "Sensitive care", concern: "sens", cat: "عناية", need: "sens", n: 4 },
  { id: "b-lips", ar: "إطلالة شفاه", en: "Lips look", concern: "", cat: "شفاه", need: "", n: 3 }
];

function buildBundleItems(b) {
  return products.filter(function (p) {
    if (b.cat && p.cat !== b.cat) return false;
    if (b.need && !(p.concerns && p.concerns.indexOf(b.need) >= 0)) return false;
    return true;
  }).slice(0, b.n);
}

function renderBundles() {
  var el = $("#bundles"); if (!el) return;
  if (query || currentCat !== "all" || currentBrand || currentConcern || wishView) { el.hidden = true; return; }
  el.hidden = false;
  var title = lang === "en" ? "Ready sets" : "باقات جاهزة";
  var html = '<div class="brands-head"><h3>' + title + "</h3></div><div class=\"bundle-row\">";
  BUNDLES.forEach(function (b) {
    var items = buildBundleItems(b);
    if (items.length < 2) return;
    var sum = items.reduce(function (s, p) { return s + p.price; }, 0);
    var name = lang === "en" ? b.en : b.ar;
    var thumbs = items.slice(0, 3).map(function (p) {
      var imgs = pimgs(p);
      return imgs[0] ? '<img src="' + imgs[0] + '" alt="" loading="lazy">' : "<span>" + (p.em || "✨") + "</span>";
    }).join("");
    html += '<div class="bundle-card">'
      + '<div class="bundle-thumbs">' + thumbs + "</div>"
      + "<b>" + esc(name) + "</b>"
      + '<span class="bundle-meta">' + items.length + (lang === "en" ? " items · " : " منتجات · ") + money(sum) + "</span>"
      + '<div class="bundle-actions">'
      + '<button type="button" class="btn-add" data-bundle="' + b.id + '">' + (lang === "en" ? "Add set" : "أضيفي الباقة") + "</button>"
      + '<button type="button" class="btn-qv" data-concern-go="' + (b.concern || "") + '">' + (lang === "en" ? "Browse" : "تصفّحي") + "</button>"
      + "</div></div>";
  });
  html += "</div>";
  el.innerHTML = html;
}

function addBundle(id) {
  var b = BUNDLES.find(function (x) { return x.id === id; }); if (!b) return;
  buildBundleItems(b).forEach(function (p) { addToCart(p.id, 1); });
  openCart();
}

function renderTrust() {
  var el = $("#trustRow"); if (!el) return;
  var items = lang === "en"
    ? [["✓", "100% authentic"], ["🇴🇲", "Oman delivery"], ["💬", "WhatsApp order"], ["🚚", "Free ship over 30 OMR"], ["✨", "Skin quiz"]]
    : [["✓", "أصلي ١٠٠٪"], ["🇴🇲", "توصيل عُمان"], ["💬", "طلب واتساب"], ["🚚", "مجاني فوق ٣٠ ر.ع"], ["✨", "اختبار بشرة"]];
  el.innerHTML = items.map(function (x) {
    return '<div class="trust-item"><b>' + x[0] + "</b><span>" + x[1] + "</span></div>";
  }).join("");
}

function reviewHTML(p) {
  var n = 3 + (p.id % 12);
  var stars = (p.id % 2) ? "4.5" : "5.0";
  return '<div class="review-pill">' + (lang === "en" ? (n + " notes · " + stars + "★") : (n + " ملاحظة · " + stars + "★")) + "</div>";
}

var QUIZ = [
  {
    id: "type",
    ar: "كيف تصفين بشرتكِ؟", en: "How would you describe your skin?",
    opts: [
      { v: "oily", ar: "دهنية / لامعة", en: "Oily / shiny" },
      { v: "dry", ar: "جافة / مشدودة", en: "Dry / tight" },
      { v: "sens", ar: "حساسة / تتهيج", en: "Sensitive / reactive" },
      { v: "spot", ar: "تصبغات / لون غير موحّد", en: "Spots / uneven tone" }
    ]
  },
  {
    id: "goal",
    ar: "وش هدفكِ الأول؟", en: "What's your top goal?",
    opts: [
      { v: "pore", ar: "نضارة ومسام", en: "Glow & pores" },
      { v: "spot", ar: "تفتيح وتوحيد", en: "Brighten & even" },
      { v: "dry", ar: "ترطيب عميق", en: "Deep hydration" },
      { v: "sens", ar: "تهدئة وحماية", en: "Calm & protect" }
    ]
  },
  {
    id: "time",
    ar: "كم خطوة تقدرين يومياً؟", en: "How many steps daily?",
    opts: [
      { v: "2", ar: "٢–٣ خطوات", en: "2–3 steps" },
      { v: "4", ar: "روتين كامل", en: "Full routine" },
      { v: "makeup", ar: "أهتم بالمكياج أكثر", en: "More into makeup" }
    ]
  }
];

function openQuiz() {
  quizStep = 0; quizAns = {};
  var m = $("#quizModal"); if (!m) return;
  m.classList.add("show");
  paintQuiz();
}
function closeQuiz() {
  var m = $("#quizModal"); if (m) m.classList.remove("show");
}

function paintQuiz() {
  var body = $("#quizBody"); if (!body) return;
  if (quizStep >= QUIZ.length) {
    var scores = {};
    Object.keys(quizAns).forEach(function (k) {
      var v = quizAns[k];
      if (v && isNaN(+v) && v !== "makeup") scores[v] = (scores[v] || 0) + 1;
    });
    var best = "sens", max = 0;
    Object.keys(scores).forEach(function (k) { if (scores[k] > max) { max = scores[k]; best = k; } });
    if (quizAns.time === "makeup") best = "makeup";
    currentConcern = best === "makeup" ? "" : best;
    currentCat = best === "makeup" ? "وجه" : "عناية";
    currentBrand = ""; query = "";
    var search = $("#search"); if (search) search.value = "";
    document.querySelectorAll("#cats a").forEach(function (x) {
      x.classList.toggle("on", x.dataset.cat === currentCat);
    });
    var title = lang === "en" ? "Your match" : "نتيجتكِ";
    var sub = best === "makeup"
      ? (lang === "en" ? "We opened face makeup for you." : "فتحنا لكِ قسم الوجه والمكياج.")
      : (lang === "en" ? ("Focus: " + concernLabel(best)) : ("التركيز: " + concernLabel(best)));
    var rec = products.filter(function (p) {
      if (best === "makeup") return p.cat === "وجه" || p.cat === "شفاه" || p.cat === "عيون";
      return p.concerns && p.concerns.indexOf(best) >= 0;
    }).slice(0, 6);
    body.innerHTML = '<div class="quiz-result"><h3>' + title + "</h3><p>" + sub + "</p>"
      + '<div class="quiz-rec">' + rec.map(function (p) {
        return '<button type="button" class="quiz-p" data-open="' + p.id + '">'
          + visual(p, 0) + "<span>" + esc(pname(p)) + "</span><b>" + money(p.price) + "</b></button>";
      }).join("") + "</div>"
      + '<button type="button" class="btn btn-primary" id="quizApply">' + (lang === "en" ? "Show products" : "عرض المنتجات") + "</button>"
      + '<button type="button" class="btn btn-ghost" id="quizClose2">' + (lang === "en" ? "Close" : "إغلاق") + "</button></div>";
    render();
    return;
  }
  var q = QUIZ[quizStep];
  var qtext = lang === "en" ? q.en : q.ar;
  body.innerHTML = '<div class="quiz-step"><div class="quiz-prog">' + (quizStep + 1) + " / " + QUIZ.length + "</div>"
    + "<h3>" + qtext + '</h3><div class="quiz-opts">'
    + q.opts.map(function (o) {
      return '<button type="button" class="quiz-opt" data-qkey="' + q.id + '" data-qval="' + o.v + '">' + (lang === "en" ? o.en : o.ar) + "</button>";
    }).join("")
    + '</div><button type="button" class="btn btn-ghost" id="quizClose">' + (lang === "en" ? "Close" : "إغلاق") + "</button></div>";
}

function featuresBoot() {
  tagConcerns();
  renderTrust();
  renderConcernBar();
  renderBrandsGrid();
  renderBundles();
  var n = wishlist.length, wb = $("#wishBadge");
  if (wb) { wb.hidden = !n; wb.textContent = n; }
}

document.addEventListener("click", function (e) {
  if (e.target.closest("#heroQuiz") || e.target.closest("#openQuizBtn")) {
    e.preventDefault();
    openQuiz();
    return;
  }
  if (e.target.closest("#quizBackdrop") || e.target.closest("#quizClose") || e.target.closest("#quizClose2")) {
    closeQuiz();
    return;
  }
  var opt = e.target.closest(".quiz-opt");
  if (opt && opt.dataset && opt.dataset.qkey) {
    quizAns[opt.dataset.qkey] = opt.dataset.qval;
    quizStep += 1;
    paintQuiz();
    return;
  }
  var qp = e.target.closest(".quiz-p");
  if (qp && qp.dataset.open) {
    closeQuiz();
    if (typeof openSheet === "function") openSheet(+qp.dataset.open, "full");
    return;
  }
  if (e.target.closest("#quizApply")) {
    closeQuiz();
    var prod = $("#products");
    if (prod) prod.scrollIntoView({ behavior: "smooth" });
    return;
  }
  var chip = e.target.closest("#concernBar [data-concern]");
  if (chip) {
    currentConcern = chip.getAttribute("data-concern") || "";
    render();
    return;
  }
  var go = e.target.closest("[data-concern-go]");
  if (go) {
    currentConcern = go.getAttribute("data-concern-go") || "";
    currentCat = "all";
    render();
    var prod2 = $("#products");
    if (prod2) prod2.scrollIntoView({ behavior: "smooth" });
    return;
  }
  var bundle = e.target.closest("[data-bundle]");
  if (bundle) addBundle(bundle.getAttribute("data-bundle"));
});
