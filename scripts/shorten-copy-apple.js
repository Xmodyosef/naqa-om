#!/usr/bin/env node
/** Shorten desc/use/skin to Apple-like minimal copy. */
"use strict";
const fs = require("fs");
const path = require("path");
const DIR = path.join(__dirname, "..", "data", "brands");

function sizeHint(p) {
  const s = `${p.nameAr||""} ${p.nameEn||""}`;
  let m = s.match(/(\d+(?:[.,]\d+)?)\s*(مل|ml)/i); if (m) return `${m[1]} مل`;
  m = s.match(/(\d+(?:[.,]\d+)?)\s*(ج|g)/i); if (m) return `${m[1]} ج`;
  return "";
}
function shortName(p) {
  return String(p.nameAr||"").replace(/\s*[-–—].*$/,"").trim().slice(0,42);
}
function kind(p) {
  const n = `${p.nameAr} ${p.nameEn} ${p.cat}`.toLowerCase();
  if (/mascara|ماسكارا/.test(n)) return "eyes";
  if (/lip|شفاه|روج/.test(n)) return "lip";
  if (/foundation|primer|blush|face|وجه|فاونديشن/.test(n)) return "face";
  if (/hair|شعر|shampoo|olaplex|cantu/.test(n)) return "hair";
  if (/spf|sunscreen|واقي/.test(n)) return "spf";
  if (/cleanser|غسول|oil\s*clean/.test(n)) return "cleanse";
  if (/serum|سيروم/.test(n)) return "serum";
  if (/cream|كريم|moisturizer/.test(n)) return "cream";
  if (/tool|فرشاة|straight|استشوار|ghd/.test(n)) return "tool";
  return "care";
}
const DESC_AR = {
  eyes: (n,b,sz) => `${n} من ${b}. تحديد واضح دون ثقل.${sz?` ${sz}.`:""}`,
  lip: (n,b,sz) => `${n} من ${b}. لون ناعم ومريح.${sz?` ${sz}.`:""}`,
  face: (n,b,sz) => `${n} من ${b}. تغطية خفيفة لمظهر طبيعي.${sz?` ${sz}.`:""}`,
  hair: (n,b,sz) => `${n} من ${b}. عناية بسيطة للشعر.${sz?` ${sz}.`:""}`,
  spf: (n,b,sz) => `${n} من ${b}. حماية يومية بملمس خفيف.${sz?` ${sz}.`:""}`,
  cleanse: (n,b,sz) => `${n} من ${b}. ينظّف بلطف دون شد.${sz?` ${sz}.`:""}`,
  serum: (n,b,sz) => `${n} من ${b}. خطوة مركّزة وسريعة.${sz?` ${sz}.`:""}`,
  cream: (n,b,sz) => `${n} من ${b}. ترطيب مريح لليوم.${sz?` ${sz}.`:""}`,
  tool: (n,b,sz) => `${n} من ${b}. أداة عملية يومية.${sz?` ${sz}.`:""}`,
  care: (n,b,sz) => `${n} من ${b}. عناية واضحة وهادئة.${sz?` ${sz}.`:""}`,
};
const DESC_EN = {
  eyes: (n,b,sz) => `${n} by ${b}. Clean definition, no heaviness.${sz?` ${sz}.`:""}`,
  lip: (n,b,sz) => `${n} by ${b}. Soft colour, comfortable wear.${sz?` ${sz}.`:""}`,
  face: (n,b,sz) => `${n} by ${b}. Light coverage, natural finish.${sz?` ${sz}.`:""}`,
  hair: (n,b,sz) => `${n} by ${b}. Simple daily hair care.${sz?` ${sz}.`:""}`,
  spf: (n,b,sz) => `${n} by ${b}. Everyday light SPF feel.${sz?` ${sz}.`:""}`,
  cleanse: (n,b,sz) => `${n} by ${b}. Gentle cleanse, no tight feel.${sz?` ${sz}.`:""}`,
  serum: (n,b,sz) => `${n} by ${b}. Focused step, fast finish.${sz?` ${sz}.`:""}`,
  cream: (n,b,sz) => `${n} by ${b}. Quiet daily moisture.${sz?` ${sz}.`:""}`,
  tool: (n,b,sz) => `${n} by ${b}. Practical everyday tool.${sz?` ${sz}.`:""}`,
  care: (n,b,sz) => `${n} by ${b}. Clear, quiet care.${sz?` ${sz}.`:""}`,
};
const USE_AR = {
  eyes: "١) من الجذور للأطراف.\n٢) طبقة واحدة كافية.",
  lip: "١) على شفاه نظيفة.\n٢) أعدِي عند الحاجة.",
  face: "١) بعد العناية.\n٢) وزّعي برفق.",
  hair: "١) على شعر رطب أو جاف حسب النوع.\n٢) لا تُغرقي الكمية.",
  spf: "١) آخر خطوة صباحاً.\n٢) جدّدي بعد التعرض الطويل.",
  cleanse: "١) على بشرة رطبة.\n٢) دلكي واشطفي.",
  serum: "١) بعد التنظيف.\n٢) قطرات قليلة ثم رطّبي.",
  cream: "١) بعد السيروم.\n٢) طبقة خفيفة تكفي.",
  tool: "١) على بشرة/شعر نظيف.\n٢) اتبعي تعليمات الجهاز.",
  care: "١) ضمن روتينك اليومي.\n٢) كمية قليلة تكفي.",
};
const USE_EN = {
  eyes: "1) Roots to tips.\n2) One coat is enough.",
  lip: "1) On clean lips.\n2) Reapply as needed.",
  face: "1) After skincare.\n2) Blend lightly.",
  hair: "1) Damp or dry as directed.\n2) A little goes far.",
  spf: "1) Last morning step.\n2) Reapply outdoors.",
  cleanse: "1) On damp skin.\n2) Massage, rinse.",
  serum: "1) After cleanse.\n2) Few drops, then moisturise.",
  cream: "1) After serum.\n2) Thin layer is enough.",
  tool: "1) On clean skin/hair.\n2) Follow device guide.",
  care: "1) In your daily routine.\n2) Small amount is enough.",
};
const SKIN_AR = {
  eyes: "لكل الرموش. اختبري إن كانت العيون حسّاسة.",
  lip: "لكل درجات الشفاه.",
  face: "لكل درجات البشرة — اختاري الدرجة المناسبة.",
  hair: "حسب نوع الشعر والفروة.",
  spf: "للاستخدام النهاري اليومي.",
  cleanse: "مناسب لمعظم أنواع البشرة.",
  serum: "حسب احتياج بشرتك.",
  cream: "للبشرة العادية إلى الجافة غالباً.",
  tool: "للاستخدام اليومي أو الأسبوعي.",
  care: "حسب نوع البشرة.",
};
const SKIN_EN = {
  eyes: "All lash types. Patch-test if sensitive.",
  lip: "All lip tones.",
  face: "All skin tones — pick your shade.",
  hair: "Depends on hair and scalp.",
  spf: "For daily daytime use.",
  cleanse: "Most skin types.",
  serum: "Match to your skin need.",
  cream: "Often normal to dry skin.",
  tool: "Daily or weekly use.",
  care: "Match to your skin type.",
};

function rewrite(p) {
  const k = kind(p);
  const nAr = shortName(p);
  const nEn = String(p.nameEn||"").replace(/\s*[-–—].*$/,"").trim().slice(0,48);
  const b = p.brand || "";
  const sz = sizeHint(p);
  p.descAr = DESC_AR[k](nAr, b, sz);
  p.descEn = DESC_EN[k](nEn || nAr, b, sz.replace("مل","ml").replace("ج","g"));
  p.useAr = USE_AR[k];
  p.useEn = USE_EN[k];
  p.skinAr = SKIN_AR[k];
  p.skinEn = SKIN_EN[k];
  return p;
}

function patchFile(file) {
  let src = fs.readFileSync(file, "utf8");
  // eval products from file
  const g = { window: { NAQA_PRODUCTS: [] } };
  // run in isolated way - brands push to window.NAQA_PRODUCTS
  const code = src.replace(/window\.NAQA_PRODUCTS/g, "g.window.NAQA_PRODUCTS");
  // safer: eval full after binding
  const sandbox = { window: { NAQA_PRODUCTS: [] }, console };
  const vm = require("vm");
  vm.runInNewContext(src, sandbox);
  const list = sandbox.window.NAQA_PRODUCTS;
  if (!list || !list.length) return 0;
  list.forEach(rewrite);
  // rebuild file: keep structure as JSON pushes - rewrite by regenerating
  // Prefer: replace desc/use/skin fields in source via regex per product id
  let n = 0;
  for (const p of list) {
    const id = p.id;
    // replace fields for this product block - naive sequential replace of "descAr": "..."
  }
  // Full rewrite as JS push format
  const lines = [];
  lines.push(`// ${path.basename(file)} — short Apple-like copy`);
  lines.push(`(function(){`);
  lines.push(`var A = window.NAQA_PRODUCTS || (window.NAQA_PRODUCTS = []);`);
  for (const p of list) {
    lines.push(`A.push(${JSON.stringify(p, null, 2)});`);
    n++;
  }
  lines.push(`})();`);
  fs.writeFileSync(file, lines.join("\n") + "\n");
  return n;
}

let total = 0;
for (const f of fs.readdirSync(DIR).filter(x => x.endsWith(".js") && x !== "TEMPLATE.js")) {
  const c = patchFile(path.join(DIR, f));
  total += c;
  console.log(f, c);
}
console.log("TOTAL", total);
