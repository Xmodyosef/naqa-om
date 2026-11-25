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
        ? '<img src="' + logo + '" alt="' + esc(b) + '" loading="lazy" width="40" height="40">'
        : '<span class="bmono">' + esc(String(b).slice(0, 2).toUpperCase()) + "</span>";
      var name = logo ? '<span aria-hidden="true">' + esc(b) + "</span>" : "<span>" + esc(b) + "</span>";
      return '<button type="button" class="brand-tile" data-brand="' + esc(b) + '">' + mark + name + "<i>" + counts[b] + "</i></button>";
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
      return imgs[0] ? '<img src="' + imgs[0] + '" alt="' + esc(pname(p)) + '" loading="lazy">' : "<span>" + (p.em || "✨") + "</span>";
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
  buildBundleItems(b).forEach(function (p) { addToCart(p.id, 1, true); });
  if (typeof toast === "function") toast(lang === "en" ? "Set added" : "انضافت الباقة");
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
  return "";
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

var quizPendingFilters = null;

function openQuiz() {
  quizStep = 0; quizAns = {}; quizPendingFilters = null;
  var m = $("#quizModal"); if (!m) return;
  m.classList.add("show");
  document.body.classList.add("modal-open");
  if (window.naqaScrollLock) naqaScrollLock.lock();
  paintQuiz();
}
function closeQuiz() {
  var m = $("#quizModal"); if (m) m.classList.remove("show");
  document.body.classList.remove("modal-open");
  if (window.naqaScrollLock) naqaScrollLock.unlock();
}

function applyQuizFilters(best) {
  currentConcern = best === "makeup" ? "" : best;
  currentCat = best === "makeup" ? "وجه" : "عناية";
  currentBrand = ""; query = "";
  var search = $("#search"); if (search) search.value = "";
  document.querySelectorAll("#cats [data-cat]").forEach(function (x) {
    x.classList.toggle("on", x.dataset.cat === currentCat);
  });
  if (typeof render === "function") render();
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
    quizPendingFilters = best;
    // Do NOT call render() here — that was the jank (full catalog re-paint under the modal)
    var title = lang === "en" ? "Your match" : "نتيجتكِ";
    var sub = best === "makeup"
      ? (lang === "en" ? "We picked face makeup for you." : "اخترنا لكِ مكياج الوجه.")
      : (lang === "en" ? ("Focus: " + concernLabel(best)) : ("التركيز: " + concernLabel(best)));
    var rec = products.filter(function (p) {
      if (p.hidden) return false;
      if (best === "makeup") return p.cat === "وجه" || p.cat === "شفاه" || p.cat === "عيون";
      return p.concerns && p.concerns.indexOf(best) >= 0;
    }).slice(0, 6);
    var routine = (typeof routineHTML === "function") ? routineHTML(best) : "";
    // Lightweight cards: one thumb only, no full catalog side-effects
    body.innerHTML = '<div class="quiz-result"><h3>' + title + "</h3><p>" + sub + "</p>"
      + routine
      + '<div class="quiz-rec">' + rec.map(function (p) {
        var img = (p.imgs && p.imgs[0]) ? ('<img src="'+p.imgs[0]+'" alt="'+esc(pname(p))+'" loading="lazy" decoding="async" width="120" height="90">') : (p.em || "✨");
        return '<button type="button" class="quiz-p" data-open="' + p.id + '">'
          + '<span class="quiz-thumb">' + (typeof img === "string" && img.indexOf("<img")===0 ? img : ("<span class=\"quiz-em\">"+img+"</span>")) + "</span>"
          + "<span" + ((p.imgs && p.imgs[0]) ? ' aria-hidden="true"' : "") + ">" + esc(pname(p)) + "</span><b>" + money(p.price) + "</b></button>";
      }).join("") + "</div>"
      + '<button type="button" class="btn btn-primary" id="quizApply">' + (lang === "en" ? "Show products" : "عرض المنتجات") + "</button>"
      + '<button type="button" class="btn btn-ghost" id="quizClose2">' + (lang === "en" ? "Close" : "إغلاق") + "</button></div>";
    // scroll result to top inside modal only
    body.scrollTop = 0;
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
/* Real reviews only. Approved list is data/reviews.json. No phone numbers. */
var NAQA_REVIEWS = [];

function applyReviewsList(list) {
  NAQA_REVIEWS = Array.isArray(list) ? list : [];
  if (typeof openProductId !== "undefined" && openProductId && typeof openSheet === "function") {
    var mode = (typeof sheetMode !== "undefined") ? sheetMode : "full";
    if (mode !== "qv") openSheet(openProductId, mode, false);
  }
}
function loadReviewsFromCloud() {
  try {
    if (!window.firebase || !firebase.apps || !firebase.apps.length || !firebase.firestore) return Promise.resolve(null);
    return firebase.firestore().collection("naqa").doc("reviews").get().then(function (snap) {
      if (!snap.exists) return null;
      var d = snap.data() || {};
      var list = d.list || d.reviews || null;
      return Array.isArray(list) ? list : null;
    }).catch(function () { return null; });
  } catch (e) { return Promise.resolve(null); }
}
function loadReviews() {
  return fetch("data/reviews.json?v=" + Date.now())
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (list) {
      applyReviewsList(Array.isArray(list) ? list : []);
      return loadReviewsFromCloud().then(function (cloud) {
        if (cloud && cloud.length) applyReviewsList(cloud);
      });
    })
    .catch(function () {
      return loadReviewsFromCloud().then(function (cloud) {
        applyReviewsList(cloud || []);
      }).catch(function () { NAQA_REVIEWS = []; });
    });
}

function reviewsFor(p) {
  if (!p) return [];
  return NAQA_REVIEWS.filter(function (r) {
    if (!r) return false;
    if (r.pid != null && Number(r.pid) === Number(p.id)) return true;
    return r.sku && p.sku && String(r.sku) === String(p.sku);
  });
}

function reviewText(r) {
  var ar = (r.ar || "").trim();
  var en = (r.en || "").trim();
  if (typeof lang !== "undefined" && lang === "en") return en || ar;
  return ar || en;
}

function reviewHTML(p) {
  var list = reviewsFor(p);
  if (!list.length) return "";
  var avg = list.reduce(function (s, r) { return s + Number(r.stars || 0); }, 0) / list.length;
  var label = (typeof lang !== "undefined" && lang === "en")
    ? (list.length + (list.length === 1 ? " review" : " reviews"))
    : (list.length + " تقييم");
  return '<div class="review-pill">' + avg.toFixed(1) + " ★ · " + label + "</div>";
}

function reviewsSection(p) {
  var en = typeof lang !== "undefined" && lang === "en";
  var list = reviewsFor(p);
  var cards = list.map(function (r) {
    var photo = r.photo ? '<img class="review-photo" src="' + esc(r.photo) + '" alt="' + (en ? "Review photo" : "صورة التقييم") + '">' : "";
    return '<article class="review-card"><header><span>' + esc(r.name || (en ? "Customer" : "زبونة")) + '</span><span>' + "★".repeat(Math.max(1, Math.min(5, Number(r.stars) || 0))) + '</span></header><p>' + esc(reviewText(r)) + '</p>' + photo + '</article>';
  }).join("");
  var empty = list.length ? "" : '<p class="review-empty">' + (en ? "No reviews yet. Be the first." : "لا تقييمات بعد. كوني الأولى.") + "</p>";
  return '<section class="reviews-block"><h4 class="block-h">' + (en ? "Real reviews" : "تقييمات حقيقية") + '</h4>'
    + '<p class="review-empty">' + (en ? "A nickname, your words, and an optional photo. Your phone number is never shown. It appears after we approve it." : "لقب، كلامك، وصورة اختيارية. رقمك ما يننشر. يظهر بعد الموافقة.") + "</p>"
    + empty + cards
    + '<button type="button" class="btn-ghost" data-write-review="' + p.id + '" style="margin-top:8px;border:1px solid var(--line);border-radius:12px;padding:10px 14px;font-weight:800">' + (en ? "Write a review" : "اكتبي تقييمك") + "</button></section>";
}

function ensureReviewForm() {
  if (document.getElementById("reviewOverlay")) return;
  var el = document.createElement("div");
  el.id = "reviewOverlay";
  el.className = "review-overlay";
  el.hidden = true;
  el.innerHTML = '<form class="review-card-form" id="reviewForm">'
    + '<h3 id="reviewTitle" style="margin:0 0 6px"></h3>'
    + '<p class="review-empty" id="reviewLead"></p>'
    + '<div class="star-pick" id="starPick"></div>'
    + '<label id="lblName"></label><input id="rvName" maxlength="24" autocomplete="nickname">'
    + '<label id="lblText"></label><textarea id="rvText" maxlength="600" rows="4"></textarea>'
    + '<label id="lblPhoto"></label><input id="rvPhoto" type="file" accept="image/*">'
    + '<p class="review-empty" id="rvMsg"></p>'
    + '<div style="display:flex;gap:8px;margin-top:12px">'
    + '<button type="submit" class="btn-add" id="rvSend" style="flex:1;border:0;border-radius:12px;padding:12px;font-weight:800;background:#1f1a17;color:#fff"></button>'
    + '<button type="button" id="rvClose" style="border:1px solid var(--line);border-radius:12px;padding:12px;font-weight:800;background:#fff"></button>'
    + '</div></form>';
  document.body.appendChild(el);
  var pick = document.getElementById("starPick");
  for (var i = 1; i <= 5; i++) {
    var b = document.createElement("button");
    b.type = "button";
    b.dataset.star = String(i);
    b.textContent = "★";
    pick.appendChild(b);
  }
  pick.addEventListener("click", function (e) {
    var b = e.target.closest("[data-star]");
    if (!b) return;
    el.dataset.stars = b.dataset.star;
    pick.querySelectorAll("button").forEach(function (x) {
      x.classList.toggle("on", Number(x.dataset.star) <= Number(el.dataset.stars));
    });
  });
  document.getElementById("rvClose").onclick = function () { el.hidden = true; };
  el.addEventListener("click", function (e) { if (e.target === el) el.hidden = true; });
  document.getElementById("reviewForm").addEventListener("submit", submitReview);
}

function openReviewForm(id) {
  var p = products.find(function (x) { return x.id === id; });
  if (!p) return;
  ensureReviewForm();
  var el = document.getElementById("reviewOverlay");
  var en = typeof lang !== "undefined" && lang === "en";
  el.dataset.pid = String(p.id);
  el.dataset.stars = "5";
  document.getElementById("reviewTitle").textContent = en ? "Review this product" : "قيّمي هذا المنتج";
  document.getElementById("reviewLead").textContent = pname(p);
  document.getElementById("lblName").textContent = en ? "Nickname shown on the site" : "اللقب الذي يظهر في الموقع";
  document.getElementById("lblText").textContent = en ? "Your experience, in English or Arabic" : "تجربتك، بالعربي أو الإنجليزي";
  document.getElementById("lblPhoto").textContent = en ? "Photo, optional" : "صورة، اختيارية";
  document.getElementById("rvSend").textContent = en ? "Send" : "إرسال";
  document.getElementById("rvClose").textContent = en ? "Close" : "إغلاق";
  document.getElementById("rvName").value = "";
  document.getElementById("rvText").value = "";
  document.getElementById("rvPhoto").value = "";
  document.getElementById("rvMsg").textContent = en
    ? "We read it first. Your phone number is not published."
    : "نقرأ التقييم أولاً. رقمك ما يننشر.";
  document.querySelectorAll("#starPick button").forEach(function (x) { x.classList.add("on"); });
  el.hidden = false;
}

function looksLikePhone(s) {
  var digits = String(s || "").replace(/\D/g, "");
  return digits.length >= 8;
}

function hasArabic(s) {
  return /[\u0600-\u06FF]/.test(s || "");
}

function submitReview(e) {
  e.preventDefault();
  var el = document.getElementById("reviewOverlay");
  var en = typeof lang !== "undefined" && lang === "en";
  var p = products.find(function (x) { return String(x.id) === String(el.dataset.pid); });
  if (!p) return;
  var name = document.getElementById("rvName").value.trim();
  var text = document.getElementById("rvText").value.trim();
  var stars = Number(el.dataset.stars || 0);
  var msg = document.getElementById("rvMsg");
  if (name.length < 2) { msg.textContent = en ? "Add a nickname." : "اكتبي لقباً."; return; }
  if (looksLikePhone(name) || looksLikePhone(text)) { msg.textContent = en ? "Don't include a phone number." : "لا تكتبي رقم هاتف."; return; }
  if (text.length < 8) { msg.textContent = en ? "Write a little more about the product." : "اكتبي أكثر عن المنتج."; return; }
  if (stars < 1) { msg.textContent = en ? "Choose the stars." : "اختاري النجوم."; return; }
  var fileInput = document.getElementById("rvPhoto");
  var file = fileInput.files && fileInput.files[0];
  var body = (en ? "Naqa review" : "تقييم نقاء") + "\n"
    + (p.sku || "") + " · " + pname(p) + "\n"
    + "★".repeat(stars) + " " + stars + "/5\n"
    + name + "\n" + text;
  if (file) body += en ? "\n\nPhoto is attached." : "\n\nالصورة مرفقة.";
  else body += "";
  var share = { text: body, title: "Naqa" };
  if (file) share.files = [file];
  var done = function () {
    el.hidden = true;
    if (typeof toast === "function") toast(en ? "Sent. It shows after approval." : "وصل. يظهر بعد الموافقة.");
  };
  if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share(share).then(done).catch(function (err) {
      if (err && err.name === "AbortError") return;
      openWaReview(body + (en ? "\n\nAttach the photo in the chat." : "\n\nأرفقي الصورة في نفس المحادثة."));
      done();
    });
    return;
  }
  if (!file && navigator.share) {
    navigator.share({ text: body, title: "Naqa" }).then(done).catch(function (err) {
      if (err && err.name === "AbortError") return;
      openWaReview(body);
      done();
    });
    return;
  }
  openWaReview(body + (file ? (en ? "\n\nAttach the photo in the chat." : "\n\nأرفقي الصورة في نفس المحادثة.") : ""));
  done();
}

function openWaReview(text) {
  var n = (typeof WA_NUMBER !== "undefined") ? WA_NUMBER : "96879088349";
  window.open("https://wa.me/" + n + "?text=" + encodeURIComponent(text), "_blank");
}

document.addEventListener("click", function (e) {
  var b = e.target.closest("[data-write-review]");
  if (!b) return;
  e.preventDefault();
  openReviewForm(Number(b.dataset.writeReview));
});

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadReviews);
else loadReviews();
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
    e.preventDefault();
    e.stopPropagation();
    var pid = +qp.dataset.open;
    // Apply filters without full jump, open product, then close quiz (avoids hash thrash → home)
    if (typeof quizPendingFilters !== "undefined" && quizPendingFilters != null && typeof applyQuizFilters === "function") {
      // store filters but defer heavy render until after sheet is open
      var best = quizPendingFilters;
      currentConcern = best === "makeup" ? "" : best;
      currentCat = best === "makeup" ? "وجه" : "عناية";
    }
    closeQuiz();
    requestAnimationFrame(function () {
      if (typeof openSheet === "function") openSheet(pid, "full");
    });
    return;
  }
  if (e.target.closest("#quizApply")) {
    e.preventDefault();
    var bestA = (typeof quizPendingFilters !== "undefined" && quizPendingFilters != null) ? quizPendingFilters : null;
    closeQuiz();
    if (bestA != null && typeof applyQuizFilters === "function") applyQuizFilters(bestA);
    else if (typeof render === "function") render();
    var prod = $("#products");
    if (prod) prod.scrollIntoView({ behavior: "smooth" });
    return;
  }
  var idsBtn = e.target.closest("[data-add-ids]");
  if (idsBtn) {
    idsBtn.getAttribute("data-add-ids").split(",").forEach(function (id) {
      if (id) addToCart(+id, 1, true);
    });
    if (typeof toast === "function") toast(lang === "en" ? "Routine added" : "انضاف الروتين");
    return;
  }
  var step = e.target.closest(".routine [data-open]");
  if (step) {
    closeQuiz();
    if (typeof openSheet === "function") openSheet(+step.getAttribute("data-open"), "full");
    return;
  }
  var price = e.target.closest("#priceBar [data-price]");
  if (price) {
    currentPrice = price.getAttribute("data-price") || "all";
    render();
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
