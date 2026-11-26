#!/usr/bin/env node
/**
 * Build static product pages for SEO: p/<id>/index.html + sitemap.xml
 * Content is real product fields (not thin placeholders).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const code = fs.readFileSync(path.join(root, "data/products.bundle.js"), "utf8");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(code, ctx);
const products = (ctx.window.NAQA_PRODUCTS || []).filter((p) => p && !p.hidden);

const base = "https://xmodyosef.github.io/naqa-om";
const outDir = path.join(root, "p");

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function pageFor(p) {
  const name = p.nameAr || p.nameEn || "منتج";
  const nameEn = p.nameEn || p.nameAr || "Product";
  const desc = (p.descAr || p.descEn || name).replace(/\s+/g, " ").trim().slice(0, 280);
  const img = (p.imgs && p.imgs[0]) ? (base + "/" + p.imgs[0].replace(/^\//, "")) : (base + "/media/icons/icon-512.png");
  const url = base + "/p/" + p.id + "/";
  const price = Number(p.price);
  const brand = p.brand || "Naqa";
  const fullDesc = String(p.descAr || p.descEn || name).replace(/\s+/g, " ").trim();
  const useTxt = String(p.useAr || p.useEn || "").replace(/\s+/g, " ").trim();
  const skin = String(p.skinAr || p.skinEn || "").trim();
  const cat = p.cat || "منتجات";
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: name,
        description: fullDesc.slice(0, 5000),
        image: img,
        sku: p.sku || String(p.id),
        brand: { "@type": "Brand", name: brand },
        category: cat,
        offers: {
          "@type": "Offer",
          url: url,
          priceCurrency: "OMR",
          price: price.toFixed(3),
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: "نقاء | Naqa" }
        }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "نقاء", item: base + "/" },
          { "@type": "ListItem", position: 2, name: cat, item: base + "/#shop" },
          { "@type": "ListItem", position: 3, name: name, item: url }
        ]
      }
    ]
  };
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(name)} | نقاء</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${esc(url)}" />
<meta property="og:type" content="product" />
<meta property="og:title" content="${esc(name)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${esc(url)}" />
<meta property="og:image" content="${esc(img)}" />
<meta property="product:price:amount" content="${price.toFixed(3)}" />
<meta property="product:price:currency" content="OMR" />
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>
  body{margin:0;font-family:system-ui,"Noto Kufi Arabic",Tahoma,sans-serif;background:#fdf8f6;color:#1f1a17;line-height:1.6}
  .wrap{max-width:720px;margin:0 auto;padding:20px 16px 48px}
  a{color:#8d3048;font-weight:700}
  .card{background:#fff;border:1px solid #efe4df;border-radius:18px;padding:16px;box-shadow:0 10px 30px rgba(50,30,25,.06)}
  img.hero{width:100%;max-height:420px;object-fit:contain;border-radius:14px;background:#f7f0ea}
  h1{font-size:1.35rem;margin:12px 0 6px}
  .meta{color:#6b625c;font-size:.9rem}
  .price{font-size:1.25rem;font-weight:800;color:#8d3048;margin:10px 0}
  .btn{display:inline-block;margin-top:14px;background:#8d3048;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none}
  .muted{color:#6b625c;font-size:.85rem;margin-top:18px}
</style>
</head>
<body>
<div class="wrap">
  <p><a href="${esc(base)}/">← نقاء</a> · <span class="meta">${esc(brand)}</span></p>
  <nav class="meta" aria-label="مسار الصفحة"><a href="${esc(base)}/">نقاء</a> · ${esc(cat)} · ${esc(brand)}</nav>
  <div class="card">
    <img class="hero" src="${esc(img)}" alt="${esc(name)}" width="720" height="720" loading="eager" decoding="async" />
    <h1>${esc(name)}</h1>
    <p class="meta">${esc(nameEn)} · ${esc(brand)} · SKU ${esc(p.sku || "—")}</p>
    <p class="price">${price.toFixed(3)} ر.ع <span class="meta">شامل الضريبة ٥٪</span></p>
    <h2 style="font-size:1rem;margin:14px 0 6px">الوصف</h2>
    <p>${esc(fullDesc)}</p>
    ${skin ? `<p class="meta"><strong>الأنسب لـ:</strong> ${esc(skin)}</p>` : ""}
    ${useTxt ? `<h2 style="font-size:1rem;margin:14px 0 6px">طريقة الاستخدام</h2><p style="white-space:pre-line">${esc(useTxt)}</p>` : ""}
    <a class="btn" href="${esc(base)}/#p/${p.id}">افتحي في المتجر</a>
  </div>
  <p class="muted">نقاء · عناية ومكياج أصلية · توصيل داخل عُمان · طلب واتساب · أسعار شاملة الضريبة ٥٪</p>
</div>
</body>
</html>
`;
}

if (fs.existsSync(outDir)) {
  // clean old numbered dirs only
  for (const ent of fs.readdirSync(outDir)) {
    const full = path.join(outDir, ent);
    if (/^\d+$/.test(ent) && fs.statSync(full).isDirectory()) {
      fs.rmSync(full, { recursive: true, force: true });
    }
  }
} else {
  fs.mkdirSync(outDir, { recursive: true });
}

const urls = [`${base}/`];
for (const p of products) {
  const dir = path.join(outDir, String(p.id));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), pageFor(p), "utf8");
  urls.push(`${base}/p/${p.id}/`);
}

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u, i) => `  <url>
    <loc>${u}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${i === 0 ? "daily" : "weekly"}</changefreq>
    <priority>${i === 0 ? "1.0" : "0.7"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap, "utf8");
console.log("product pages", products.length, "sitemap urls", urls.length);
