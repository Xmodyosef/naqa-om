#!/usr/bin/env node
/**
 * Builds:
 *  - data/products.cards.js + products.min.js  (store first paint — no desc/use/skin)
 *  - data/products.detail.json                 (lazy merge on store boot / sheet)
 *  - data/products.bundle.js + products.admin.min.js (admin full catalog)
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const dir = path.join(__dirname, "..", "data", "brands");
global.window = { NAQA_PRODUCTS: [] };
const files = fs.readdirSync(dir).filter(f => f.endsWith(".js") && f !== "TEMPLATE.js").sort();
for (const f of files) {
  try { eval(fs.readFileSync(path.join(dir, f), "utf8")); }
  catch (e) { console.error("FAIL", f, e.message); process.exit(1); }
}
const products = window.NAQA_PRODUCTS;
if (!products.length) { console.error("No products"); process.exit(1); }
products.sort((a, b) => Number(a.id) - Number(b.id));

function card(p) {
  const o = {
    id: p.id, brand: p.brand, cat: p.cat, sku: p.sku, price: p.price,
    imgs: Array.isArray(p.imgs) ? p.imgs.filter(Boolean) : [],
    nameAr: p.nameAr || "", nameEn: p.nameEn || "",
    stock: p.stock != null ? p.stock : 3
  };
  if (p.was != null && p.was !== "" && Number(p.was) > 0) o.was = p.was;
  if (p.hot) o.hot = true;
  if (p.em) o.em = p.em;
  if (p.hidden) o.hidden = true;
  return o;
}
function detail(p) {
  const o = {};
  if (p.descAr) o.descAr = p.descAr;
  if (p.descEn) o.descEn = p.descEn;
  if (p.useAr) o.useAr = p.useAr;
  if (p.useEn) o.useEn = p.useEn;
  if (p.skinAr) o.skinAr = p.skinAr;
  if (p.skinEn) o.skinEn = p.skinEn;
  return o;
}

const cards = products.map(card);
const details = {};
const full = products.map((p) => {
  const d = detail(p);
  if (Object.keys(d).length) details[String(p.id)] = d;
  return Object.assign({}, card(p), d);
});

const root = path.join(__dirname, "..", "data");
fs.writeFileSync(path.join(root, "products.cards.js"),
  "/* AUTO-GENERATED cards-only */\nwindow.NAQA_PRODUCTS=" + JSON.stringify(cards) + ";\n");
fs.writeFileSync(path.join(root, "products.detail.json"), JSON.stringify(details));
fs.writeFileSync(path.join(root, "products.bundle.js"),
  "/* AUTO-GENERATED full catalog (admin) */\nwindow.NAQA_PRODUCTS=" + JSON.stringify(full) + ";\n");

try {
  execSync("npx --yes terser data/products.cards.js -c -m --safari10 -o data/products.min.js", { stdio: "inherit", cwd: path.join(__dirname, "..") });
  execSync("npx --yes terser data/products.bundle.js -c -m --safari10 -o data/products.admin.min.js", { stdio: "inherit", cwd: path.join(__dirname, "..") });
} catch (e) {
  fs.copyFileSync(path.join(root, "products.cards.js"), path.join(root, "products.min.js"));
  fs.copyFileSync(path.join(root, "products.bundle.js"), path.join(root, "products.admin.min.js"));
  console.warn("terser unavailable — copied unminified");
}

console.log("OK", products.length,
  "cards", (fs.statSync(path.join(root, "products.min.js")).size / 1024).toFixed(1) + "KB",
  "detail", (fs.statSync(path.join(root, "products.detail.json")).size / 1024).toFixed(1) + "KB",
  "admin", (fs.statSync(path.join(root, "products.admin.min.js")).size / 1024).toFixed(1) + "KB");
