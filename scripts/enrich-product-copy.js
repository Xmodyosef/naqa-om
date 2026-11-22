#!/usr/bin/env node
/**
 * Naqa product copy — unique, comfortable AR/EN (desc / use / skin).
 * Deterministic per product id. Strong structure, no cloned templates.
 * node scripts/enrich-product-copy.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const DIR = path.join(__dirname, "..", "data", "brands");

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
function cap(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function stripDash(s) {
  return String(s || "").replace(/\s*[-–—].*$/, "").trim();
}
function short(s, n) {
  s = stripDash(s);
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function sizeAr(p) {
  const s = `${p.nameAr || ""} ${p.nameEn || ""}`;
  let m = s.match(/(\d+(?:[.,]\d+)?)\s*(مل|ml)/i);
  if (m) return `${m[1]} مل`;
  m = s.match(/(\d+(?:[.,]\d+)?)\s*(ج|g|جم)/i);
  if (m) return `${m[1]} ج`;
  m = s.match(/(\d+)\s*(pads?|قطع|pcs)/i);
  if (m) return `${m[1]} قطعة`;
  m = s.match(/(\d+)\s*[×x]\s*(\d+)/i);
  if (m) return `${m[1]}×${m[2]}`;
  return "";
}
function sizeEn(p) {
  const s = `${p.nameEn || ""} ${p.nameAr || ""}`;
  let m = s.match(/(\d+(?:[.,]\d+)?)\s*(ml|g)/i);
  if (m) return `${m[1]} ${m[2].toLowerCase()}`;
  m = s.match(/(\d+)\s*مل/);
  if (m) return `${m[1]} ml`;
  m = s.match(/(\d+)\s*ج/);
  if (m) return `${m[1]} g`;
  m = s.match(/(\d+)\s*(pads?|pcs)/i);
  if (m) return `${m[1]} pcs`;
  return "";
}

const ING = [
  [/niacinamide|نياسيناميد/i, { ar: "نياسيناميد", en: "niacinamide", arB: "توحيد اللون ومظهر أنعم للمسام", enB: "a more even tone and refined-looking pores" }],
  [/retinol|retinal|ريتينول|ريتينال/i, { ar: "ريتينويد", en: "retinoid care", arB: "ملمس أنعم ومظهر خطوط أدق", enB: "smoother texture and a softer look of fine lines" }],
  [/فيتامين\s*سي|بفيتامين\s*سي|vitamin\s*c|vit\s*c/i, { ar: "فيتامين سي", en: "vitamin C", arB: "إشراقة صباحية أوضح", enB: "a clearer morning glow" }],
  [/hyaluronic|هيالورونيك|هيالورون/i, { ar: "هيالورونيك", en: "hyaluronic acid", arB: "ترطيب خفيف وامتلاء لطيف", enB: "light hydration and a plump feel" }],
  [/ceramide|سيراميد/i, { ar: "سيراميدات", en: "ceramides", arB: "دعم حاجز البشرة", enB: "barrier comfort" }],
  [/peptide|ببتيد|pdrn|كولاجين|collagen/i, { ar: "ببتيدات/كولاجين", en: "peptides/collagen support", arB: "مرونة ونضارة في المظهر", enB: "a springier, fresher look" }],
  [/centella|cica|سنتيلا|سيكا|heartleaf|هارت/i, { ar: "خلاصة مهدّئة", en: "calming botanicals", arB: "هدوء للاحمرار والتهيج الخفيف", enB: "calm for mild redness" }],
  [/salicylic|bha|ساليسيليك/i, { ar: "BHA", en: "BHA", arB: "مظهر مسام أنظف", enB: "a clearer look of pores" }],
  [/aha|glycolic|lactic|جليكوليك|لاكتيك/i, { ar: "AHA", en: "AHAs", arB: "سطح أنعم وأكثر تجديدًا", enB: "a smoother, renewed surface" }],
  [/spf|sunscreen|واقي\s*شمس|relief\s*sun/i, { ar: "حماية SPF", en: "SPF protection", arB: "درع نهاري أساسي", enB: "essential daytime defense" }],
  [/squalane|سكوالين/i, { ar: "سكوالين", en: "squalane", arB: "نعومة دون ثقل", enB: "softness without weight" }],
  [/tranexamic|txa/i, { ar: "ترانكساميك", en: "tranexamic acid", arB: "مظهر بقع أكثر هدوءًا", enB: "a quieter look of dark spots" }],
  [/shea|شيا/i, { ar: "زبدة الشيا", en: "shea butter", arB: "تغذية غنية وملمس مخملي", enB: "rich, velvet-soft nourishment" }],
  [/panthenol|بانثينول/i, { ar: "بانثينول", en: "panthenol", arB: "ترطيب مهدّئ", enB: "soothing moisture" }],
  [/tea\s*tree|شجرة\s*الشاي/i, { ar: "شجرة الشاي", en: "tea tree", arB: "إحساس نظافة منعش", enB: "a fresh, clean feel" }],
];

function ingsOf(p) {
  const s = `${p.nameAr || ""} ${p.nameEn || ""}`;
  const out = [];
  for (const [re, meta] of ING) if (re.test(s)) out.push(meta);
  return out;
}

function kindOf(p) {
  const n = `${p.nameAr || ""} ${p.nameEn || ""} ${p.cat || ""}`.toLowerCase();
  const rules = [
    [/mascara|ماسكارا/, "mascara"],
    [/lipstick|lip\s*oil|lip\s*plumper|lip\s*tint|lip\s*liner|lip\s*mask|lip\s*balm|شفاه|زيت\s*شفاه|قلم\s*شفاه|روج|مرطب\s*شفاه/, "lip"],
    [/blush|highlighter|contour|foundation|primer|concealer|setting|powder|فاونديشن|برايمر|كونسيلر|بلاش|هايلايتر|بودرة|كريم\s*أساس/, "face"],
    [/shampoo|conditioner|hair\s*serum|hair\s*oil|scalp|فروة|شامبو|سيروم\s*الشعر|شعر(?!\s*الحواجب)/, "hair"],
    [/mud\s*mask|clay\s*mask|mask\s*\+|sheet\s*mask|قناع/, "mask"],
    [/sunscreen|spf|واقي\s*شمس|relief\s*sun/, "spf"],
    [/cleansing\s*oil|oil\s*cleanser|غسول|cleanser|foam|wash|تنظيف|foam\s*cleanser/, "cleanser"],
    [/toner|تونر|pore\s*pad|\bpad\b|وسادة|مسحة/, "toner"],
    [/scrub|مقشر|exfoliat/, "scrub"],
    [/serum|سيروم|سيرم/, "serum"],
    [/cream|كريم|moisturizer|gel\s*cream|مرطب/, "cream"],
    [/lotion|body|لوشن|جسم/, "lotion"],
    [/balm|بلسم/, "balm"],
    [/ampoule|أمبول/, "ampoule"],
    [/brow|حاجب|حواجب/, "brow"],
    [/brush|فرشاة|beauty\s*tool|أداة/, "tool"],
  ];
  for (const [re, k] of rules) if (re.test(n)) return k;
  const catMap = { شعر: "hair", شفاه: "lip", عيون: "mascara", حواجب: "brow", وجه: "face", أدوات: "tool" };
  return catMap[p.cat] || "care";
}

/* —— banks: many variants so structure rarely repeats —— */
const FEEL_AR = {
  serum: ["خفيف وسريع الامتصاص", "مائي بلمسة حريرية", "يذوب على البشرة دون لزوجة"],
  cream: ["كريمي يغلّف بلطف", "غني لكن يتنفس", "مخملي على الخدود الجافة"],
  toner: ["مائي ومنعش كرشة ماء", "خفيف كأول طبقة", "يرطّب دون إثقال"],
  cleanser: ["ينظّف ويترك البشرة مرتاحة", "بدون شدّ مزعج بعد الشطف", "إحساس وجه « جديد » بهدوء"],
  mask: ["جلسة قصيرة بنتيجة أوضح", "راحة تُحسّ بعد الإزالة", "خطوة أسبوعية تُنعش الروتين"],
  spf: ["يحمي ويناسب المكياج فوقه", "نهاري لا يثقل", "درع يومي بملمس مريح"],
  lip: ["ناعم على الشفاه", "مريح للحديث والقهوة", "لون أو لمعان حسب الصيغة"],
  mascara: ["يمسك الرمش دون تكتل صاخب", "يفرّق ويطوّل أو يكتّف", "سهل الصباح وسهل المساء"],
  brow: ["يحدّد بشكل طبيعي", "يثبت اليوم العادي", "خطوط قصيرة تملأ الفراغ"],
  face: ["يندمج ولا يرسم قناعاً", "يبني التغطية بهدوء", "لمسة نهائية حسب اختيارك"],
  hair: ["يفهم الفروة والأطراف", "يسهّل التصفيف", "أنظف وأطرى مع الأسابيع"],
  tool: ["عملي للبيت", "يساعد على تطبيق أدق", "يُغسل بعد كل مرة"],
  lotion: ["يمتص بمعدل مريح للجسم", "يغطي مساحات أوسع", "نهاية ناعمة غير لزجة"],
  scrub: ["يلطّف السطح دون قسوة", "بشرة أنعم باللمس", "مرات قليلة في الأسبوع"],
  balm: ["يغلف الجفاف فوراً", "طبقة نجاة للمناطق العطشى", "غني ومطمئن"],
  ampoule: ["تركيز في قطرات", "كثافة ليلية غالباً", "يُقفل بمرطب"],
  care: ["متوازن ومباشر", "يكمل ما تستخدمينه", "مريح مع الانتظام"],
};
const FEEL_EN = {
  serum: ["light and quick to settle", "watery with a silk finish", "melts in without a sticky film"],
  cream: ["creamy wrap without a mask feel", "rich yet breathable", "velvet on dry cheeks"],
  toner: ["water-fresh like a soft splash", "a weightless first layer", "hydrates without bulk"],
  cleanser: ["cleans and leaves skin at ease", "no tight squeak after rinse", "a quiet ‘reset’ face"],
  mask: ["a short session, clearer after-feel", "comfort you notice after removal", "a weekly pause that renews the routine"],
  spf: ["protects and sits under makeup", "daytime without heaviness", "daily shield with a wearable finish"],
  lip: ["soft on contact", "comfortable through talk and coffee", "tint or shine by formula"],
  mascara: ["holds lashes without loud clumps", "separates, lengthens, or densifies", "easy morning, easy take-off"],
  brow: ["defines with a natural hand", "holds a normal day", "short strokes fill the gaps"],
  face: ["blends instead of masking", "builds coverage quietly", "finish is yours to choose"],
  hair: ["respects scalp and lengths", "makes styling simpler", "cleaner and softer over weeks"],
  tool: ["practical at home", "helps cleaner application", "rinse after every use"],
  lotion: ["absorbs at a body-friendly pace", "covers larger areas easily", "soft, non-tacky end"],
  scrub: ["buffs gently, never harsh", "skin feels smoother after", "only a few times a week"],
  balm: ["wraps dryness on contact", "a rescue layer for thirsty spots", "rich and reassuring"],
  ampoule: ["focus in a few drops", "often a night density step", "always seal with cream"],
  care: ["balanced and direct", "slots into what you already use", "comfortable with steady use"],
};

const SKIN_AR = {
  serum: ["معظم الأنواع — ابدئي بقطرات", "الدهنية والمختلطة", "الجافة والعطشى", "الحساسة بعد اختبار بسيط", "مع SPF يومي عند التفتيح"],
  cream: ["الجافة والمحتاجة", "المختلطة في الجو الجاف", "مساءً لمعظم الأنواع", "الحساسة الجافة"],
  toner: ["بعد كل غسول", "الحساسة", "الدهنية المنتعشة", "المتعطشة للماء"],
  cleanser: ["صباحاً ومساءً", "الدهنية والمختلطة", "بعد مكياج كخطوة أولى", "الحساسة بصيغة ألطف"],
  mask: ["١–٣ مرات أسبوعياً", "الطين للدهنية", "المرطّب للجافة", "الحساسة — راقبي الوقت"],
  spf: ["كل البشرة نهاراً", "تحت المكياج", "بعد العناية الصباحية"],
  lip: ["كل درجات الشفاه", "الشفاه الجافة", "يومياً بلا إزعاج"],
  mascara: ["كل الرموش", "عيون حساسة؟ اختبري", "يوم أو سهرة"],
  brow: ["كل درجات الحاجب", "تحديد يومي خفيف"],
  face: ["اختبري التطابق على الفك", "مختلطة إلى جافة", "مكياج يومي هادئ"],
  hair: ["حسب الشعر والفروة", "الشعر المجهد", "فروة تحتاج انتعاشاً"],
  tool: ["استخدام خارجي", "بشرة نظيفة", "ضغط لطيف فقط"],
  lotion: ["الجسم الجاف", "بعد الاستحمام", "معظم الأنواع"],
  scrub: ["مرة أو مرتين أسبوعياً", "ليس على تهيّج", "بعيداً عن ريتينول قوي بنفس الليلة"],
  balm: ["البقع الجافة", "كطبقة أخيرة", "الحساسة المحتاجة"],
  ampoule: ["غالباً ليلاً", "تدرّج أول أسبوع", "أغلقي بكريم"],
  care: ["معظم الأنواع", "أول أسبوع للمراقبة", "حسب احتياج يومك"],
};
const SKIN_EN = {
  serum: ["most types — start with drops", "oily and combination", "dry and thirsty", "sensitive after a patch test", "daily SPF when brightening"],
  cream: ["dry and needy", "combo in dry weather", "nights for most types", "sensitive dry skin"],
  toner: ["after every cleanse", "sensitive", "oily that wants a refresh", "water-thirsty skin"],
  cleanser: ["morning and night", "oily and combination", "after makeup as step one", "sensitive with a milder formula"],
  mask: ["1–3 times a week", "clay for oily", "hydrating for dry", "sensitive — watch the clock"],
  spf: ["all skin by day", "under makeup", "after morning care"],
  lip: ["all lip tones", "dry lips", "daily without fuss"],
  mascara: ["all lashes", "sensitive eyes? patch-test", "day or night looks"],
  brow: ["all brow tones", "soft daily shape"],
  face: ["swatch along the jaw", "combo to dry", "quiet everyday makeup"],
  hair: ["match hair and scalp", "stressed hair", "scalp that needs air"],
  tool: ["external use", "clean skin", "gentle pressure only"],
  lotion: ["dry body skin", "after shower", "most types"],
  scrub: ["1–2 times weekly", "not on irritation", "not with strong retinoid same night"],
  balm: ["dry patches", "as a last layer", "sensitive and needy"],
  ampoule: ["often at night", "ease in week one", "seal with cream"],
  care: ["most types", "watch week one", "match today’s need"],
};

function useFor(kind, lang, rng) {
  const AR = {
    serum: [
      "١) بشرة نظيفة، بعد التونر إن وُجد.\n٢) ٢–٣ قطرات — اضغطي من الوسط للخارج.\n٣) مرطب فوقه. صباحاً: SPF.\n٤) الريتينول/الأحماض: ليلاً وبالتدريج.",
      "١) وجه نظيف ورطب قليلاً.\n٢) نقطة على الخد والجبهة والذقن، ثم توزيع.\n٣) دقيقة صبر ثم الكريم.\n٤) محيط العين فقط إن صُمّم لذلك.",
      "١) بعد التنظيف.\n٢) طبقة خفيفة تكفي؛ لا تُغرقي.\n٣) أغلقي الترطيب.\n٤) إن لسع خفيفاً أول أيام، باعدي الاستخدام.",
    ],
    cream: [
      "١) بعد السيروم أو مباشرة بعد الغسول.\n٢) حبة بازيلاء للوجه + قليل للرقبة.\n٣) صباحاً SPF فوقه.\n٤) مساءً زيدي على الخدود الجافة.",
      "١) دفّئي الكمية بين الأصابع.\n٢) ربّتي حتى تختفي.\n٣) القليل اليومي أهدى من الكثير مرة واحدة.",
    ],
    toner: [
      "١) فوراً بعد الغسول.\n٢) راحة اليد أو القطنة — بلا سحب.\n٣) بدون شطف → سيروم → مرطب.",
      "١) بشرة نظيفة.\n٢) مرّري التونر/الوسادة.\n٣) إن كان مقشّراً: ليس بالضرورة يومياً.",
    ],
    cleanser: [
      "١) ماء فاتر.\n٢) ٢٠–٣٠ ثانية تدليك ثم شطف كامل.\n٣) تربيت للتجفيف.\n٤) مكياج ثقيل: زيتي أولاً ثم هذا.",
      "١) أول خطوة صباحًا ومساءً.\n٢) تجنّبي الماء المغلي.\n٣) إن شدّ الوجه، قصّري الوقت.",
    ],
    mask: [
      "١) بشرة نظيفة.\n٢) ١٠–٢٠ دقيقة (أو حسب العبوة).\n٣) إزالة أو تربيت الباقي + مرطب.\n٤) الطين/التقشير: ليس يومياً.",
      "١) ١–٣ مرات أسبوعياً.\n٢) ابتعدي عن الجروح.\n٣) أكملي روتينك بعد الجلسة.",
    ],
    spf: [
      "١) آخر عناية صباحية.\n٢) كمية إصبعين تقريباً للوجه والرقبة.\n٣) دقيقة قبل المكياج.\n٤) أعيدي في الشمس الطويلة.",
    ],
    lip: [
      "١) شفاه نظيفة.\n٢) من الوسط للخارج.\n٣) لمسة خلال اليوم.\n٤) ليلاً أغنى إن كان مرطباً.",
    ],
    mascara: [
      "١) من الجذر للطرف بتعرج خفيف.\n٢) طبقة ثانية بعد الجفاف.\n٣) مزيل لطيف مساءً.\n٤) لا تشاركي الفرشاة.",
    ],
    brow: [
      "١) مشط للشكل.\n٢) فراغات بخطوط قصيرة.\n٣) تثبيت إن لزم.\n٤) مسح الزائد بقطنة.",
    ],
    face: [
      "١) بشرة مرطّبة (+ SPF نهاراً).\n٢) كمية قليلة ووزّعي.\n٣) غطّي بطبقات خفيفة.\n٤) ثبّتي عند الحاجة.",
    ],
    hair: [
      "١) شامبو للفروة، بلسم للأطراف، سيروم حسب العبوة.\n٢) ابدئي بقليل.\n٣) لا تُشبعي الخصل.\n٤) أسبوعان–ثلاثة للفرق الأوضح.",
    ],
    tool: [
      "١) بشرة نظيفة.\n٢) حركة لطيفة.\n٣) اغسلي الأداة بعدين.\n٤) توقفي عند ألم أو احمرار ثابت.",
    ],
    lotion: [
      "١) بعد الحمام على بشرة نديّة.\n٢) من الأطراف للداخل.\n٣) ركّزي على الكوعين والساقين.\n٤) صباح أو مساء.",
    ],
    scrub: [
      "١) بشرة مبللة بعد الغسول.\n٢) دوائر ناعمة ثوانٍ.\n٣) شطف + ترطيب.\n٤) ١–٢× أسبوعياً فقط.",
    ],
    balm: [
      "١) على الجفاف أو آخر طبقة.\n٢) طبقة رقيقة.\n٣) أعيدي ليلاً.\n٤) بعيداً عن العين ما لم يُذكر.",
    ],
    ampoule: [
      "١) مساءً غالباً.\n٢) قطرات قليلة بالضغط.\n٣) كريم فوقها.\n٤) أول أسبوع: يوم بعد يوم.",
    ],
    care: [
      "١) نظّفي → عالجي → احمي.\n٢) كمية معتدلة.\n٣) راقبي الأسبوع الأول.\n٤) SPF مع التفتيح أو الأحماض.",
    ],
  };
  const EN = {
    serum: [
      "1) Clean skin; toner first if you use one.\n2) 2–3 drops — press from center out.\n3) Cream on top. AM: SPF.\n4) Retinoids/acids: night, slowly.",
      "1) Clean, slightly damp face.\n2) Dot cheeks, forehead, chin; spread.\n3) Wait a minute, then cream.\n4) Eye area only if the formula is made for it.",
    ],
    cream: [
      "1) After serum or right after cleanse.\n2) Pea-size for face + a little neck.\n3) SPF over it in the morning.\n4) Extra on dry cheeks at night.",
    ],
    toner: [
      "1) Right after cleansing.\n2) Palms or pad — no dragging.\n3) No rinse → serum → cream.",
    ],
    cleanser: [
      "1) Lukewarm water.\n2) 20–30 seconds, full rinse.\n3) Pat dry.\n4) Heavy makeup: oil first, then this.",
    ],
    mask: [
      "1) Clean skin.\n2) 10–20 minutes (or as labeled).\n3) Remove or pat in + cream.\n4) Clay/acids: not daily.",
    ],
    spf: [
      "1) Last morning step.\n2) About two fingers for face and neck.\n3) One minute before makeup.\n4) Reapply in long sun.",
    ],
    lip: [
      "1) Clean lips.\n2) Center to outer edge.\n3) Touch up through the day.\n4) Richer layer at night if balm/mask.",
    ],
    mascara: [
      "1) Root to tip, soft zigzag.\n2) Second coat after it sets.\n3) Gentle remover at night.\n4) Never share the wand.",
    ],
    brow: [
      "1) Brush into shape.\n2) Short strokes in gaps.\n3) Set if needed.\n4) Clean extras with a swab.",
    ],
    face: [
      "1) Moisturized skin (+ SPF by day).\n2) Start small and blend.\n3) Build in thin layers.\n4) Set for longer wear.",
    ],
    hair: [
      "1) Shampoo scalp, condition lengths, leave-in as labeled.\n2) Start small.\n3) Don’t drench the hair.\n4) Two–three weeks for a clearer change.",
    ],
    tool: [
      "1) Clean skin.\n2) Gentle motion.\n3) Wash the tool after.\n4) Stop if pain or lasting red.",
    ],
    lotion: [
      "1) After shower, skin still damp.\n2) Limbs toward center.\n3) Elbows and dry legs again.\n4) Morning or night.",
    ],
    scrub: [
      "1) Wet skin after cleanse.\n2) Soft circles, few seconds.\n3) Rinse + moisturize.\n4) Only 1–2× weekly.",
    ],
    balm: [
      "1) On dry spots or as last step.\n2) Thin layer.\n3) Again at night if needed.\n4) Away from eyes unless labeled.",
    ],
    ampoule: [
      "1) Often at night.\n2) Few drops, pressed in.\n3) Cream to seal.\n4) Week one: every other night.",
    ],
    care: [
      "1) Cleanse → treat → protect.\n2) Moderate amount.\n3) Watch week one.\n4) SPF with brightening or acids.",
    ],
  };
  const bank = (lang === "ar" ? AR : EN)[kind] || (lang === "ar" ? AR : EN).care;
  return pick(rng, bank);
}

/** Build a full description with rotating sentence architecture */
function buildDesc(p, kind, rng) {
  const brand = p.brand || "Naqa";
  const tAr = short(p.nameAr, 52);
  const tEn = short(p.nameEn, 56);
  const szA = sizeAr(p);
  const szE = sizeEn(p);
  const ing = ingsOf(p);
  const primary = ing.length ? pick(rng, ing) : null;
  const feelA = pick(rng, FEEL_AR[kind] || FEEL_AR.care);
  const feelE = pick(rng, FEEL_EN[kind] || FEEL_EN.care);
  const skA = pick(rng, SKIN_AR[kind] || SKIN_AR.care);
  const skE = pick(rng, SKIN_EN[kind] || SKIN_EN.care);
  const style = Math.floor(rng() * 7); // 0..6 different blueprints

  // Arabic blueprints
  let descAr, descEn;
  const sizeA = szA ? `الحجم ≈ ${szA}.` : "";
  const sizeE = szE ? `Size ≈ ${szE}.` : "";
  const tipA = pick(rng, [
    "انتظمي أسبوعين قبل الحكم النهائي.",
    "خزّنيها في مكان معتدل وأغلقي الغطاء.",
    "أي لسع مستمر؟ خفّفي أو راجعي مختصاً.",
    "الجمال الأهدأ يأتي من روتين قصير ثابت.",
  ]);
  const tipE = pick(rng, [
    "Give it two steady weeks before you decide.",
    "Keep it cool-ish and cap it tight.",
    "Ongoing sting? Ease off or ask a pro.",
    "Quiet beauty loves a short, steady routine.",
  ]);

  if (style === 0) {
    descAr = `${tAr} من ${brand}. ${feelA}${primary ? `، مع حضور ${primary.ar} لـ${primary.arB}` : ""}. ${sizeA} يناسب ${skA}. ${tipA}`;
    descEn = `${tEn} by ${brand}. ${cap(feelE)}${primary ? `, with ${primary.en} for ${primary.enB}` : ""}. ${sizeE} Suits ${skE}. ${tipE}`;
  } else if (style === 1) {
    descAr = `لماذا ${brand} هنا؟ لأن ${tAr} يقدّم خطوة واحدة واضحة: ${feelA}. ${primary ? `المكوّن الأبرز: ${primary.ar} (${primary.arB}).` : "بدون ضجيج وعود طويلة."} ${sizeA} لـ${skA}. ${tipA}`;
    descEn = `Why ${brand}? Because ${tEn} does one clear job: ${feelE}. ${primary ? `Standout: ${primary.en} (${primary.enB}).` : "No long promise list."} ${sizeE} For ${skE}. ${tipE}`;
  } else if (style === 2) {
    descAr = `رقيق في الإحساس، صادق في الدور — ${tAr}. علامة ${brand}${primary ? ` تعتمد لمسة ${primary.ar}` : ""}. ${feelA}. ${sizeA} يناسب ${skA}. ${tipA}`;
    descEn = `Soft to the touch, honest in role — ${tEn}. ${brand}${primary ? ` leans on ${primary.en}` : ""}. ${cap(feelE)}. ${sizeE} Best with ${skE}. ${tipE}`;
  } else if (style === 3) {
    descAr = `${brand} × عناية يومية: ${tAr}. ${primary ? `يُبرز ${primary.ar} من أجل ${primary.arB}.` : "يُركّز على راحة الاستخدام."} الملمس: ${feelA}. ${sizeA} ${skA}. ${tipA}`;
    descEn = `${brand} for daily care: ${tEn}. ${primary ? `It brings ${primary.en} for ${primary.enB}.` : "Comfort-first use."} Feel: ${feelE}. ${sizeE} ${cap(skE)}. ${tipE}`;
  } else if (style === 4) {
    descAr = `اختاري ${tAr} حين تريدين نتيجة بلا تعقيد. من ${brand}، ${feelA}${primary ? ` بفضل ${primary.ar}` : ""}. ${sizeA} مُخصص تقريباً لـ${skA}. ${tipA}`;
    descEn = `Reach for ${tEn} when you want results without a maze. From ${brand}, ${feelE}${primary ? ` thanks to ${primary.en}` : ""}. ${sizeE} Aimed at ${skE}. ${tipE}`;
  } else if (style === 5) {
    descAr = `${tAr}. قصة قصيرة: تنظيف/عناية/حماية حسب نوعه، و${brand} هنا لتسهيل اليوم. ${feelA}. ${primary ? `${primary.ar} → ${primary.arB}.` : ""} ${sizeA} ${skA}. ${tipA}`;
    descEn = `${tEn}. Short story: cleanse, treat, or protect as labeled — ${brand} keeps the day simple. ${cap(feelE)}. ${primary ? `${cap(primary.en)} → ${primary.enB}.` : ""} ${sizeE} ${cap(skE)}. ${tipE}`;
  } else {
    descAr = `لمسة ${brand} في ${tAr}: ${feelA}. ${primary ? `يُذكر فيه ${primary.ar} لدعم ${primary.arB}.` : "صيغة مباشرة تُحترم مع الوقت."} ${sizeA} يناسب ${skA}. ${tipA}`;
    descEn = `${brand}'s touch in ${tEn}: ${feelE}. ${primary ? `Notes of ${primary.en} support ${primary.enB}.` : "A direct formula that earns trust over time."} ${sizeE} Fits ${skE}. ${tipE}`;
  }

  descAr = descAr.replace(/\s+/g, " ").replace(/\s+\./g, ".").trim();
  descEn = descEn.replace(/\s+/g, " ").replace(/\s+\./g, ".").trim();
  return { descAr, descEn, skinAr: skA, skinEn: skE };
}

function buildCopy(p) {
  const rng = mulberry32((Number(p.id) * 2654435761) >>> 0 || 1);
  const kind = kindOf(p);
  const d = buildDesc(p, kind, rng);
  return {
    descAr: d.descAr,
    descEn: d.descEn,
    useAr: useFor(kind, "ar", rng),
    useEn: useFor(kind, "en", rng),
    skinAr: d.skinAr,
    skinEn: d.skinEn,
    kind,
  };
}

function main() {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".js") && f !== "TEMPLATE.js").sort();
  let total = 0;
  const kinds = {};
  const seenAr = new Set();
  const seenEn = new Set();
  let coll = 0;

  for (const file of files) {
    const full = path.join(DIR, file);
    const code = fs.readFileSync(full, "utf8");
    const fn = new Function("window", code + "\n;return window.NAQA_PRODUCTS;");
    const products = fn({ NAQA_PRODUCTS: [] });
    if (!products.length) continue;

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
      if (seenAr.has(c.descAr) || seenEn.has(c.descEn)) coll++;
      seenAr.add(c.descAr);
      seenEn.add(c.descEn);
    }

    const header = `/* Brand: ${products[0].brand} · ${products.length} products · edit AR/EN fields here */\n`;
    const body =
      "window.NAQA_PRODUCTS = window.NAQA_PRODUCTS || [];\nwindow.NAQA_PRODUCTS.push(\n" +
      products.map((p, i) => JSON.stringify(p, null, 2) + (i < products.length - 1 ? "," : "")).join("\n") +
      "\n);\n";
    fs.writeFileSync(full, header + body);
    console.log("OK", file, products.length);
  }

  console.log({ total, kinds, uniqueAr: seenAr.size, uniqueEn: seenEn.size, collisions: coll });
  execFileSync("node", [path.join(__dirname, "build-products-bundle.js")], { stdio: "inherit" });
}

main();
