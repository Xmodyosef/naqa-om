#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
let fail = 0;
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    fail++;
  } else console.log("PASS", m);
};

assert(/cart\s*=\s*\[\s*\]/.test(read("js/cart.js")), "cart clears after checkout");
assert(read("js/cart.js").includes("order.html#"), "order.html bridge in WhatsApp");
assert(read("js/cart.js").includes("siteBasePath"), "saveLink uses siteBasePath");
assert(read("js/admin/orders.js").includes("terms.every"), "admin order search supports multiple terms");
assert(read("js/admin/app.js").includes("var nNew = counts.new || 0"), "admin parent badge counts new orders only");
assert(read("js/cart.js").includes("function cartQtyAllowed"), "cart quantity validator exists");
assert(read("js/cart.js").includes("if(!cartQtyAllowed(p, qty))"), "checkout rejects invalid or over-stock quantities");
assert(read("js/cart.js").includes("if(!waWindow)"), "checkout detects blocked WhatsApp popups");
assert(read("js/cart.js").includes("window.__naqaPendingWhatsApp"), "checkout preserves a pending WhatsApp order without duplicate submission");

const cartTestCtx = {};
vm.createContext(cartTestCtx);
vm.runInContext(read("js/cart.js"), cartTestCtx);
assert(cartTestCtx.cartQtyAllowed({stock:3}, 3), "cart quantity accepts available stock");
assert(!cartTestCtx.cartQtyAllowed({stock:3}, 4), "cart quantity rejects stock overrun");
assert(cartTestCtx.cartQtyAllowed({stock:25}, 20), "cart quantity accepts the 20-item cap");
assert(!cartTestCtx.cartQtyAllowed({stock:25}, 21), "cart quantity rejects above 20 items");
assert(!cartTestCtx.cartQtyAllowed({stock:0}, 1), "cart quantity rejects zero stock");

assert(read("js/core.js").includes("function siteBasePath"), "siteBasePath defined");
assert(
  !/mergeOverrides\(JSON\.parse\(localStorage\.getItem\("naqa_overrides"/.test(read("js/core.js")),
  "storefront does not merge localStorage overrides"
);
assert(read("js/config.js").includes("ORDERS_CAP = 300"), "ORDERS_CAP 300");
assert(read("order.html").includes("slice(0,300)"), "order.html cap 300");

const code = read(fs.existsSync(path.join(root,"data/products.admin.min.js"))?"data/products.admin.min.js":"data/products.bundle.js");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(code, ctx);
const P = ctx.window.NAQA_PRODUCTS;
assert(P.length && P.every((p) => Number(p.stock) === 3), "catalog stock default 3");
assert(fs.existsSync(path.join(root,"data/products.min.js")), "cards products.min.js exists");
assert(fs.existsSync(path.join(root,"data/products.detail.json")), "detail json exists");

const dry = read("js/features/wish-concerns.js").split('id:"dry"')[1].slice(0, 180);
assert(!/moist|ترطيب/.test(dry), "dry quiz without moist/ترطيب");
assert(read("css/store/base.css").includes("#8d3048"), "AA rose-deep");
assert(fs.existsSync(path.join(root, "8800256108374", "index.html")) || fs.readdirSync(root).filter(function(n){return /^[0-9]{8,}$/.test(n)}).length>50, "SEO barcode product pages");
assert((read("sitemap.xml").match(/<loc>/g) || []).length >= 200, "sitemap >= 200");
assert(read("js/admin/finance.js").includes("Asia/Muscat"), "finance Asia/Muscat");
assert(/BANK_IBAN\s*=\s*""/.test(read("js/config.js")), "BANK_IBAN blank");
assert(!read("index.html").includes("www.naqa.om"), "no dead domain in title");
assert(!fs.existsSync(path.join(root, "CNAME")), "no CNAME until DNS ready");


const heroSource = read("js/hero-swipe.js");
const heroIndex = read("index.html");
assert(heroIndex.indexOf('js/store.min.js') < heroIndex.indexOf('js/hero-swipe.js'), "hero enhancement loads after store bundle");
assert(/catalogList\(id, 1\)/.test(heroSource), "hero hides campaigns with no available products");
assert(!/setInterval|setTimeout/.test(heroSource), "hero has no autoplay timer");
assert(/fetchpriority="high"/.test(heroSource), "first available hero image gets high fetch priority");
assert(/aria-roledescription/.test(heroSource) && /ArrowRight/.test(heroSource), "hero is accessible by keyboard");
assert(/NAQA_BANNER_HEROES/.test(heroSource) && /pimgs\(p\)/.test(heroSource), "hero uses real curated product images");
assert(/hero-slide-copy/.test(heroSource) && /hero-slide-art/.test(heroSource), "hero includes campaign copy and product artwork");
assert(read("index.html").includes('id="naqa-hero-v2"'), "hero v2 responsive styling is loaded");
assert(read("index.html").includes("hero-swipe.js?v=20261127c17"), "hero v2 cache key is current");

const min = read("js/store.min.js");
assert(min.includes("order.html#"), "min bundle has bridge");
assert(min.includes("siteBasePath"), "min has siteBasePath");
assert(min.includes("productRouteKey") || min.includes("findProductByRoute"), "min routes by SKU/barcode");
assert(read("js/core.js").includes("productRouteKey"), "core productRouteKey");
assert(!min.includes('getItem("naqa_overrides")'), "min no ls overrides");

function siteBasePath(pathname) {
  var p = pathname || "/";
  p = p.replace(/\/index\.html$/i, "/");
  p = p.replace(/\/(admin|order|panel|store|clear-cache)\.html$/i, "/");
  p = p.replace(/\/p\/[^/]+\/?$/i, "/");
  var parts = p.split("/").filter(Boolean);
  if (parts.length >= 2) {
    var last = parts[parts.length - 1];
    if (!/\./.test(last) && /^[0-9]{6,}$/.test(last)) {
      parts.pop();
      p = "/" + parts.join("/") + "/";
    }
  }
  if (/\/[^/]+\.[a-zA-Z0-9]+$/.test(p)) p = p.replace(/\/[^/]+$/, "/");
  if (p.slice(-1) !== "/") p += "/";
  return p;
}
const o = "https://xmodyosef.github.io";
[
  ["/naqa-om/", o + "/naqa-om/?sku=12"],
  ["/naqa-om", o + "/naqa-om/?sku=12"],
  ["/naqa-om/8800256108374/", o + "/naqa-om/?sku=12"],
].forEach(([pathname, expect]) => {
  const got = o + siteBasePath(pathname) + "?sku=12";
  assert(got === expect, "productLink path " + pathname);
});
assert(read("js/core.js").includes("productHref"), "productHref path helper");
assert(read("js/core.js").includes("productKeyFromSearch"), "sku query product key");
assert(!read("js/core.js").includes('return "#p/"+key'), "no #p/ prefix");

for (const f of ["js/cart.js", "js/core.js", "js/store.min.js", "js/hero-swipe.js", "js/admin/core.js", "js/admin/finance.js"]) {
  try {
    new Function(read(f));
    assert(true, "syntax " + f);
  } catch (e) {
    assert(false, "syntax " + f + " " + e.message);
  }
}

console.log(fail ? "\nFAILED " + fail : "\nALL PASSED");
if (fail) process.exit(1);
/* chain admin suite */
try {
  require("child_process").execSync("node scripts/verify-admin.js", { stdio: "inherit", cwd: root });
} catch (e) {
  process.exit(1);
}
