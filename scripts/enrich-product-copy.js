#!/usr/bin/env node
/**
 * Naqa product copy engine — unique AR/EN desc + use
 * Reads data/brands/*.js, rewrites descAr/descEn/useAr/useEn/skinAr/skinEn
 * with varied, product-aware language (no copy-paste blocks).
 * Usage: node scripts/enrich-product-copy.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

const BRANDS = path.join(__dirname, "..", "data", "brands");

/* ---------- helpers ---------- */
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedFrom(p) {
  const s = String(p.id) + "|" + (p.sku || "") + "|" + (p.nameEn || "");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}
function sizeOf(name) {
  const m =
    String(name || "").match(
      /(\d+(?:\.\d+)?)\s*(مل|ml|ج|g|غ|pcs|قطعة|قطع|pads?|عبوة|×)/i
    ) || null;
  if (!m) return null;
  const n = m[1];
  const u = m[2].toLowerCase();
  if (/مل|ml/i.test(u)) return { ar: n + " مل", en: n + " ml" };
  if (/ج|g|غ/i.test(u)) return { ar: n + " ج", en: n + " g" };
  if (/pad/i.test(u)) return { ar: n + " قطعة", en: n + " pads" };
  if (/قطعة|قطع|pcs/i.test(u)) return { ar: n + " قطعة", en: n + " pcs" };
  if (/عبوة|×/i.test(u)) return { ar: n + " عبوة", en: n + " pack" };
  return { ar: n, en: n };
}
function shortName(p) {
  // drop brand prefix repetition for flow
  let ar = (p.nameAr || "").replace(/\s*-\s*\d+.*$/, "").trim();
  let en = (p.nameEn || "").replace(/\s*-\s*\d+.*$/, "").trim();
  // remove trailing size bits already captured
  ar = ar.replace(/\s*\d+\s*(مل|ج|غ|قطعة|قطع).*$/i, "").trim();
  en = en.replace(/\s*\d+\s*(ml|g|pcs|pads?).*$/i, "").trim();
  return { ar: ar || p.nameAr, en: en || p.nameEn };
}
function kind(p) {
  const cat = p.cat || "";
  // Category is source of truth for makeup / hair / tools
  if (cat === "شعر") return "hair";
  if (cat === "أدوات") return "tool";
  if (cat === "حواجب") return "brow";
  if (cat === "عيون") {
    const t0 = ((p.nameEn || "") + " " + (p.nameAr || "")).toLowerCase();
    if (/mascara|ماسكارا/.test(t0)) return "mascara";
    return "eye";
  }
  if (cat === "شفاه") {
    const t0 = ((p.nameEn || "") + " " + (p.nameAr || "")).toLowerCase();
    if (/sleep|ليلي|قناع الشفاه|lip\s*mask/.test(t0)) return "lipmask";
    return "lip";
  }
  if (cat === "وجه") return "face";

  const t = ((p.nameEn || "") + " " + (p.nameAr || "")).toLowerCase();
  const rules = [
    [/mascara|ماسكارا/, "mascara"],
    [/lip\s*sleep|sleeping\s*mask|قناع الشفاه|ليب ماسك/, "lipmask"],
    [/lipstick|lip\s*tint|lip\s*gloss|lip\s*oil|أحمر|ملمع|زيت شفاه|tint/, "lip"],
    [/brow|حاجب/, "brow"],
    [/eyeshadow|eyeliner|كحل|ظلال/, "eye"],
    [/blush|bronzer|contour|highlighter|foundation|concealer|primer|setting|cushion|bb\b|cc\b|بودرة|فاونديشن|كونسيلر|برايمر|بلاش/, "face"],
    [/spf|sunscreen|sun\s*cream|واقي شمس|واقي الشمس/, "spf"],
    [/cleanser|cleansing\s*oil|cleansing\s*foam|غسول|زيت تنظيف|رغوي/, "cleanser"],
    [/toner|تونر/, "toner"],
    [/\bpad\b|وسادة|باد/, "toner"],
    [/shampoo|conditioner|hair|scalp|شعر|فروة|شامبو/, "hair"],
    [/serum|ampoule|booster|shot|سيروم|أمبول/, "serum"],
    [/cream|balm|moisturizer|lotion|كريم|بلسم|مرطب|لوشن/, "cream"],
    [/mask|قناع/, "mask"],
    [/cleansing\s*oil|oil\s*cleanser/, "oil"],
    [/\boil\b|زيت /, "oil"],
    [/brush|tool|sponge|فرشاة|أداة|اسفنجة/, "tool"],
  ];
  for (const [re, k] of rules) if (re.test(t)) return k;
  return "care";
}
function actives(p) {
  const t = ((p.nameEn || "") + " " + (p.nameAr || "")).toLowerCase();
  const list = [];
  const table = [
    [/niacinamide|نياسين/, { ar: "نياسيناميد", en: "niacinamide", roleAr: "توحيد اللون ومظهر المسام", roleEn: "evening tone and the look of pores" }],
    [/retinol|retinal|retinoid|ريتين/, { ar: "ريتينويد", en: "a retinoid", roleAr: "ملمس أنعم ومظهر الخطوط الدقيقة", roleEn: "smoother texture and the look of fine lines" }],
    [/vitamin\s*c|vit\s*c|فيتامين\s*سي|vit c/, { ar: "فيتامين سي", en: "vitamin C", roleAr: "إشراقة ونضارة أوضح", roleEn: "a brighter, fresher look" }],
    [/hyaluron|هيالور/, { ar: "هيالورونيك", en: "hyaluronic acid", roleAr: "ترطيب خفيف يدوم", roleEn: "lightweight lasting moisture" }],
    [/centella|cica|سنتيلا|سيكا/, { ar: "سنتيلا", en: "centella", roleAr: "تهدئة الاحمرار والراحة", roleEn: "calming redness and comfort" }],
    [/peptide|ببتيد|pdrn/, { ar: "ببتيدات", en: "peptides", roleAr: "مرونة ومظهر أكثر امتلاءً", roleEn: "a firmer, bouncier feel" }],
    [/ceramide|سيراميد/, { ar: "سيراميدات", en: "ceramides", roleAr: "دعم حاجز البشرة", roleEn: "supporting the skin barrier" }],
    [/squalane|سكوال/, { ar: "سكوالين", en: "squalane", roleAr: "ترطيب ناعم دون ثقل", roleEn: "soft moisture without heaviness" }],
    [/salicylic|bha|ساليس/, { ar: "BHA", en: "BHA", roleAr: "تنقية مظهر المسام", roleEn: "a cleaner look of pores" }],
    [/aha|glycolic|lactic|أحماض/, { ar: "أحماض لطيفة", en: "gentle acids", roleAr: "تجديد الملمس", roleEn: "refining texture" }],
    [/collagen|كولاج/, { ar: "كولاجين", en: "collagen care", roleAr: "إحساس امتلاء ومرونة", roleEn: "a plump, elastic feel" }],
    [/spf|pa\+/, { ar: "حماية شمسية", en: "sun filters", roleAr: "حماية يومية من الأشعة", roleEn: "everyday UV protection" }],
    [/tea\s*tree|شجرة الشاي/, { ar: "شجرة الشاي", en: "tea tree", roleAr: "إحساس نظافة وانتعاش", roleEn: "a clean, fresh feel" }],
    [/rice|أرز/, { ar: "مستخلص الأرز", en: "rice extract", roleAr: "نعومة وإشراقة هادئة", roleEn: "softness and quiet glow" }],
    [/snail|حلزون/, { ar: "مستخلص الحلزون", en: "snail filtrate", roleAr: "ترطيب وإصلاح المظهر", roleEn: "moisture and a repaired look" }],
    [/tranexamic|txa/, { ar: "ترانيكساميك", en: "tranexamic acid", roleAr: "مظهر بقع أهدأ", roleEn: "a calmer look of dark spots" }],
  ];
  for (const [re, info] of table) {
    if (re.test(t)) list.push(info);
  }
  return list.slice(0, 2);
}
function finishFeel(kindKey, rng) {
  const ar = {
    serum: ["قوام خفيف يسري بسرعة", "ملمس مائي يختفي دون لزوجة", "طبقة رقيقة لا تثقل المكياج"],
    cream: ["قوام كريمي يريح الجفاف", "ملمس غني دون شعور دهني مزعج", "يغلق الترطيب بنعومة"],
    toner: ["ملمس منعش بعد الغسول", "خفة تهيّئ البشرة للخطوة التالية", "إحساس نظافة دون شد"],
    cleanser: ["رغوة أو زيت يزيل الأوساخ بلطف", "يغسل دون أن يترك البشرة مشدودة", "ينظّف ويحافظ على الراحة"],
    mask: ["يُترك دقائق ثم يُزال أو يُمتص", "وقت قصير لنتيجة أوضح", "خطوة أسبوعية تُعيد الانتعاش"],
    spf: ["طبقة حماية يومية فوق العناية", "يندمج قبل المكياج", "ملمس يومي لا يثقل"],
    lip: ["ملمس ناعم على الشفاه", "لون أو لمعان حسب النوع", "راحة تدوم مع الحركة"],
    lipmask: ["طبقة ليلية تغذي الشفاه", "يستيقظ الفم أنعم", "مرطب مركّز لوقت النوم"],
    mascara: ["فرشاة ترفع الرموش طبقة بطبقة", "كثافة أو طول دون تكتل واضح", "ثبات مريح طوال اليوم"],
    brow: ["تحديد خفيف يبدو طبيعي", "يملأ الفراغات برفق", "ثبات مع مظهر ناعم"],
    eye: ["لون يثبّت على الجفن", "سهولة دمج يومية", "لمسة تُكمل الإطلالة"],
    face: ["تغطية أو لمسة حسب المنتج", "يندمج مع البشرة بهدوء", "قاعدة مريحة للمكياج"],
    hair: ["يعتني بالشعر أو الفروة بوضوح", "يوزَّع بكمية قليلة", "نتيجة أوضح مع الانتظام"],
    oil: ["زيت يذوّب المكياج والشوائب", "دلالك قصير ثم شطف أو مسح", "يحافظ على نعومة الحاجز"],
    tool: ["أداة عملية للاستخدام اليومي", "تساعد على توزيع أدق", "سهلة التنظيف بعد الاستعمال"],
    care: ["ملمس مريح للاستخدام اليومي", "خطوة واضحة داخل الروتين", "نتيجة تُبنى مع الانتظام"],
  };
  const en = {
    serum: ["a light texture that absorbs fast", "a watery finish with no stickiness", "a thin layer that sits well under makeup"],
    cream: ["a creamy texture that comforts dry skin", "rich feel without heavy grease", "seals moisture softly"],
    toner: ["a fresh feel right after cleansing", "preps skin for the next step", "clean comfort without tightness"],
    cleanser: ["cleans without stripping comfort", "lifts dirt gently", "rinses clean and kind"],
    mask: ["leave on for a short time, then remove or pat in", "a weekly pause that refreshes", "focused minutes, clearer feel"],
    spf: ["daily protection over your routine", "layers smoothly before makeup", "daytime wear that stays light"],
    lip: ["soft on contact", "color or shine depending on the formula", "comfortable through the day"],
    lipmask: ["an overnight layer for softer lips", "wakes up smoother", "rich care for sleep time"],
    mascara: ["builds length or density with the brush", "less clumping when layered patiently", "holds a clean look through the day"],
    brow: ["soft definition that still looks natural", "fills gaps lightly", "stays put without harsh edges"],
    eye: ["color that blends for everyday wear", "easy to work with on the lid", "finishes the look without fuss"],
    face: ["coverage or a sheer wash depending on the product", "blends into skin calmly", "a comfortable base for makeup"],
    hair: ["clear role on hair or scalp", "a little product goes far", "results show with steady use"],
    oil: ["melts makeup and residue", "short massage, then rinse or wipe", "keeps the barrier comfortable"],
    tool: ["a practical everyday tool", "helps more precise application", "easy to clean after use"],
    care: ["comfortable daily texture", "one clear step in the routine", "results that build with use"],
  };
  return { ar: pick(rng, ar[kindKey] || ar.care), en: pick(rng, en[kindKey] || en.care) };
}

/* ---------- skin copy (tighter, less template) ---------- */
function skinCopy(p, kindKey, rng) {
  const rawAr = p.skinAr || "";
  const rawEn = p.skinEn || "";
  // prefer regenerating from signals in name/cat
  const t = ((p.nameEn || "") + " " + (p.nameAr || "")).toLowerCase();
  if (kindKey === "spf")
    return { ar: "كل أنواع البشرة — أعدي التطبيق عند التعرّض الطويل", en: "All skin types — reapply in prolonged sun" };
  if (kindKey === "mascara" || kindKey === "brow" || kindKey === "eye" || kindKey === "face" || kindKey === "lip" || kindKey === "lipmask")
    return { ar: "كل درجات البشرة — اختبري عند الحساسية", en: "All skin tones — patch-test if sensitive" };
  if (kindKey === "hair")
    return { ar: "حسب نوع الشعر والفروة — ابدئي بكمية قليلة", en: "According to hair and scalp — start small" };
  if (kindKey === "tool")
    return { ar: "للاستخدام اليومي مع تنظيف الأداة", en: "Daily use — clean the tool after" };
  if (/sensitive|حساس/.test(t) || /حساس/.test(rawAr))
    return { ar: "البشرة الحساسة — اختبري على الرقبة أولاً", en: "Sensitive skin — patch-test first" };
  if (/oily|acne|pore|مسام|دهن|رؤوس/.test(t) || /دهن|مسام/.test(rawAr))
    return { ar: "البشرة الدهنية والمختلطة", en: "Oily and combination skin" };
  if (/dry|dehydr|جاف|عطش/.test(t) || /جاف/.test(rawAr))
    return { ar: "البشرة الجافة والمحتاجة", en: "Dry and dehydrated skin" };
  if (/bright|spot|dark|niacin|vit.*c|تفتيح|بقع|نياسين|فيتامين/.test(t))
    return { ar: "معظم الأنواع — مع واقي شمس يومي", en: "Most types — with daily SPF" };
  if (/retinol|retinal|ريتين/.test(t))
    return { ar: "معظم الأنواع مساءً — تدريجياً ومع SPF صباحاً", en: "Most types at night — introduce slowly, SPF by day" };
  return pick(rng, [
    { ar: "معظم أنواع البشرة", en: "Most skin types" },
    { ar: "معظم الأنواع — راقبي أول أسبوع", en: "Most skin types — watch the first week" },
    { ar: "للبشرة التي تريد خطوة واضحة وبسيطة", en: "For skin that wants one clear, simple step" },
  ]);
}

/* ---------- description ---------- */
function buildDesc(p, rng) {
  const k = kind(p);
  const sn = shortName(p);
  const brand = p.brand || "";
  const sz = sizeOf(p.nameAr) || sizeOf(p.nameEn);
  const acts = actives(p);
  const feel = finishFeel(k, rng);
  const skin = skinCopy(p, k, rng);

  // openings — many variants so they rarely match
  const openAr = [
    () => `${sn.ar} من ${brand}: خطوة واضحة، ملمس مريح، ونتيجة تُبنى بهدوء.`,
    () => `اختيار ${brand} — ${sn.ar}. صُمّم لروتين قصير يناسب يومك دون تعقيد.`,
    () => `${sn.ar}… من ${brand}. يمنحك إحساساً نظيفاً ونتيجة تُلاحظ مع الانتظام.`,
    () => `من رفوف ${brand}: ${sn.ar}. توازن بين نعومة الاستخدام ووضوح الهدف.`,
    () => `${brand} تقدّم ${sn.ar} كخطوة يومية لطيفة لا تُثقل البشرة.`,
    () => `عناية مركّزة في ${sn.ar} (${brand}) — بسيطة في اليد، واضحة في النتيجة.`,
    () => `إذا أردتِ ${roleHintAr(k)} دون روتين طويل: ${sn.ar} من ${brand}.`,
    () => `${sn.ar} — لمسة ${brand} بهدوء واحتراف خفيف يناسب الاستخدام اليومي.`,
  ];
  const openEn = [
    () => `${sn.en} by ${brand}: a clear step, a comfortable feel, and results that build quietly.`,
    () => `From ${brand} — ${sn.en}. Made for a short routine that fits a real day.`,
    () => `${sn.en} from ${brand}. Clean on the skin, clearer with steady use.`,
    () => `A ${brand} pick: ${sn.en}. Soft to use, honest about what it does.`,
    () => `${brand} keeps ${sn.en} simple — one job done well.`,
    () => `Focused care in ${sn.en} (${brand}) — easy in the hand, clear in the result.`,
    () => `When you want ${roleHintEn(k)} without a long routine: ${sn.en} by ${brand}.`,
    () => `${sn.en} — a calm ${brand} finish for everyday wear.`,
  ];

  const openI = Math.floor(rng() * openAr.length);
  let ar = openAr[openI]();
  let en = openEn[openI]();

  // active sentence
  if (acts.length) {
    const a = acts[0];
    const midAr = [
      `يبرز فيه ${a.ar} لدعم ${a.roleAr}.`,
      `التركيبة تراهن على ${a.ar} من أجل ${a.roleAr}.`,
      `محوره ${a.ar}: يخدم ${a.roleAr} بلطف مع الاستخدام المنتظم.`,
    ];
    const midEn = [
      `It leans on ${a.en} to support ${a.roleEn}.`,
      `The formula centers ${a.en} for ${a.roleEn}.`,
      `Built around ${a.en} — helping ${a.roleEn} with steady use.`,
    ];
    const mi = Math.floor(rng() * midAr.length);
    ar += " " + midAr[mi];
    en += " " + midEn[mi];
    if (acts[1]) {
      ar += ` ويُكمَّل بـ ${acts[1].ar}.`;
      en += ` Paired with ${acts[1].en}.`;
    }
  } else {
    const midAr = [
      "صيغة عملية تُنجز مهمة واحدة بوضوح.",
      "بلا وعود مبالغ فيها — فقط خطوة تُشعرين بها.",
      "مصمّم ليكون جزءاً ثابتاً من روتين أقصر.",
    ];
    const midEn = [
      "A practical formula with one clear job.",
      "No long list of empty claims — just a step you feel.",
      "Made to stay in a shorter, steadier routine.",
    ];
    const mi = Math.floor(rng() * midAr.length);
    ar += " " + midAr[mi];
    en += " " + midEn[mi];
  }

  // feel + size + skin
  ar += " " + feel.ar + ".";
  en += " " + capitalize(feel.en) + ".";
  if (sz) {
    ar += ` الحجم تقريباً ${sz.ar}.`;
    en += ` About ${sz.en}.`;
  }
  ar += ` يناسب: ${skin.ar}.`;
  en += ` Best for: ${skin.en}.`;

  // closing tip — varies
  const tipAr = [
    "خزّنيه بعيداً عن الحرارة وأغلقي الغطاء جيداً.",
    "إن ظهر تهيّج، خفّفي الاستخدام وراجعي مختصاً عند اللزوم.",
    "النتيجة أوضح مع الانتظام وواقي الشمس عند الحاجة.",
    "ابدئي بكمية قليلة ثم زيدِي حسب تحمّل بشرتك.",
  ];
  const tipEn = [
    "Store away from heat and keep the cap closed.",
    "If irritation appears, ease off and see a specialist if it lasts.",
    "Results look better with steady use — and SPF when needed.",
    "Start with a small amount, then adjust to what your skin likes.",
  ];
  const makeup = ["mascara", "brow", "eye", "face", "lip", "lipmask", "tool"].includes(k);
  const tipArM = [
    "خزّنيه قائماً وأغلقي الغطاء جيداً.",
    "أزيليه بلطف في نهاية اليوم.",
    "لا تشاركِي الفرشاة أو الإسفنجة مع آخرين.",
    "جرّبي كمية قليلة أولاً لتضبطي الكثافة.",
  ];
  const tipEnM = [
    "Store upright and keep the cap closed.",
    "Remove gently at the end of the day.",
    "Do not share wands or sponges.",
    "Start with a little to control intensity.",
  ];
  const tipArH = [
    "ابدئي بكمية قليلة ثم زيدِي حسب احتياج الشعر.",
    "تجنّبي ملامسة العينين.",
    "خزّنيه بعيداً عن الحرارة.",
    "الانتظام أوضح من الإفراط دفعة واحدة.",
  ];
  const tipEnH = [
    "Start with a little, then adjust to the hair.",
    "Keep away from the eyes.",
    "Store away from heat.",
    "Steady use beats overloading once.",
  ];
  if (makeup) {
    const ti = Math.floor(rng() * tipArM.length);
    ar += " " + tipArM[ti];
    en += " " + tipEnM[ti];
  } else if (k === "hair") {
    const ti = Math.floor(rng() * tipArH.length);
    ar += " " + tipArH[ti];
    en += " " + tipEnH[ti];
  } else {
    const ti = Math.floor(rng() * tipAr.length);
    ar += " " + tipAr[ti];
    en += " " + tipEn[ti];
  }

  return { descAr: ar, descEn: en, skinAr: skin.ar, skinEn: skin.en, kind: k };
}

function roleHintAr(k) {
  return (
    {
      serum: "تركيزاً سريعاً",
      cream: "ترطيب يختم اليوم",
      toner: "انتعاشاً بعد الغسول",
      cleanser: "نظافة لطيفة",
      mask: "استراحة أسبوعية",
      spf: "حماية صباحية",
      lip: "لمسة شفاه",
      lipmask: "ترطيب ليلي للشفاه",
      mascara: "رموشاً أوضح",
      brow: "حواجب مرتّبة",
      eye: "لمسة عين",
      face: "بشرة متساوية",
      hair: "شعراً أو فروة منتعشة",
      oil: "تنظيف عميق خفيف",
      tool: "تطبيقاً أدق",
      care: "عناية بسيطة",
    }[k] || "عناية بسيطة"
  );
}
function roleHintEn(k) {
  return (
    {
      serum: "a quick focused step",
      cream: "moisture that seals the day",
      toner: "a fresh post-cleanse feel",
      cleanser: "a gentle clean",
      mask: "a weekly reset",
      spf: "morning protection",
      lip: "a lip finish",
      lipmask: "overnight lip care",
      mascara: "clearer lashes",
      brow: "tidy brows",
      eye: "an eye touch",
      face: "even-looking skin",
      hair: "fresher hair or scalp",
      oil: "a light deep clean",
      tool: "more precise application",
      care: "simple care",
    }[k] || "simple care"
  );
}
function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---------- usage steps ---------- */
function buildUse(p, kindKey, rng) {
  const sets = {
    serum: {
      ar: [
        ["١) على بشرة نظيفة بعد التونر (إن وُجد).", "٢) قطرتان إلى ثلاث — اضغطي على الوجه والرقبة.", "٣) انتظري ثوانٍ ثم المرطب.", "٤) صباحاً: واقي شمس فوق الروتين."],
        ["١) نظّفي واتركي البشرة رطبة قليلاً.", "٢) وزّعي السيروم من الوسط للخارج دون فرك قوي.", "٣) أغلقي بمرطب.", "٤) ريتينول/أحماض أخرى: ليلاً وبالتدريج."],
        ["١) بعد التنظيف والتونر.", "٢) طبقة رقيقة تكفي؛ لا تُغرقي البشرة.", "٣) دعيه يمتص قبل المكياج أو المرطب.", "٤) راقبي أول أسبوع إن كانت بشرتك حساسة."],
      ],
      en: [
        ["1) On clean skin after toner (if you use one).", "2) Press 2–3 drops on face and neck.", "3) Wait a few seconds, then moisturize.", "4) Morning: SPF over the routine."],
        ["1) Cleanse and leave skin slightly damp.", "2) Spread from the center out — no harsh rubbing.", "3) Seal with moisturizer.", "4) Retinoids/acids: night only, introduce slowly."],
        ["1) After cleanse and toner.", "2) A thin layer is enough — do not flood the skin.", "3) Let it settle before cream or makeup.", "4) Watch the first week if you are sensitive."],
      ],
    },
    cream: {
      ar: [
        ["١) بعد السيروم (أو بعد الغسول مباشرة).", "٢) كمية بحجم حبة البازلاء للوجه.", "٣) وزّعي حتى الامتصاص بما فيها الرقبة.", "٤) صباحاً أكملي بواقي شمس."],
        ["١) على بشرة نظيفة.", "٢) دفّئي الكريم بين الأصابع ثم ربّتي.", "٣) زيدِي على الخدود الجافة ليلاً.", "٤) تجنّبي محيط العين إلا إذا كان مخصّصاً."],
      ],
      en: [
        ["1) After serum (or right after cleansing).", "2) Pea-sized amount for the face.", "3) Smooth in, including the neck.", "4) Morning: finish with SPF."],
        ["1) On clean skin.", "2) Warm between fingers, then press in.", "3) Extra on dry cheeks at night if needed.", "4) Avoid the eye area unless the product is meant for it."],
      ],
    },
    toner: {
      ar: [
        ["١) بعد الغسول مباشرة.", "٢) على الراحة أو القطنة — بدون سحب البشرة.", "٣) لا تشطفي.", "٤) أكملي بسيروم ثم مرطب."],
        ["١) بشرة نظيفة.", "٢) مرّري التونر بلطف على الوجه.", "٣) تجنّبي محيط العين.", "٤) انتظري ثوانٍ قبل الخطوة التالية."],
      ],
      en: [
        ["1) Right after cleansing.", "2) In palms or on a pad — do not drag the skin.", "3) Do not rinse.", "4) Follow with serum, then cream."],
        ["1) Clean skin.", "2) Sweep gently over the face.", "3) Avoid the eye area.", "4) Wait a few seconds before the next step."],
      ],
    },
    cleanser: {
      ar: [
        ["١) بلّلي الوجه بماء فاتر.", "٢) دلكي ٢٠–٣٠ ثانية ثم اشطفي جيداً.", "٣) جفّفي بالتربيت.", "٤) التنظيف المزدوج: الزيتي أولاً ثم هذا."],
        ["١) كمية صغيرة على بشرة رطبة.", "٢) ركّزي على منطقة T بلطف.", "٣) اشطفي حتى زوال الرغوة.", "٤) أكملي بتونر أو مرطب فوراً."],
      ],
      en: [
        ["1) Wet the face with lukewarm water.", "2) Massage 20–30 seconds, rinse well.", "3) Pat dry.", "4) Double cleanse: oil first, then this."],
        ["1) A small amount on damp skin.", "2) Focus gently on the T-zone.", "3) Rinse until no foam remains.", "4) Follow with toner or cream right away."],
      ],
    },
    mask: {
      ar: [
        ["١) على بشرة نظيفة.", "٢) طبّقي طبقة متساوية وتجنّبي العينين.", "٣) اتركيه ١٠–٢٠ دقيقة (أو حسب العبوة).", "٤) أزيلي أو ربّتي الباقي ثم مرطّبي."],
        ["١) مرة إلى ثلاث أسبوعياً.", "٢) لا تستخدميه يومياً إن كان تقشيرياً.", "٣) إن لذع، اشطفي فوراً.", "٤) أكملي بروتين هادئ بعدها."],
      ],
      en: [
        ["1) On clean skin.", "2) Even layer — avoid the eyes.", "3) Leave 10–20 minutes (or as labeled).", "4) Remove or pat in, then moisturize."],
        ["1) One to three times a week.", "2) Skip daily use if it exfoliates.", "3) If it stings, rinse off.", "4) Follow with a calm routine."],
      ],
    },
    spf: {
      ar: [
        ["١) آخر خطوة عناية صباحاً.", "٢) كمية تغطي الوجه والرقبة (حوالي إصبعين).", "٣) انتظري دقيقة قبل المكياج.", "٤) أعيدي عند التعرّض الطويل للشمس."],
      ],
      en: [
        ["1) Last morning skincare step.", "2) Enough for face and neck (about two fingers).", "3) Wait a minute before makeup.", "4) Reapply in prolonged sun."],
      ],
    },
    lip: {
      ar: [
        ["١) شفاه نظيفة وجافة.", "٢) طبّقي من الوسط للخارج.", "٣) أعيدي خلال اليوم حسب الحاجة.", "٤) ليلاً: مرطب أغنى إن رغبتِ."],
        ["١) حدّدي الخط إن احتجتِ.", "٢) املئي اللون بطبقة خفيفة.", "٣) ادمجي الحدود بإصبع نظيف.", "٤) ثبّتي بمنديل إن كان لامعاً جداً."],
      ],
      en: [
        ["1) Clean, dry lips.", "2) Apply from the center outward.", "3) Reapply through the day as needed.", "4) At night: a richer balm if you like."],
        ["1) Line if you need definition.", "2) Fill with a light layer.", "3) Soften edges with a clean finger.", "4) Blot if the shine feels heavy."],
      ],
    },
    lipmask: {
      ar: [
        ["١) شفاه نظيفة قبل النوم.", "٢) طبقة متوسطة على الشفاه.", "٣) اتركيه طوال الليل.", "٤) صباحاً: امسحي الزائد بلطف."],
      ],
      en: [
        ["1) Clean lips before bed.", "2) A medium layer over the lips.", "3) Leave on overnight.", "4) Morning: gently wipe any excess."],
      ],
    },
    mascara: {
      ar: [
        ["١) من الجذور للأطراف بحركة متعرجة خفيفة.", "٢) طبقة ثانية بعد جفاف الأولى.", "٣) أزيلي بمزيل لطيف مساءً.", "٤) لا تشاركي الفرشاة مع آخرين."],
      ],
      en: [
        ["1) Roots to tips in a light zigzag.", "2) Second coat after the first dries.", "3) Remove with a gentle remover at night.", "4) Do not share the wand."],
      ],
    },
    brow: {
      ar: [
        ["١) مشّطي الحاجب للأعلى.", "٢) املئي الفراغات بخطوط قصيرة خفيفة.", "٣) ثبّتي بجل إن وُجد.", "٤) امسحي الزائد بقطنة نظيفة."],
      ],
      en: [
        ["1) Brush brows upward.", "2) Fill gaps with short, light strokes.", "3) Set with gel if you have it.", "4) Clean excess with a clean cotton bud."],
      ],
    },
    eye: {
      ar: [
        ["١) جفن نظيف وجاف.", "٢) ادمجي اللون من الرموش للأعلى.", "٣) ثبّتي ببودرة خفيفة إن لزم.", "٤) أزيلي بلطف مساءً."],
      ],
      en: [
        ["1) Clean, dry lids.", "2) Blend color from the lash line up.", "3) Set with a light powder if needed.", "4) Remove gently at night."],
      ],
    },
    face: {
      ar: [
        ["١) على بشرة منظّفة ومرطّبة (وواقي شمس نهاراً).", "٢) كمية قليلة ووزّعي جيداً.", "٣) ابنِي التغطية طبقات.", "٤) ثبّتي حسب روتينك."],
        ["١) برايمر أو مرطب خفيف أولاً.", "٢) نقطة صغيرة وادمجي بالأسفنجة أو الفرشاة.", "٣) ركّزي على الوسط ثم الخارج.", "٤) لا تُكثري دفعة واحدة."],
      ],
      en: [
        ["1) On clean, moisturized skin (and SPF by day).", "2) Start with a little and blend well.", "3) Build coverage in thin layers.", "4) Set as your routine needs."],
        ["1) Primer or light cream first.", "2) A small dot — blend with sponge or brush.", "3) Center of the face outward.", "4) Do not pile product in one go."],
      ],
    },
    hair: {
      ar: [
        ["١) حسب النوع: شامبو على الفروة، بلسم على الأطراف، سيروم بدون شطف حيث يُستخدم.", "٢) ابدئي بكمية قليلة.", "٣) لا تُغرقي الشعر.", "٤) انتظمي ٢–٣ أسابيع لملاحظة أوضح."],
        ["١) شعر مبلل أو فروة نظيفة حسب المنتج.", "٢) وزّعي ثم دلّكي بلطف.", "٣) اشطفي إن طُلب، أو اتركيه إن كان بدون شطف.", "٤) تجنّبي العينين."],
      ],
      en: [
        ["1) As labeled: shampoo on scalp, conditioner on lengths, leave-in where it belongs.", "2) Start with a small amount.", "3) Do not overload the hair.", "4) Give it 2–3 weeks for a clearer change."],
        ["1) Wet hair or clean scalp as the product requires.", "2) Distribute, then massage gently.", "3) Rinse if asked — or leave in if it is leave-in.", "4) Keep away from the eyes."],
      ],
    },
    oil: {
      ar: [
        ["١) على بشرة جافة أولاً إن كان زيت تنظيف.", "٢) دلكي دقيقة لإذابة المكياج.", "٣) بللِي اليدين قليلاً ثم اشطفي أو امسحي.", "٤) أكملي بغسول مائي إن لزم."],
      ],
      en: [
        ["1) On dry skin first if it is a cleansing oil.", "2) Massage a minute to melt makeup.", "3) Add a little water, then rinse or wipe.", "4) Follow with a water cleanser if you double cleanse."],
      ],
    },
    tool: {
      ar: [
        ["١) نظّفي الأداة قبل وبعد الاستخدام.", "٢) استخدميها بضغط خفيف.", "٣) لا تشاركيها إن لامست السوائل.", "٤) جفّفيها جيداً قبل التخزين."],
      ],
      en: [
        ["1) Clean the tool before and after use.", "2) Use light pressure only.", "3) Do not share if it touches liquids.", "4) Dry fully before storing."],
      ],
    },
    care: {
      ar: [
        ["١) اتبّعي: تنظيف → عناية → حماية.", "٢) كمية معتدلة أفضل من الإفراط.", "٣) راقبي التهيّج أول أسبوع.", "٤) أوقفي عند اللذع المستمر."],
      ],
      en: [
        ["1) Follow: cleanse → treat → protect.", "2) Moderate amount beats overdoing it.", "3) Watch for irritation the first week.", "4) Stop if stinging continues."],
      ],
    },
  };

  const pack = sets[kindKey] || sets.care;
  const i = Math.floor(rng() * pack.ar.length);
  const arSteps = pack.ar[i].slice();
  const enSteps = pack.en[i].slice();
  // personal closing line so identical packs still differ per product
  const brand = p.brand || "Naqa";
  const extrasAr = [
    "٥) منتج " + brand + ": التزمي بكمية معتدلة وكرّري حسب العبوة.",
    "٥) احفظي " + brand + " في مكان جاف بعيداً عن الشمس.",
    "٥) إن تغيّر لون/رائحة المنتج، توقّفي عن الاستخدام.",
    "٥) راجعي تاريخ الانتهاء على العبوة قبل الفتح.",
  ];
  const extrasEn = [
    "5) " + brand + " tip: stay moderate and follow the pack.",
    "5) Keep " + brand + " dry and away from direct sun.",
    "5) Stop if color or smell changes.",
    "5) Check the expiry on the pack before opening.",
  ];
  const ei = Math.floor(rng() * extrasAr.length);
  arSteps.push(extrasAr[ei]);
  enSteps.push(extrasEn[ei]);
  return {
    useAr: arSteps.join("\n"),
    useEn: enSteps.join("\n"),
  };
}

/* ---------- apply to one product ---------- */
function enrich(p) {
  const rng = mulberry32(seedFrom(p));
  const d = buildDesc(p, rng);
  const u = buildUse(p, d.kind, rng);
  return Object.assign({}, p, {
    descAr: d.descAr,
    descEn: d.descEn,
    useAr: u.useAr,
    useEn: u.useEn,
    skinAr: d.skinAr,
    skinEn: d.skinEn,
  });
}

/* ---------- rewrite brand files ---------- */
function loadBrandFile(file) {
  const code = fs.readFileSync(file, "utf8");
  const window = { NAQA_PRODUCTS: [] };
  // isolate
  // eslint-disable-next-line no-new-func
  const fn = new Function("window", code + "\nreturn window.NAQA_PRODUCTS;");
  const list = fn(window);
  return list;
}

function writeBrandFile(file, brandName, products) {
  const header = `/* Brand: ${brandName} · ${products.length} products · edit AR/EN fields here */\n`;
  const body =
    "window.NAQA_PRODUCTS = window.NAQA_PRODUCTS || [];\n" +
    "window.NAQA_PRODUCTS.push(\n" +
    products
      .map((p) => JSON.stringify(p, null, 2))
      .join(",\n") +
    "\n);\n";
  fs.writeFileSync(file, header + body, "utf8");
}

function main() {
  const files = fs
    .readdirSync(BRANDS)
    .filter((f) => f.endsWith(".js") && f !== "TEMPLATE.js")
    .sort();

  let total = 0;
  const all = [];
  for (const f of files) {
    const fp = path.join(BRANDS, f);
    const list = loadBrandFile(fp);
    const brand = list[0] && list[0].brand ? list[0].brand : f.replace(/\.js$/, "");
    const next = list.map(enrich);
    writeBrandFile(fp, brand, next);
    total += next.length;
    all.push(...next);
  }

  // uniqueness stats
  const descAr = new Set(all.map((p) => p.descAr));
  const descEn = new Set(all.map((p) => p.descEn));
  const useAr = new Set(all.map((p) => p.useAr));
  const useEn = new Set(all.map((p) => p.useEn));
  console.log("enriched", total);
  console.log("unique descAr", descAr.size, "descEn", descEn.size);
  console.log("unique useAr", useAr.size, "useEn", useEn.size);

  // sample
  for (const id of [1, 3, 53, 100, 125, 166]) {
    const p = all.find((x) => x.id === id);
    if (!p) continue;
    console.log("\n---", id, p.brand, "---");
    console.log("AR:", p.descAr);
    console.log("EN:", p.descEn);
    console.log("USE_AR:\n" + p.useAr);
  }
}

main();
