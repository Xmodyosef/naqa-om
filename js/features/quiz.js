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
  document.querySelectorAll("#cats a").forEach(function (x) {
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
        var img = (p.imgs && p.imgs[0]) ? ('<img src="'+p.imgs[0]+'" alt="" loading="lazy" decoding="async" width="120" height="90">') : (p.em || "✨");
        return '<button type="button" class="quiz-p" data-open="' + p.id + '">'
          + '<span class="quiz-thumb">' + (typeof img === "string" && img.indexOf("<img")===0 ? img : ("<span class=\"quiz-em\">"+img+"</span>")) + "</span>"
          + "<span>" + esc(pname(p)) + "</span><b>" + money(p.price) + "</b></button>";
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
