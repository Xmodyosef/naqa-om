#!/usr/bin/env node
"use strict";
/**
 * SEO product pages live under /barcode/{SKU}/ only (keeps repo root clean).
 * Legacy /{SKU}/ and /p/{SKU}/ are thin redirects → /barcode/{SKU}/.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "data/products.bundle.js"), "utf8");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const products = (ctx.window.NAQA_PRODUCTS || []).filter((p) => p && !p.hidden);
const base = "https://xmodyosef.github.io/naqa-om";
const outBarcode = path.join(root, "barcode");
const outP = path.join(root, "p");

function esc(s) {
  return String(s == null ? "" : s)
    .split("&").join("&" + "amp;")
    .split("<").join("&" + "lt;")
    .split(">").join("&" + "gt;")
    .split('"').join("&" + "quot;");
}

const RESERVED = new Set([
  "admin","order","panel","media","js","css","data","p","docs","scripts",
  "tmp",".github","index","store","clear-cache","products","barcode","logo.svg",
  "clear","artifacts"
]);

function slugOf(p) {
  return String((p && p.sku) || (p && p.id) || "").trim();
}

function thinRedirect(url) {
  return (
    "<!DOCTYPE html><html lang=\"ar\" dir=\"rtl\"><head><meta charset=\"UTF-8\"/>" +
    "<meta http-equiv=\"refresh\" content=\"0;url=" + url + "\"/>" +
    "<link rel=\"canonical\" href=\"" + url + "\"/>" +
    "<script>location.replace(" + JSON.stringify(url) + ");</script>" +
    "<title>…</title></head><body><p><a href=\"" + url + "\">انتقال</a></p></body></html>"
  );
}

function isProductPageDir(full) {
  const idx = path.join(full, "index.html");
  if (!fs.existsSync(idx)) return false;
  const head = fs.readFileSync(idx, "utf8").slice(0, 1200);
  return (
    (head.includes("schema.org") && head.includes("Product")) ||
    head.includes("location.replace") ||
    head.includes("http-equiv=\"refresh\"")
  );
}

/* Remove old full SEO pages from repo root (numeric / SKU folders only) */
for (const ent of fs.readdirSync(root)) {
  const full = path.join(root, ent);
  try {
    if (!fs.statSync(full).isDirectory()) continue;
    if (RESERVED.has(ent.toLowerCase())) continue;
    if (ent.startsWith(".")) continue;
    if (isProductPageDir(full)) {
      fs.rmSync(full, { recursive: true, force: true });
    }
  } catch (e) {}
}

/* Reset barcode/ and p/ */
if (fs.existsSync(outBarcode)) fs.rmSync(outBarcode, { recursive: true, force: true });
if (fs.existsSync(outP)) fs.rmSync(outP, { recursive: true, force: true });
fs.mkdirSync(outBarcode, { recursive: true });
fs.mkdirSync(outP, { recursive: true });

const urls = [base + "/"];
let fullCount = 0;
let redirCount = 0;

for (const p of products) {
  const name = p.nameAr || p.nameEn || "منتج";
  const nameEn = p.nameEn || p.nameAr || "Product";
  const desc = String(p.descAr || p.descEn || name).replace(/\s+/g, " ").trim().slice(0, 280);
  const imgPath = (p.imgs && p.imgs[0]) || null;
  const img = imgPath ? base + "/" + String(imgPath).replace(/^\//, "") : base + "/media/icons/icon-512.png";
  const slug = slugOf(p);
  if (!slug || RESERVED.has(slug.toLowerCase())) continue;

  const url = base + "/barcode/" + encodeURIComponent(slug) + "/";
  const storeUrl = base + "/?sku=" + encodeURIComponent(slug);
  const price = Number(p.price) || 0;
  const brand = p.brand || "Naqa";
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: desc,
    image: img,
    sku: p.sku || String(p.id),
    brand: { "@type": "Brand", name: brand },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "OMR",
      price: price.toFixed(3),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition"
    }
  };

  const dir = path.join(outBarcode, slug);
  fs.mkdirSync(dir, { recursive: true });
  const html =
    "<!DOCTYPE html>\n<html lang=\"ar\" dir=\"rtl\">\n<head>\n" +
    "<meta charset=\"UTF-8\" />\n" +
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n" +
    "<title>" + esc(name) + " | نقاء</title>\n" +
    "<meta name=\"description\" content=\"" + esc(desc) + "\" />\n" +
    "<link rel=\"canonical\" href=\"" + esc(url) + "\" />\n" +
    "<meta property=\"og:type\" content=\"product\" />\n" +
    "<meta property=\"og:title\" content=\"" + esc(name) + "\" />\n" +
    "<meta property=\"og:description\" content=\"" + esc(desc) + "\" />\n" +
    "<meta property=\"og:url\" content=\"" + esc(url) + "\" />\n" +
    "<meta property=\"og:image\" content=\"" + esc(img) + "\" />\n" +
    "<script type=\"application/ld+json\">" + JSON.stringify(ld) + "</script>\n" +
    "<style>\n" +
    "body{margin:0;font-family:system-ui,\"Noto Kufi Arabic\",Tahoma,sans-serif;background:#fdf8f6;color:#1f1a17;line-height:1.6}\n" +
    ".wrap{max-width:720px;margin:0 auto;padding:20px 16px 48px}\n" +
    "a{color:#8d3048;font-weight:700}\n" +
    ".card{background:#fff;border:1px solid #efe4df;border-radius:18px;padding:16px;box-shadow:0 10px 30px rgba(50,30,25,.06)}\n" +
    "img.hero{width:100%;max-height:420px;object-fit:contain;border-radius:14px;background:#f7f0ea}\n" +
    "h1{font-size:1.35rem;margin:12px 0 6px}\n" +
    ".meta{color:#6b625c;font-size:.9rem}\n" +
    ".price{font-size:1.25rem;font-weight:800;color:#8d3048;margin:10px 0}\n" +
    ".btn{display:inline-block;margin-top:14px;background:#8d3048;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none}\n" +
    ".muted{color:#6b625c;font-size:.85rem;margin-top:18px}\n" +
    "</style>\n</head>\n<body>\n" +
    "<div class=\"wrap\">\n" +
    "  <p><a href=\"" + base + "/\">← نقاء</a> · <span class=\"meta\">" + esc(brand) + "</span></p>\n" +
    "  <div class=\"card\">\n" +
    "    <img class=\"hero\" src=\"" + esc(img) + "\" alt=\"" + esc(name) + "\" width=\"720\" height=\"720\" />\n" +
    "    <h1>" + esc(name) + "</h1>\n" +
    "    <p class=\"meta\">" + esc(nameEn) + " · " + esc(slug) + "</p>\n" +
    "    <p class=\"price\">" + price.toFixed(3) + " ر.ع <span class=\"meta\">شامل الضريبة ٥٪</span></p>\n" +
    "    <p>" + esc(desc) + "</p>\n" +
    "    <a class=\"btn\" href=\"" + esc(storeUrl) + "\">افتحي في المتجر</a>\n" +
    "  </div>\n" +
    "  <p class=\"muted\">نقاء · عناية ومكياج · توصيل داخل عُمان · طلب واتساب</p>\n" +
    "</div>\n</body>\n</html>\n";
  fs.writeFileSync(path.join(dir, "index.html"), html);
  fullCount++;
  urls.push(url);

  /* legacy /p/SKU/ and /p/id/ only → barcode (root stays clean — no /{SKU}/ folders) */
  const redir = thinRedirect(url);
  for (const leg of [slug, String(p.id)]) {
    if (!leg) continue;
    const ld2 = path.join(outP, leg);
    fs.mkdirSync(ld2, { recursive: true });
    fs.writeFileSync(path.join(ld2, "index.html"), redir);
    redirCount++;
  }
}

let sm = '<?xml version="1.0" encoding="UTF-8"?>\n';
sm += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
urls.forEach(function (u, i) {
  const prio = i === 0 ? "1.0" : "0.7";
  const freq = i === 0 ? "daily" : "weekly";
  sm += "  <url>\n    <loc>" + u + "</loc>\n    <changefreq>" + freq + "</changefreq>\n    <priority>" + prio + "</priority>\n  </url>\n";
});
sm += "</urlset>\n";
fs.writeFileSync(path.join(root, "sitemap.xml"), sm);

/* pointer readme */
fs.writeFileSync(
  path.join(outBarcode, "README.md"),
  "# barcode/\n\nصفحات SEO للمنتجات (صفحة لكل SKU/باركود).\n\n- الرابط العام: `/barcode/{SKU}/`\n- التوجيهات القديمة: `/{SKU}/` و `/p/{SKU}/` → هنا\n- لا تحذفي هذا المجلد يدوياً — يُبنى بـ `node scripts/build-seo-pages.js`\n"
);

console.log(
  "SEO OK: full pages in barcode/ =",
  fullCount,
  "| redirects =",
  redirCount,
  "| sitemap urls =",
  urls.length
);
