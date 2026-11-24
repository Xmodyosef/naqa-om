#!/usr/bin/env node
/* Deep-merge JSON files. Later files win.
   node scripts/merge-json.js --out merged.json a.json b.json
   node scripts/merge-json.js --lang ar --out js/admin/i18n/dict-ar.js js/admin/i18n/ar/*.json
   Objects merge. Arrays and other values are replaced, not concatenated.
*/
const fs = require("fs");
const path = require("path");

function merge(base, extra) {
  if (Array.isArray(extra) || extra === null || typeof extra !== "object") return extra;
  if (Array.isArray(base) || base === null || typeof base !== "object") base = {};
  Object.keys(extra).forEach(function (k) {
    base[k] = merge(base[k], extra[k]);
  });
  return base;
}

const args = process.argv.slice(2);
let out = "";
let lang = "";
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--out") out = args[++i];
  else if (args[i] === "--lang") lang = args[++i];
  else files.push(args[i]);
}
if (!out || !files.length) {
  console.error("usage: node scripts/merge-json.js --out dest.json|--out dict-ar.js --lang ar file.json ...");
  process.exit(1);
}
let data = {};
files.forEach(function (f) {
  data = merge(data, JSON.parse(fs.readFileSync(f, "utf8")));
});
fs.mkdirSync(path.dirname(out), { recursive: true });
if (lang) {
  const js = "(function (w) {\n  var A = w.NaqaAdmin = w.NaqaAdmin || {};\n  A.I18N = A.I18N || {};\n  A.I18N[" + JSON.stringify(lang) + "] = " + JSON.stringify(data) + ";\n})(window);\n";
  fs.writeFileSync(out, js);
} else {
  fs.writeFileSync(out, JSON.stringify(data, null, 2) + "\n");
}
console.log(path.basename(out), Object.keys(data).length, "keys from", files.length, "files");
