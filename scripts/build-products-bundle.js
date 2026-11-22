#!/usr/bin/env node
/**
 * Builds data/products.bundle.js from data/brands/*.js
 * Run after editing any brand file:
 *   node scripts/build-products-bundle.js
 */
const fs = require("fs");
const path = require("path");
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
const out = path.join(__dirname, "..", "data", "products.bundle.js");
const body =
  "/* AUTO-GENERATED — do not edit. Source: data/brands/*.js — run: node scripts/build-products-bundle.js */\n" +
  "window.NAQA_PRODUCTS=" + JSON.stringify(products) + ";\n";
fs.writeFileSync(out, body);
console.log("OK", products.length, "products →", out, "(" + (Buffer.byteLength(body) / 1024).toFixed(1) + " KB)");
