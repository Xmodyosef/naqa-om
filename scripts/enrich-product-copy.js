#!/usr/bin/env node
/**
 * Naqa — unique, comfortable AR/EN product copy (desc / use / skin).
 * Deterministic per product id. Re-run safe.
 * Usage: node scripts/enrich-product-copy.js
 */
"use strict";
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "data", "brands");

/* ---------- seed RNG (stable) ---------- */
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}
function pickN(rng, arr, n) {
  const a = arr.slice();
  const out = [];
  while (out.length < n && a.length) {
    const i = Math.floor(rng() * a.length);
    out.push(a.splice(i, 1)[0]);
  }
  return out;
}

/* ---------- parse helpers ---------- */
function sizeFrom(p) {
  const s = `${p.nameAr || ""} ${p.nameEn || ""}`;
  const m =
    s.match(/(\d+(?:[.,]\d+)?)\s*(مل|ml|ج|g|جم|pcs|قطع|pads?|عبوات?)/i) ||
    s.match(/(\d+)\s*[×x]\s*(\d+)/i);
  if (!m) return "";
  if (m[2] && /مل|ml/i.test(m[2])) return `${m[1]} مل`;
  if (m[2] && /ج|g/i.test(m[2])) return `${m[1]} ج`;
  return m[0].replace(/\s+/g, " ");
}
function sizeEn(p) {
  const s = `${p.nameEn || ""} ${p.nameAr || ""}`;
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*(ml|g|pcs|pads?)/i);
  if (m) return `${m[1]} ${m[2].toLowerCase()}`;
  const a = s.match(/(\d+)\s*مل/);
  if (a) return `${a[1]} ml`;
  const g = s.match(/(\d+)\s*ج/);
  if (g) return `${g[1]} g`;
  return "";
}

const ING = [
  [/niacinamide|نياسيناميد/i, { ar: "نياسيناميد", en: "niacinamide", benefitAr: "توحيد اللون ومظهر المسام", benefitEn: "evening tone and the look of pores" }],
  [/retinol|retinal|ريتينول|ريتينال/i, { ar: "ريتينويد", en: "a retinoid", benefitAr: "نعومة الملمس ومظهر الخطوط الدقيقة", benefitEn: "smoother texture and the look of fine lines" }],
  [/vitamin\s*c|فيتامين\s*سي|vit\s*c/i, { ar: "فيتامين سي", en: "vitamin C", benefitAr: "إشراقة ومظهر أكثر نضارة", benefitEn: "a brighter, fresher-looking complexion" }],
  [/hyaluronic|هيالورونيك|هيالورون/i, { ar: "حمض الهيالورونيك", en: "hyaluronic acid", benefitAr: "ترطيب خفيف وامتلاء المظهر", benefitEn: "lightweight hydration and a plump look" }],
  [/ceramide|سيراميد/i, { ar: "سيراميدات", en: "ceramides", benefitAr: "دعم حاجز البشرة", benefitEn: "supporting the skin barrier" }],
  [/peptide|ببتيد/i, { ar: "ببتيدات", en: "peptides", benefitAr: "مرونة ومظهر أكثر امتلاءً", benefitEn: "a firmer, bouncier look" }],
  [/centella|cica|سنتيلا|سيكا|heartleaf|هارت\s*ليف/i, { ar: "خلاصة مهدّئة (سنتيلا/هارت ليف)", en: "a calming botanical (centella/heartleaf)", benefitAr: "تهدئة الاحمرار والشعور بالراحة", benefitEn: "calming redness and comfort" }],
  [/salicylic|bha|ساليسيليك/i, { ar: "BHA", en: "BHA", benefitAr: "تنقية مظهر المسام", benefitEn: "refining the look of pores" }],
  [/aha|glycolic|lactic|جليكوليك|لاكتيك/i, { ar: "أحماض AHA", en: "AHAs", benefitAr: "تجديد المظهر ونعومة السطح", benefitEn: "a smoother, more renewed look" }],
  [/collagen|كولاجين|pdrn/i, { ar: "كولاجين / PDRN", en: "collagen / PDRN", benefitAr: "نضارة ومرونة المظهر", benefitEn: "a more resilient, fresh look" }],
  [/spf|sunscreen|واقي\s*شمس/i, { ar: "حماية شمسية", en: "sun protection", benefitAr: "حماية يومية من أشعة الشمس", benefitEn: "everyday UV protection" }],
  [/tea\s*tree|شجرة\s*الشاي/i, { ar: "شجرة الشاي", en: "tea tree", benefitAr: "إحساس نظافة وانتعاش", benefitEn: "a clean, fresh feel" }],
  [/shea|شيا/i, { ar: "زبدة الشيا", en: "shea butter", benefitAr: "تغذية وملمس غني", benefitEn: "rich nourishment and a soft feel" }],
  [/squalane|سكوالين/i, { ar: "سكوالين", en: "squalane", benefitAr: "ترطيب ناعم دون ثقل", benefitEn: "soft moisture without heaviness" }],
  [/tranexamic|txa/i, { ar: "ترانكساميك", en: "tranexamic acid", benefitAr: "مظهر بقع أفتح وأكثر توحيداً", benefitEn: "a more even-looking tone" }],
  [/panthenol|بانثينول/i, { ar: "بانثينول", en: "panthenol", benefitAr: "ترطيب وهدوء للبشرة", benefitEn: "soothing moisture" }],
];

function ingredients(p) {
  const s = `${p.nameAr || ""} ${p.nameEn || ""} ${p.descAr || ""}`;
  const found = [];
  for (const [re, meta] of ING) if (re.test(s)) found.push(meta);
  return found;
}

function kindOf(p) {
  const n = `${p.nameAr || ""} ${p.nameEn || ""} ${p.cat || ""}`.toLowerCase();
  const rules = [
    [/mascara|ماسكارا/, "mascara"],
    [/brow|حاجب|حواجب/, "brow"],
    [/lipstick|lip\s*oil|lip\s*plumper|lip\s*tint|lip\s*mask|lip\s*balm|شفاه|زيت\s*شفاه|قلم\s*شفاه|روج/, "lip"],
    [/blush|highlighter|contour|foundation|primer|concealer|setting|powder|فاونديشن|برايمر|كونسيلر|بلاش|هايلايتر|بودرة/, "face"],
    [/brush|فرشاة|beauty\s*tool|أداة/, "tool"],
    [/shampoo|conditioner|hair\s*serum|hair\s*oil|scalp|شعر|فروة|شامبو|بلسم\s*شعر/, "hair"],
    [/sunscreen|spf|واقي\s*شمس/, "spf"],
    [/cleansing\s*oil|oil\s*cleanser|غسول|cleanser|foam|wash|تنظيف/, "cleanser"],
    [/toner|تونر|pad|وسادة|مسحة/, "toner"],
    [/scrub|مقشر|exfoliat/, "scrub"],
    [/mask|قناع/, "mask"],
    [/ampoule|أمبول/, "ampoule"],
    [/serum|سيروم|سيرم/, "serum"],
    [/cream|كريم|moisturizer|مرطب\s*وجه|gel\s*cream/, "cream"],
    [/lotion|body|لوشن|جسم/, "lotion"],
    [/balm|بلسم/, "balm"],
  ];
  for (const [re, k] of rules) if (re.test(n)) return k;
  if (p.cat === "شعر") return "hair";
  if (p.cat === "شفاه") return "lip";
  if (p.cat === "عيون") return "mascara";
  if (p.cat === "حواجب") return "brow";
  if (p.cat === "وجه") return "face";
  if (p.cat === "أدوات") return "tool";
  return "care";
}

function shortTitle(p) {
  let ar = (p.nameAr || "").replace(/\s*[-–—].*$/, "").trim();
  let en = (p.nameEn || "").replace(/\s*[-–—].*$/, "").trim();
  if (ar.length > 42) ar = ar.slice(0, 40) + "…";
  if (en.length > 48) en = en.slice(0, 46) + "…";
  return { ar, en };
}

/* ---------- copy banks ---------- */
const OPEN_AR = [
  (t, b) => `${t} من ${b} — اختيار يومي يريح البشرة ويعطي نتيجة واضحة بدون تعقيد.`,
  (t, b) => `من مجموعة ${b}: ${t}. صُمم لروتين بسيط يناسب إيقاع يومك.`,
  (t, b) => `${t} (${b}) يمنحك خطوة عناية مركّزة، بملمس مريح ونتيجة تُلاحظ مع الانتظام.`,
  (t, b) => `عناية أنيقة من ${b}: ${t}. يوازن بين الفعالية والنعومة على البشرة.`,
  (t, b) => `${t} من ${b} — لمسة ناعمة، إحساس نظيف، وروتين لا يستهلك وقتك.`,
];
const OPEN_EN = [
  (t, b) => `${t} by ${b} — a daily step that feels kind on skin and shows a clear result without fuss.`,
  (t, b) => `From ${b}: ${t}. Built for a simple routine that fits a real day.`,
  (t, b) => `${t} (${b}) is a focused care step with a comfortable texture and results that build with use.`,
  (t, b) => `A polished pick from ${b}: ${t}. Balanced between feel and visible finish.`,
  (t, b) => `${t} by ${b} — soft on contact, clean finish, and a routine that does not steal your morning.`,
];

const TEXTURE_AR = {
  serum: ["ملمس خفيف يمتص بسرعة", "قوام مائي-زيتي لطيف", "يسري على البشرة دون لزوجة مزعجة"],
  cream: ["قوام كريمي يغلف البشرة", "ملمس غني دون إحساس ثقيل مفرط", "طبقة ناعمة تريح الجفاف"],
  toner: ["ملمس مائي منعش", "يرطّب كخطوة أولى خفيفة", "إحساس نظافة وانتعاش فوري"],
  cleanser: ["رغوة أو زيت يزيل الشوائب بلطف", "ينظّف دون أن يشدّ البشرة", "يترك الوجه نظيفاً ومريحاً"],
  mask: ["تركيبة تترك أثراً مرئياً بعد الاستخدام", "وقت قصير… نتيجة أوضح", "خطوة أسبوعية تُجدّد الإحساس بالبشرة"],
  spf: ["يحمي ويُكمل الروتين الصباحي", "ملمس يتحمل المكياج فوقه", "حماية يومية بلمسة مريحة"],
  lip: ["يلمس الشفاه بنعومة", "لون أو لمعان حسب النوع", "مريح طوال اليوم"],
  mascara: ["يمسك الرموش دون تكتل مزعج", "يمنح كثافة أو طولاً حسب التركيبة", "سهولة في التطبيق والإزالة"],
  brow: ["يحدد الحواجب بخطوط طبيعية", "ثابت بما يكفي ليوم عادي", "تحكم سهل بالشكل"],
  face: ["يمنح تغطية أو لمسة نهائية حسب المنتج", "يندمج مع البشرة بسلاسة", "مناسب لروتين مكياج يومي"],
  hair: ["يعتني بالشعر أو الفروة بوضوح", "ملمس يسهّل التصفيف", "نتيجة أنظف وأطرى مع الانتظام"],
  tool: ["أداة عملية للاستخدام المنزلي", "تساعد على تطبيق أنظف", "سهلة التنظيف بعد الاستخدام"],
  lotion: ["يمتص بمعدل مريح", "يرطّب مساحات أوسع من الجسم", "نهاية ناعمة غير لزجة"],
  scrub: ["يساعد على إزالة الخلايا السطحية بلطف", "بشرة أنعم عند اللمس", "يُستخدم بعدد مرات محدود أسبوعياً"],
  balm: ["بلسم يغلف ويهدّئ", "ملمس غني للأماكن الجافة", "راحة فورية تقريباً"],
  ampoule: ["تركيز أعلى في قطرات قليلة", "خطوة ليلية أو مكثّفة", "يُغلق بعدها بمرطب"],
  care: ["خطوة عناية متوازنة", " complement روتينك الحالي", "نتيجة مريحة مع الاستخدام المنتظم"],
};
const TEXTURE_EN = {
  serum: ["a light texture that absorbs quickly", "a fluid finish without heavy stickiness", "glides on and settles cleanly"],
  cream: ["a creamy wrap that comforts dryness", "rich enough, not greasy on most skins", "a soft layer that finishes calmly"],
  toner: ["a watery, refreshing first step", "light moisture right after cleansing", "a clean, cool feel"],
  cleanser: ["lifts residue without a tight after-feel", "cleanses and leaves skin comfortable", "a fresh reset for morning or night"],
  mask: ["a short session with a clearer after-feel", "weekly care you can see and feel", "a reset step between ordinary days"],
  spf: ["daytime protection that slots into your morning", "plays well under makeup for most users", "everyday UV care with a wearable finish"],
  lip: ["soft on contact", "tint or shine depending on the formula", "comfortable enough for all-day wear"],
  mascara: ["holds lashes with less clumping drama", "length or density depending on the brush", "easy to apply and remove"],
  brow: ["defines brows with natural-looking strokes", "holds shape through a normal day", "easy control of the arch"],
  face: ["blends smoothly into skin", "buildable finish for daily makeup", "a polished base or accent step"],
  hair: ["cares for hair or scalp with a clear role", "helps styling feel smoother", "cleaner, softer results with regular use"],
  tool: ["a practical at-home tool", "helps cleaner application", "simple to rinse after use"],
  lotion: ["absorbs at a comfortable pace", "covers larger areas with ease", "a soft, non-tacky finish"],
  scrub: ["gently buffs surface roughness", "skin feels smoother after rinsing", "use only a few times a week"],
  balm: ["a cushioning balm for dry spots", "rich comfort where you need it", "almost instant relief on contact"],
  ampoule: ["higher focus in a few drops", "an intensive step, often at night", "seal with cream after"],
  care: ["a balanced care step", "slots into what you already use", "comfortable results with steady use"],
};

// fix typo in care ar
TEXTURE_AR.care[1] = "يكمل روتينك الحالي";

const SKIN_AR = {
  serum: ["معظم أنواع البشرة — ابدئي بكمية قليلة", "الدهنية والمختلطة", "الجافة والمحتاجة", "الحساسة (اختبري أولاً)", "مع واقي شمس يومي عند التفتيح"],
  cream: ["الجافة والمحتاجة", "المختلطة في الطقس الجاف", "معظم الأنواع مساءً", "الحساسة الجافة"],
  toner: ["معظم الأنواع", "الحساسة", "الدهنية بعد التنظيف", "المتعطشة للترطيب"],
  cleanser: ["الدهنية والمختلطة", "معظم الأنواع صباحاً ومساءً", "الحساسة بصيغة لطيفة", "بعد مكياج ثقيل كخطوة أولى"],
  mask: ["مرة إلى ثلاث أسبوعياً حسب التحمل", "الدهنية للمسك الطيني", "الجافة للمسك المرطب", "الحساسة — راقبي المدة"],
  spf: ["كل أنواع البشرة نهاراً", "تحت المكياج", "بعد العناية الصباحية"],
  lip: ["كل درجات الشفاه", "الشفاه الجافة", "استخدام يومي مريح"],
  mascara: ["كل ألوان الرموش", "اختبري عند حساسية العين", "إطلالة يومية أو مسائية"],
  brow: ["كل درجات الحواجب", "تحديد يومي خفيف", "ثبّتي بفرشاة إن لزم"],
  face: ["معظم درجات البشرة — اختبري التطابق", "بشرة مختلطة إلى جافة", "إطلالة طبيعية يومية"],
  hair: ["حسب نوع الشعر والفروة", "الشعر المجهد", "الفروة التي تحتاج انتعاشاً"],
  tool: ["استخدام خارجي فقط", "بشرة نظيفة", "بلطف دون ضغط زائد"],
  lotion: ["الجسم الجاف", "استخدام يومي بعد الاستحمام", "معظم أنواع البشرة"],
  scrub: ["مرة أو مرتين أسبوعياً", "تجنّبي البشرة المتهيجة", "ليس مكان الريتينول القوي ليلاً"],
  balm: ["المناطق الجافة", "الحساسة المحتاجة", "كطبقة أخيرة"],
  ampoule: ["ليلية غالباً", "معظم الأنواع بحذر", "أغلقي بمرطب"],
  care: ["معظم أنواع البشرة", "راقبي أول أسبوع", "حسب احتياجك اليومي"],
};
const SKIN_EN = {
  serum: ["most skin types — start small", "oily and combination", "dry and dehydrated", "sensitive (patch-test first)", "daily SPF when brightening"],
  cream: ["dry and dehydrated", "combination in dry weather", "most types at night", "sensitive dry skin"],
  toner: ["most types", "sensitive", "oily after cleansing", "dehydrated skin"],
  cleanser: ["oily and combination", "most types morning and night", "sensitive with a mild formula", "after heavy makeup as step one"],
  mask: ["1–3 times weekly as tolerated", "oily skin for clay masks", "dry skin for hydrating masks", "sensitive — watch the time"],
  spf: ["all skin types by day", "under makeup", "after morning skincare"],
  lip: ["all lip tones", "dry lips", "comfortable daily wear"],
  mascara: ["all lash colors", "patch-test if eyes are sensitive", "day or evening looks"],
  brow: ["all brow tones", "soft daily definition", "brush through if needed"],
  face: ["most skin tones — check match", "combo to dry", "natural daily makeup"],
  hair: ["depends on hair and scalp", "stressed hair", "scalp that needs a refresh"],
  tool: ["external use only", "on clean skin", "gentle pressure only"],
  lotion: ["dry body skin", "daily after shower", "most skin types"],
  scrub: ["1–2 times weekly", "skip on irritated skin", "not the same night as strong retinoid"],
  balm: ["dry patches", "sensitive and needy areas", "as a final layer"],
  ampoule: ["often at night", "most types with care", "seal with cream"],
  care: ["most skin types", "watch the first week", "match to your daily need"],
};

function useBlock(kind, lang, rng) {
  const AR = {
    serum: [
      "١) على بشرة نظيفة، بعد التونر إن وُجد.\n٢) قطرتان إلى ثلاث على الوجه والرقبة — اضغطي ولا تفركي بقوة.\n٣) أغلقي بمرطب. صباحاً: واقي شمس.\n٤) إن وُجد ريتينول/أحماض أخرى، أدخليها تدريجياً ليلاً.",
      "١) نظّفي الوجه واتركيه رطباً قليلاً.\n٢) وزّعي السيروم من الوسط للخارج.\n٣) انتظري دقيقة ثم المرطب.\n٤) تجنّبي محيط العين إلا إذا كان المنتج مخصّصاً له.",
    ],
    cream: [
      "١) بعد السيروم (أو مباشرة بعد التنظيف).\n٢) كمية بحجم حبة البازلاء للوجه، وزيد للرقبة.\n٣) صباحاً واقي شمس فوقه.\n٤) مساءً يمكن طبقة أغنى على الخدود الجافة.",
      "١) خذي كمية صغيرة ودفّئيها بين الأصابع.\n٢) ربّتي على البشرة حتى الامتصاص.\n٣) لا تفرطي؛ القليل المنتظم أفضل من الكثير.",
    ],
    toner: [
      "١) بعد الغسول مباشرة.\n٢) على الراحة أو القطنة — تجنّبي سحب البشرة.\n٣) لا تشطفي. أكملي بسيروم ثم مرطب.",
      "١) بشرة نظيفة.\n٢) مرّري التونر أو الوسادة على الوجه.\n٣) ربّتي الزائد. راقبي إن كان مقشّراً: ليس يومياً بالضرورة.",
    ],
    cleanser: [
      "١) بلّلي الوجه بماء فاتر.\n٢) دلكي ٢٠–٣٠ ثانية ثم اشطفي جيداً.\n٣) جفّفي بالتربيت.\n٤) تنظيف مزدوج: الزيتي أولاً ثم الغسول إن لزم.",
      "١) صباحاً ومساءً كأول خطوة.\n٢) تجنّبي الماء الساخن جداً.\n٣) إن شدّت البشرة، قلّلي المدة أو غيّري لصيغة ألطف.",
    ],
    mask: [
      "١) على بشرة نظيفة.\n٢) طبقة منتظمة (أو القناع حسب التعليمات) ١٠–٢٠ دقيقة.\n٣) أزيلي أو ربّتي الباقي، ثم مرطب.\n٤) ليس يومياً إن كان طينياً أو تقشيرياً.",
      "١) مرة إلى ثلاث أسبوعياً.\n٢) ابتعدي عن الجروح أو التهيّج.\n٣) أكملي بروتينك المعتاد بعد الإزالة.",
    ],
    spf: [
      "١) آخر خطوة عناية صباحاً.\n٢) كمية تكفي الوجه والرقبة (حوالي إصبعين).\n٣) انتظري دقيقة قبل المكياج.\n٤) أعيدي عند التعرض الطويل للشمس.",
    ],
    lip: [
      "١) شفاه نظيفة وجافة.\n٢) طبّقي من الوسط للخارج.\n٣) أعيدي خلال اليوم حسب الحاجة.\n٤) ليلاً: طبقة أغنى إن كان مرطباً.",
    ],
    mascara: [
      "١) من جذور الرموش للأطراف بحركة متعرجة خفيفة.\n٢) طبقة ثانية بعد جفاف الأولى إن رغبتِ.\n٣) أزيلي بمزيل لطيف مساءً.\n٤) لا تشاركي الفرشاة مع آخرين.",
    ],
    brow: [
      "١) مشّطي الحاجب لشكله الطبيعي.\n٢) عبّئي الفراغات بخطوط قصيرة.\n٣) ثبّتي إن لزم.\n٤) امسحي الزائد بقطنة نظيفة.",
    ],
    face: [
      "١) على بشرة منظّفة ومرطّبة (وواقي شمس نهاراً).\n٢) طبّقي كمية قليلة ووزّعي جيداً.\n٣) ابنِي التغطية طبقات خفيفة.\n٤) ثبّتي إن احتجتِ لثبات أطول.",
    ],
    hair: [
      "١) حسب النوع: شامبو على الفروة، بلسم على الأطراف، سيروم بدون شطف حسب العبوة.\n٢) ابدئي بكمية قليلة.\n٣) لا تُغرقي الشعر؛ القليل يوزَّع أبعد.\n٤) انتظمي ٢–٣ أسابيع لملاحظة أوضح.",
    ],
    tool: [
      "١) على بشرة نظيفة.\n٢) حركة لطيفة دون ضغط مؤلم.\n٣) نظّفي الأداة بعد كل استخدام.\n٤) توقفي عند الاحمرار أو الألم.",
    ],
    lotion: [
      "١) بعد الاستحمام على بشرة رطبة قليلاً.\n٢) وزّعي من الأطراف للمركز.\n٣) أعيدي على الكوعين والساقين الجافة.\n٤) صباحاً أو مساءً حسب حاجتك.",
    ],
    scrub: [
      "١) على بشرة مبللة بعد التنظيف.\n٢) دلكي دائرياً لثوانٍ قليلة — بلا قوة.\n٣) اشطفي ومرّطي.\n٤) ١–٢ مرة أسبوعياً فقط.",
    ],
    balm: [
      "١) على المنطقة الجافة أو بعد العناية.\n٢) طبقة رقيقة ووزّعيها.\n٣) يمكن تكرارها ليلاً.\n٤) تجنّبي العين إن لم يُذكر ذلك.",
    ],
    ampoule: [
      "١) مساءً غالباً على بشرة نظيفة.\n٢) قطرات قليلة واضغطي.\n٣) أغلقي بكريم.\n٤) أدخليها يوماً بعد يوم أول أسبوع.",
    ],
    care: [
      "١) اتبّعي ترتيب روتينك: تنظيف → عناية → حماية.\n٢) كمية معتدلة أفضل من الإفراط.\n٣) راقبي البشرة أول أسبوع.\n٤) واقي شمس نهاراً دائماً مع التفتيح أو الأحماض.",
    ],
  };
  const EN = {
    serum: [
      "1) On clean skin, after toner if you use one.\n2) Press 2–3 drops on face and neck — do not rub hard.\n3) Seal with cream. Morning: sunscreen.\n4) Add other retinoids/acids slowly at night.",
      "1) Cleanse and leave skin slightly damp.\n2) Spread from the center outward.\n3) Wait a minute, then moisturize.\n4) Avoid the eye area unless the product is made for it.",
    ],
    cream: [
      "1) After serum (or right after cleansing).\n2) Pea-sized amount for the face; more for the neck.\n3) Sunscreen on top in the morning.\n4) At night, add a little on dry cheeks if needed.",
    ],
    toner: [
      "1) Right after cleansing.\n2) In palms or on a pad — do not drag the skin.\n3) Do not rinse. Follow with serum, then cream.",
    ],
    cleanser: [
      "1) Wet the face with lukewarm water.\n2) Massage 20–30 seconds, rinse well.\n3) Pat dry.\n4) Double cleanse: oil first, then foam if needed.",
    ],
    mask: [
      "1) On clean skin.\n2) Even layer (or sheet as labeled) for 10–20 minutes.\n3) Remove or pat in, then moisturize.\n4) Not daily if it is clay or exfoliating.",
    ],
    spf: [
      "1) Last skincare step in the morning.\n2) Enough for face and neck (about two fingers).\n3) Wait a minute before makeup.\n4) Reapply in long sun exposure.",
    ],
    lip: [
      "1) Clean, dry lips.\n2) Apply from the center outward.\n3) Reapply through the day as needed.\n4) At night, a richer layer if it is a balm/mask.",
    ],
    mascara: [
      "1) Root to tip with a light zigzag.\n2) Second coat after the first sets if you want more.\n3) Remove gently at night.\n4) Do not share the wand.",
    ],
    brow: [
      "1) Brush brows into shape.\n2) Fill gaps with short strokes.\n3) Set if needed.\n4) Clean extras with a cotton swab.",
    ],
    face: [
      "1) On clean, moisturized skin (and SPF by day).\n2) Start with a little and blend well.\n3) Build coverage in thin layers.\n4) Set if you need longer wear.",
    ],
    hair: [
      "1) As labeled: shampoo on scalp, conditioner on lengths, leave-in where it belongs.\n2) Start with a small amount.\n3) Do not overload — a little spreads farther.\n4) Give it 2–3 weeks of steady use.",
    ],
    tool: [
      "1) On clean skin.\n2) Gentle moves only.\n3) Rinse the tool after each use.\n4) Stop if you see lasting redness or pain.",
    ],
    lotion: [
      "1) After shower on slightly damp skin.\n2) Smooth from limbs toward the center.\n3) Reapply on elbows and dry legs.\n4) Morning or night as needed.",
    ],
    scrub: [
      "1) On wet skin after cleansing.\n2) Soft circles for a few seconds — no force.\n3) Rinse and moisturize.\n4) Only 1–2 times a week.",
    ],
    balm: [
      "1) On dry areas or after skincare.\n2) Thin layer, spread well.\n3) Repeat at night if needed.\n4) Avoid eyes unless the label allows it.",
    ],
    ampoule: [
      "1) Often at night on clean skin.\n2) A few drops, pressed in.\n3) Seal with cream.\n4) Every other night for the first week.",
    ],
    care: [
      "1) Keep order: cleanse → treat → protect.\n2) Moderate amount beats excess.\n3) Watch skin the first week.\n4) Daytime SPF always with brightening or acids.",
    ],
  };
  const bank = lang === "ar" ? AR : EN;
  const list = bank[kind] || bank.care;
  return pick(rng, list);
}

function buildCopy(p) {
  const rng = mulberry32(Number(p.id) * 2654435761 >>> 0 || 1);
  const kind = kindOf(p);
  const brand = p.brand || "Naqa";
  const { ar: titleAr, en: titleEn } = shortTitle(p);
  const szAr = sizeFrom(p);
  const szEn = sizeEn(p);
  const ings = ingredients(p);
  const ing = ings.length ? pick(rng, ings) : null;

  const openAr = pick(rng, OPEN_AR)(titleAr, brand);
  const openEn = pick(rng, OPEN_EN)(titleEn, brand);
  const texAr = pick(rng, TEXTURE_AR[kind] || TEXTURE_AR.care);
  const texEn = pick(rng, TEXTURE_EN[kind] || TEXTURE_EN.care);
  const skinAr = pick(rng, SKIN_AR[kind] || SKIN_AR.care);
  const skinEn = pick(rng, SKIN_EN[kind] || SKIN_EN.care);

  let midAr = ing
    ? `يبرز فيه ${ing.ar} لدعم ${ing.benefitAr}.`
    : pick(rng, [
        "يرتكز على توازن بين الراحة والنتيجة الظاهرة.",
        "مصمم ليكون خطوة واضحة داخل روتين أقصر.",
        "يخدم هدفاً واحداً بوضوح بدل وعود كثيرة.",
      ]);
  let midEn = ing
    ? `It highlights ${ing.en} to support ${ing.benefitEn}.`
    : pick(rng, [
        "It balances comfort with a visible, honest finish.",
        "Made as one clear step inside a shorter routine.",
        "One focused job — not a long list of empty claims.",
      ]);

  const sizeBitAr = szAr ? ` الحجم تقريباً ${szAr}.` : "";
  const sizeBitEn = szEn ? ` About ${szEn}.` : "";

  const closeAr = pick(rng, [
    "النتيجة أجمل مع الانتظام وواقي الشمس عند الحاجة.",
    "خزّنيه بعيداً عن الحرارة، وأغلقي الغطاء جيداً.",
    "إن ظهر تهيّج، خفّفي الاستخدام وراجعي طبيب بشرة عند اللزوم.",
  ]);
  const closeEn = pick(rng, [
    "Results look better with steady use and SPF when needed.",
    "Store away from heat and keep the cap closed.",
    "If irritation appears, ease off and see a dermatologist if it lasts.",
  ]);

  const descAr = `${openAr} ${midAr} ${texAr}.${sizeBitAr} يناسب: ${skinAr}. ${closeAr}`.replace(/\s+/g, " ").trim();
  const descEn = `${openEn} ${midEn} ${texEn}.${sizeBitEn} Best for: ${skinEn}. ${closeEn}`.replace(/\s+/g, " ").trim();

  const useAr = useBlock(kind, "ar", rng);
  const useEn = useBlock(kind, "en", rng);

  return {
    descAr,
    descEn,
    useAr,
    useEn,
    skinAr,
    skinEn,
    kind,
  };
}

/* ---------- rewrite brand files ---------- */
function main() {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".js") && f !== "TEMPLATE.js").sort();
  let total = 0;
  const kinds = {};
  const descs = new Set();
  const collisions = [];

  for (const file of files) {
    const full = path.join(DIR, file);
    let code = fs.readFileSync(full, "utf8");
    // extract push array by eval isolation
    const sandbox = { window: { NAQA_PRODUCTS: [] } };
    // eslint-disable-next-line no-new-func
    const fn = new Function("window", code + "\n;return window.NAQA_PRODUCTS;");
    const products = fn(sandbox.window);
    if (!Array.isArray(products) || !products.length) {
      console.warn("skip empty", file);
      continue;
    }

    for (const p of products) {
      const c = buildCopy(p);
      p.descAr = c.descAr;
      p.descEn = c.descEn;
      p.useAr = c.useAr;
      p.useEn = c.useEn;
      p.skinAr = c.skinAr;
      p.skinEn = c.skinEn;
      kinds[c.kind] = (kinds[c.kind] || 0) + 1;
      total++;
      if (descs.has(c.descAr)) collisions.push({ id: p.id, lang: "ar" });
      if (descs.has(c.descEn)) collisions.push({ id: p.id, lang: "en" });
      descs.add(c.descAr);
      descs.add(c.descEn);
    }

    // rewrite file with stable JSON-ish formatting (2-space)
    const header = `/* Brand: ${products[0].brand} · ${products.length} products · edit AR/EN fields here */\n`;
    const body =
      "window.NAQA_PRODUCTS = window.NAQA_PRODUCTS || [];\n" +
      "window.NAQA_PRODUCTS.push(\n" +
      products
        .map((p, i) => {
          const json = JSON.stringify(p, null, 2);
          return json + (i < products.length - 1 ? "," : "");
        })
        .join("\n") +
      "\n);\n";
    fs.writeFileSync(full, header + body, "utf8");
    console.log("OK", file, products.length);
  }

  console.log("total", total, "kinds", kinds);
  console.log("unique desc strings", descs.size, "collisions", collisions.length);
  if (collisions.length) console.log(collisions.slice(0, 10));

  // rebuild bundle
  require("child_process").execFileSync("node", [path.join(__dirname, "build-products-bundle.js")], {
    stdio: "inherit",
  });
}

main();
