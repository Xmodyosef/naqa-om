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
assert(read("js/core.js").includes("function siteBasePath"), "siteBasePath defined");
assert(
  !/mergeOverrides\(JSON\.parse\(localStorage\.getItem\("naqa_overrides"/.test(read("js/core.js")),
  "storefront does not merge localStorage overrides"
);
assert(read("js/config.js").includes("ORDERS_CAP = 300"), "ORDERS_CAP 300");
assert(read("order.html").includes("slice(0,300)"), "order.html cap 300");

const code = read("data/products.bundle.js");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(code, ctx);
const P = ctx.window.NAQA_PRODUCTS;
assert(P.length && P.every((p) => Number(p.stock) === 3), "catalog stock default 3");

const dry = read("js/features/wish-concerns.js").split('id:"dry"')[1].slice(0, 180);
assert(!/moist|ترطيب/.test(dry), "dry quiz without moist/ترطيب");
assert(read("css/store/base.css").includes("#8d3048"), "AA rose-deep");
assert(fs.existsSync(path.join(root, "p/1/index.html")), "SEO product page");
assert((read("sitemap.xml").match(/<loc>/g) || []).length >= 200, "sitemap >= 200");
assert(read("js/admin/finance.js").includes("Asia/Muscat"), "finance Asia/Muscat");
assert(/BANK_IBAN\s*=\s*""/.test(read("js/config.js")), "BANK_IBAN blank");
assert(!read("index.html").includes("www.naqa.om"), "no dead domain in title");
assert(!fs.existsSync(path.join(root, "CNAME")), "no CNAME until DNS ready");

const min = read("js/store.min.js");
assert(min.includes("order.html#"), "min bundle has bridge");
assert(min.includes("siteBasePath"), "min has siteBasePath");
assert(!min.includes('getItem("naqa_overrides")'), "min no ls overrides");

function siteBasePath(pathname) {
  var p = pathname || "/";
  p = p.replace(/\/index\.html$/i, "/");
  p = p.replace(/\/(admin|order)\.html$/i, "/");
  p = p.replace(/\/p\/[0-9]+\/?$/i, "/");
  if (/\/[^/]+\.[a-zA-Z0-9]+$/.test(p)) p = p.replace(/\/[^/]+$/, "/");
  if (p.slice(-1) !== "/") p += "/";
  return p;
}
const o = "https://xmodyosef.github.io";
[
  ["/naqa-om/", o + "/naqa-om/p/12/"],
  ["/naqa-om", o + "/naqa-om/p/12/"],
  ["/naqa-om/p/5/", o + "/naqa-om/p/12/"],
].forEach(([pathname, expect]) => {
  const got = o + siteBasePath(pathname) + "p/12/";
  assert(got === expect, "productLink path " + pathname);
});

for (const f of ["js/cart.js", "js/core.js", "js/store.min.js", "js/admin/core.js", "js/admin/finance.js"]) {
  try {
    new Function(read(f));
    assert(true, "syntax " + f);
  } catch (e) {
    assert(false, "syntax " + f + " " + e.message);
  }
}

console.log(fail ? "\nFAILED " + fail : "\nALL PASSED");
process.exit(fail ? 1 : 0);
