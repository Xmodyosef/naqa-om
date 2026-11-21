/* step features: routine, shades, ingredients, toast, price, order no */
var currentPrice = "all";

var ROLE = {
  clean: /غسول|منظف|cleanser|cleansing|foam wash|إنزيم الأرز|rice enzyme/i,
  serum: /سيروم|serum|ampoule|أمبول/i,
  cream: /مرطب|moisturizer|moisturiser|\bmoistur|كريم |لوشن|lotion/i,
  spf: /واقي الشمس|واقي شمس|sunscreen|\bspf\b/i
};

function rolePool(role) {
  return products.filter(function (p) {
    if (p.cat !== "عناية") return false;
    var blob = (p.nameAr || "") + " " + (p.nameEn || "");
    if (!ROLE[role].test(blob)) return false;
    if (role !== "spf" && ROLE.spf.test(blob)) return false;
    if (role === "cream" && (ROLE.serum.test(blob) || ROLE.clean.test(blob))) return false;
    if (role === "serum" && ROLE.clean.test(blob)) return false;
    return true;
  });
}
function pickRole(role, concern) {
  var pool = rolePool(role);
  var tagged = pool.filter(function (p) {
    return concern && p.concerns && p.concerns.indexOf(concern) >= 0;
  });
  return (tagged[0] || pool[0] || null);
}
function uniqProducts(arr) {
  var seen = {};
  return arr.filter(function (p) {
    if (!p || seen[p.id]) return false;
    seen[p.id] = 1;
    return true;
  });
}
function buildRoutine(concern) {
  return {
    am: uniqProducts(["clean", "serum", "cream", "spf"].map(function (r) { return pickRole(r, concern); })),
    pm: uniqProducts(["clean", "serum", "cream"].map(function (r) { return pickRole(r, concern); }))
  };
}
function routineBlock(list, label) {
  if (!list.length) return "";
  var ids = list.map(function (p) { return p.id; }).join(",");
  var steps = list.map(function (p, i) {
    return "<li><button type=\"button\" data-open=\"" + p.id + "\">" + (i + 1) + ". " + esc(pname(p)) + "</button></li>";
  }).join("");
  var add = lang === "en" ? "Add this routine" : "أضيفي الروتين";
  return "<div class=\"routine\"><b>" + label + "</b><ol>" + steps + "</ol>"
    + "<button type=\"button\" class=\"btn btn-primary\" data-add-ids=\"" + ids + "\">" + add + "</button></div>";
}
function routineHTML(concern) {
  if (!concern || concern === "makeup" || concern === "hair") return "";
  var r = buildRoutine(concern);
  var am = lang === "en" ? "Morning" : "الصبح";
  var pm = lang === "en" ? "Night" : "المساء";
  return routineBlock(r.am, am) + routineBlock(r.pm, pm);
}

function shadeLabel(p) {
  var ar = p.nameAr || "";
  var m = ar.match(/[-–]\s*\d{2,4}\s+(.+)$/);
  if (m) return m[1].trim();
  m = ar.match(/[-–]\s*(\d{2,4})\s*$/);
  if (m) return m[1];
  m = ar.match(/\s(\d{2,4})$/);
  if (m) return m[1];
  return "";
}
function shadeBase(p) {
  var ar = (p.nameAr || "").replace(/\s*[-–]\s*\d{2,4}.*$/, "").replace(/\s+\d{2,4}\s*$/, "").trim();
  return (p.brand || "") + "|" + ar;
}
function shadeHTML(p) {
  if (!shadeLabel(p)) return "";
  var base = shadeBase(p);
  var sibs = products.filter(function (x) { return shadeBase(x) === base && shadeLabel(x); });
  if (sibs.length < 2) return "";
  var title = lang === "en" ? "Shade" : "الدرجة";
  return "<div class=\"shade-row\"><span>" + title + "</span>" + sibs.map(function (s) {
    return "<button type=\"button\" class=\"shade-chip" + (s.id === p.id ? " on" : "") + "\" data-open=\"" + s.id + "\">" + esc(shadeLabel(s)) + "</button>";
  }).join("") + "</div>";
}

var INGS = [
  { re: /نياسين|niacinamide/i, ar: "نياسيناميد", en: "Niacinamide", arT: "يوحّد اللون ويهدّي مظهر المسام.", enT: "Evens tone and softens the look of pores." },
  { re: /سنتيلا|centella|cica/i, ar: "سنتيلا", en: "Centella", arT: "تهدّي الاحمرار وتدعم الحاجز.", enT: "Calms redness and supports the barrier." },
  { re: /هيالورون|hyaluron/i, ar: "هيالورونيك", en: "Hyaluronic acid", arT: "يمسك الماء داخل البشرة.", enT: "Holds water in the skin." },
  { re: /ريتينول|retinol|retinal/i, ar: "ريتينول", en: "Retinol", arT: "ليل فقط، ومعاه مرطب وواقي بالنهار.", enT: "Night only, with moisturizer and daytime SPF." },
  { re: /فيتامين\s*سي|vitamin c|ascorb/i, ar: "فيتامين سي", en: "Vitamin C", arT: "إشراقة، وبعده واقي شمس.", enT: "For glow. Follow with sunscreen." },
  { re: /ببتيد|peptide/i, ar: "ببتيدات", en: "Peptides", arT: "تدعم مظهر البشرة المشدود.", enT: "Support a firmer look." },
  { re: /سيراميد|ceramide/i, ar: "سيراميد", en: "Ceramides", arT: "تساعد حاجز البشرة.", enT: "Help the skin barrier." },
  { re: /ساليسيليك|salicylic|\bbha\b/i, ar: "ساليسيليك", en: "Salicylic acid", arT: "ينظّف داخل المسام. تجنّبيه إذا البشرة متهيجة.", enT: "Cleans inside pores. Skip if skin is irritated." },
  { re: /كولاجين|collagen/i, ar: "كولاجين", en: "Collagen", arT: "ترطيب ومظهر أنعم.", enT: "Hydration and a smoother look." },
  { re: /أرز|rice enzyme|إنزيم/i, ar: "إنزيم الأرز", en: "Rice enzyme", arT: "تنظيف لطيف وإشراقة خفيفة.", enT: "A gentle cleanse with a soft glow." },
  { re: /واقي الشمس|واقي شمس|sunscreen|\bspf\b/i, nameOnly:true, ar: "حماية شمس", en: "SPF", arT: "آخر خطوة في الصباح.", enT: "Last step in the morning." }
];
function ingHTML(p) {
  var blob = [p.nameAr, p.nameEn, p.descAr, p.descEn].join(" ");
  var hits = [];
  var names = (p.nameAr || "") + " " + (p.nameEn || "");
  INGS.forEach(function (g) {
    var src = g.nameOnly ? names : blob;
    if (hits.length < 3 && g.re.test(src)) hits.push(g);
  });
  if (!hits.length) return "";
  var title = lang === "en" ? "What's inside" : "وش داخله";
  return "<div class=\"ing-box\"><b>" + title + "</b>" + hits.map(function (g) {
    return "<p><strong>" + (lang === "en" ? g.en : g.ar) + ".</strong> " + (lang === "en" ? g.enT : g.arT) + "</p>";
  }).join("") + "</div>";
}

function toast(msg) {
  var t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { t.classList.remove("show"); }, 1600);
}

function renderPriceBar() {
  var el = $("#priceBar"); if (!el) return;
  var items = [
    ["all", lang === "en" ? "Any price" : "كل الأسعار"],
    ["low", lang === "en" ? "Under 5" : "تحت ٥"],
    ["mid", "5–15"],
    ["high", lang === "en" ? "Over 15" : "فوق ١٥"]
  ];
  el.innerHTML = items.map(function (it) {
    return "<button type=\"button\" class=\"cchip" + (currentPrice === it[0] ? " on" : "") + "\" data-price=\"" + it[0] + "\">" + it[1] + "</button>";
  }).join("");
}
function priceOk(p) {
  if (currentPrice === "low") return p.price < 5;
  if (currentPrice === "mid") return p.price >= 5 && p.price <= 15;
  if (currentPrice === "high") return p.price > 15;
  return true;
}

function makeOrderNo() {
  var d = new Date();
  function p(n) { return (n < 10 ? "0" : "") + n; }
  return "NQ-" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + Math.floor(100 + Math.random() * 900);
}

var OMAN_AREAS = [
  { ar: "مسقط", en: "Muscat", w: [
    ["مسقط","Muscat"],["مطرح","Muttrah"],["بوشر","Bawshar"],["السيب","Seeb"],["العامرات","Al Amarat"],["قريات","Qurayyat"]
  ]},
  { ar: "شمال الباطنة", en: "North Al Batinah", w: [
    ["صحار","Sohar"],["شناص","Shinas"],["لوى","Liwa"],["صحم","Saham"],["الخابورة","Al Khaburah"],["السويق","Al Suwaiq"]
  ]},
  { ar: "جنوب الباطنة", en: "South Al Batinah", w: [
    ["الرستاق","Al Rustaq"],["العوابي","Al Awabi"],["نخل","Nakhal"],["وادي المعاول","Wadi Al Maawil"],["بركاء","Barka"],["المصنعة","Al Musannah"]
  ]},
  { ar: "الداخلية", en: "Ad Dakhiliyah", w: [
    ["نزوى","Nizwa"],["بهلاء","Bahla"],["منح","Manah"],["الحمراء","Al Hamra"],["أدم","Adam"],["إزكي","Izki"],["سمائل","Samail"],["بدبد","Bidbid"],["الجبل الأخضر","Jabal Al Akhdar"]
  ]},
  { ar: "الظاهرة", en: "Ad Dhahirah", w: [
    ["عبري","Ibri"],["ينقل","Yanqul"],["ضنك","Dhank"]
  ]},
  { ar: "البريمي", en: "Al Buraimi", w: [
    ["البريمي","Al Buraimi"],["محضة","Mahdah"],["السنينة","Al Sinainah"]
  ]},
  { ar: "مسندم", en: "Musandam", w: [
    ["خصب","Khasab"],["بخا","Bukha"],["دبا","Dibba"],["مدحاء","Madha"]
  ]},
  { ar: "شمال الشرقية", en: "North Ash Sharqiyah", w: [
    ["إبراء","Ibra"],["المضيبي","Al Mudhaibi"],["بدية","Bidiya"],["القابل","Al Qabil"],["وادي بني خالد","Wadi Bani Khalid"],["دماء والطائيين","Dima wa Al Tayeen"]
  ]},
  { ar: "جنوب الشرقية", en: "South Ash Sharqiyah", w: [
    ["صور","Sur"],["الكامل والوافي","Al Kamil wal Wafi"],["جعلان بني بو حسن","Jalan Bani Bu Hassan"],["جعلان بني بو علي","Jalan Bani Bu Ali"],["مصيرة","Masirah"]
  ]},
  { ar: "الوسطى", en: "Al Wusta", w: [
    ["هيماء","Haima"],["محوت","Mahout"],["الدقم","Duqm"],["الجازر","Al Jazer"]
  ]},
  { ar: "ظفار", en: "Dhofar", w: [
    ["صلالة","Salalah"],["طاقة","Taqah"],["مرباط","Mirbat"],["ثمريت","Thumrait"],["سدح","Sadah"],["رخيوت","Rakhyut"],["ضلكوت","Dhalkut"],["مقشن","Muqshin"],["شليم وجزر الحلانيات","Shalim and the Hallaniyat Islands"],["المزيونة","Al Mazyunah"]
  ]}
];
function fillAreas() {
  var gov = $("#coGov"); if (!gov) return;
  var cur = gov.value;
  var html = '<option value="">' + (lang === "en" ? "— Choose —" : "— اختاري —") + "</option>";
  OMAN_AREAS.forEach(function (g) {
    html += '<optgroup label="' + (lang === "en" ? g.en : g.ar) + '">';
    g.w.forEach(function (pair) {
      var value = pair[0] + " / " + pair[1];
      var label = lang === "en" ? pair[1] : pair[0];
      html += '<option value="' + value + '">' + label + "</option>";
    });
    html += "</optgroup>";
  });
  gov.innerHTML = html;
  if (cur) gov.value = cur;
}
