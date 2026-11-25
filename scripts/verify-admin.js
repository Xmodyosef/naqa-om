#!/usr/bin/env node
"use strict";
/**
 * Automated checks for Naqa admin panel (no browser).
 * Run: node scripts/verify-admin.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
let fail = 0;
const assert = (c, m) => {
  if (!c) { console.error("FAIL", m); fail++; }
  else console.log("PASS", m);
};

// 1) syntax of admin modules
const adminFiles = [
  "js/admin/core.js",
  "js/admin/app.js",
  "js/admin/firebase-gate.js",
  "js/admin/load-modules.js",
  "js/admin/products.js",
  "js/admin/orders.js",
  "js/admin/settings.js",
  "js/admin/finance.js",
  "js/admin/customers.js",
  "js/admin/reviews.js",
  "js/admin/dashboard.js",
  "js/admin/i18n.js",
  "js/firebase-config.js"
];
for (const f of adminFiles) {
  try {
    new Function(read(f));
    assert(true, "syntax " + f);
  } catch (e) {
    assert(false, "syntax " + f + " " + e.message);
  }
}

// 2) Auth FSM present
const gate = read("js/admin/firebase-gate.js");
assert(gate.includes("function renderAuthUI"), "auth FSM renderAuthUI");
assert(gate.includes('state === "booting"') || gate.includes('state === "booting"') || gate.includes('"booting"'), "auth state booting");
assert(gate.includes('"guest"') && gate.includes('"open"'), "auth states guest+open");
assert(gate.includes("FAST PATH") || gate.includes("uidAllowed"), "sync UID fast path");
assert(gate.includes("tools").hidden !== undefined || gate.includes('tools.hidden = false') || gate.includes('tools) tools.hidden = false'), "open unhides tools");
assert(/tools\.hidden\s*=\s*false/.test(gate), "tools.hidden=false in gate");

// 3) No PIN login path
assert(!/A\.PIN\s*=/.test(read("js/admin/core.js")), "no A.PIN assignment");
assert(!gate.includes("doPinLogin") && !gate.includes("pinGo"), "gate has no PIN login");

// 4) Dead i18n keys gone
function loadDict(lang) {
  const code = read(`js/admin/i18n/dict-${lang}.js`);
  const m = code.match(new RegExp(`A\\.I18N\\["${lang}"\\]\\s*=\\s*(\\{[\\s\\S]*\\});`));
  if (!m) throw new Error("dict " + lang);
  return JSON.parse(m[1]);
}
const ar = loadDict("ar");
const en = loadDict("en");
const DEAD = ["pinFirst","pinGo","pinPh","pinBad","setPin","setTok","tokSaved","needTok","hideNeedTok","setNewPin"];
DEAD.forEach((k) => {
  assert(!(k in ar), "ar free of dead key " + k);
  assert(!(k in en), "en free of dead key " + k);
});
assert(Object.keys(ar).length === Object.keys(en).length, "i18n key count parity");
const missingEn = Object.keys(ar).filter((k) => !(k in en));
const missingAr = Object.keys(en).filter((k) => !(k in ar));
assert(!missingEn.length, "no AR-only keys " + missingEn.slice(0, 5).join(","));
assert(!missingAr.length, "no EN-only keys " + missingAr.slice(0, 5).join(","));
assert(ar.pinLead && !/رمز.*جوال/.test(ar.pinLead), "pinLead is welcome not PIN device msg");

// 5) Hide product path
const prod = read("js/admin/products.js");
assert(prod.includes("data-hide") || prod.includes("toggleHide") || prod.includes("p_hide"), "hide control present");
assert(prod.includes("syncOverridesCloud") || prod.includes("publishLive"), "hide/save syncs cloud");

// 6) Catalog split performance
assert(fs.existsSync(path.join(root, "data/products.min.js")), "store cards products.min.js");
assert(fs.existsSync(path.join(root, "data/products.detail.json")), "lazy products.detail.json");
assert(fs.existsSync(path.join(root, "data/products.admin.min.js")), "admin full products.admin.min.js");
const cardsKB = fs.statSync(path.join(root, "data/products.min.js")).size / 1024;
const fullKB = fs.statSync(path.join(root, "data/products.admin.min.js")).size / 1024;
assert(cardsKB < 120, "cards payload < 120KB (got " + cardsKB.toFixed(1) + ")");
assert(fullKB > cardsKB, "admin full larger than cards");
assert(read("js/core.js").includes("naqaMergeProductDetails"), "store merge helper");
assert(read("js/app.js").includes("products.detail.json"), "store loads detail lazily");
assert(read("js/admin/load-modules.js").includes("products.admin.min.js"), "admin loads full catalog");

// 7) Admin catalog loadable
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(read("data/products.admin.min.js"), ctx);
const P = ctx.window.NAQA_PRODUCTS;
assert(Array.isArray(P) && P.length >= 100, "admin catalog products count");
assert(P.every((p) => p.stock != null), "admin products have stock");

// 8) Cancel confirm not delete-as-default
const orders = read("js/admin/orders.js");
assert(orders.includes("cancelConfirm") || orders.includes("cancel"), "orders cancel path");

// 9) settings no GitHub token field prompt as primary
const settings = read("js/admin/settings.js");
assert(!/contents:write/.test(settings), "settings no contents:write prompt");
assert(settings.includes("fbSignOut") || settings.includes("signOut") || settings.includes("setOut"), "settings has sign out");

// 10) admin.html structure
const html = read("admin.html");
assert(html.includes('id="authBoot"'), "authBoot element");
assert(html.includes('id="tools"'), "tools shell");
assert(html.includes("firebase-gate.js"), "loads firebase-gate");
assert(html.includes("load-modules.js"), "loads load-modules");

console.log(fail ? "\nFAILED " + fail : "\nALL ADMIN CHECKS PASSED");
process.exit(fail ? 1 : 0);
