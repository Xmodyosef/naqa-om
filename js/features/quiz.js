/* Skin quiz — classic types + goals (Nice One / dermatology style) */
var QUIZ = [
  {
    id: "type",
    ar: "ما نوع بشرتكِ؟", en: "What's your skin type?",
    opts: [
      { v: "oily", ar: "دهنية — لامعة ومسام ظاهرة", en: "Oily — shiny, visible pores" },
      { v: "dry", ar: "جافة — مشدودة أو تتقشر", en: "Dry — tight or flaky" },
      { v: "combo", ar: "مختلطة — منطقة T دهنية وخدود أجف", en: "Combination — oily T-zone, drier cheeks" },
      { v: "sens", ar: "حساسة — تحمر أو تتهيج بسهولة", en: "Sensitive — flushes or reacts easily" },
      { v: "normal", ar: "عادية / متوازنة", en: "Normal / balanced" }
    ]
  },
  {
    id: "goal",
    ar: "وش هدفكِ الأول؟", en: "What's your top goal?",
    opts: [
      { v: "pore", ar: "نضارة ومسام أنظف", en: "Glow & clearer pores" },
      { v: "spot", ar: "تفتيح وتوحيد اللون", en: "Brighten & even tone" },
      { v: "dry", ar: "ترطيب عميق", en: "Deep hydration" },
      { v: "acne", ar: "تقليل الحبوب والشوائب", en: "Fewer breakouts" },
      { v: "sens", ar: "تهدئة وحماية الحاجز", en: "Calm & barrier care" }
    ]
  },
  {
    id: "time",
    ar: "كم خطوة تقدرين يومياً؟", en: "How many steps daily?",
    opts: [
      { v: "2", ar: "٢–٣ خطوات بسيطة", en: "2–3 simple steps" },
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
  currentBrand = "";
  currentCatalog = "";
  query = "";
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
      if (v && isNaN(+v) && v !== "makeup" && v !== "normal") scores[v] = (scores[v] || 0) + 1;
    });
    /* type carries weight; goal boosts concern */
    var type = quizAns.type || "sens";
    var goal = quizAns.goal || type;
    var best = goal;
    if (type === "sens" || type === "dry" || type === "oily" || type === "combo") {
      /* prefer goal if set, else type */
      best = goal || type;
    }
    if (type === "normal" && goal) best = goal;
    if (quizAns.time === "makeup") best = "makeup";
    quizPendingFilters = best;

    var typeLab = (function(){
      var map = { oily:"دهنية", dry:"جافة", combo:"مختلطة", sens:"حساسة", normal:"عادية" };
      var mapEn = { oily:"Oily", dry:"Dry", combo:"Combination", sens:"Sensitive", normal:"Normal" };
      return lang === "en" ? (mapEn[type]||type) : (map[type]||type);
    })();
    var title = lang === "en" ? "Your match" : "نتيجتكِ";
    var sub = best === "makeup"
      ? (lang === "en" ? "We picked face makeup for you." : "اخترنا لكِ مكياج الوجه.")
      : (lang === "en"
        ? ("Skin type: " + typeLab + " · Focus: " + (typeof concernLabel==="function"?concernLabel(best):best))
        : ("نوع البشرة: " + typeLab + " · التركيز: " + (typeof concernLabel==="function"?concernLabel(best):best)));
    var rec = products.filter(function (p) {
      if (p.hidden) return false;
      if (best === "makeup") return p.cat === "وجه" || p.cat === "شفاه" || p.cat === "عيون";
      return p.concerns && p.concerns.indexOf(best) >= 0;
    }).slice(0, 6);
    if (!rec.length && best !== "makeup") {
      rec = products.filter(function (p) {
        return !p.hidden && p.concerns && p.concerns.indexOf(type) >= 0;
      }).slice(0, 6);
    }
    var routine = (typeof routineHTML === "function") ? routineHTML(best === "makeup" ? "sens" : best) : "";
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
