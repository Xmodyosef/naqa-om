#!/usr/bin/env node
/* Compress product photos that are actually big.
   Current Naqa photos are already about 560px WebP, so a second pass
   often saves nothing. This skips a file unless the new one is smaller.

   Dry run (default):
     node scripts/compress-images.js media/products
   Write only when smaller:
     node scripts/compress-images.js media/products --write --max 800 --quality 75 --min-save 8
*/
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const args = process.argv.slice(2);
let dir = "";
let write = false;
let max = 800;
let quality = 75;
let minSave = 8;
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--write") write = true;
  else if (args[i] === "--max") max = Number(args[++i]);
  else if (args[i] === "--quality") quality = Number(args[++i]);
  else if (args[i] === "--min-save") minSave = Number(args[++i]);
  else if (!args[i].startsWith("--")) files.push(args[i]);
}
dir = files[0] || "";
if (!dir || !fs.existsSync(dir)) {
  console.error("usage: node scripts/compress-images.js <folder> [--write] [--max 800] [--quality 75] [--min-save 8]");
  process.exit(1);
}

function walk(folder, out) {
  fs.readdirSync(folder, { withFileTypes: true }).forEach(function (ent) {
    const p = path.join(folder, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(webp|png|jpe?g)$/i.test(ent.name)) out.push(p);
  });
  return out;
}

const list = walk(dir, []);
let before = 0;
let after = 0;
let changed = 0;
let skipped = 0;
list.forEach(function (file) {
  const orig = fs.statSync(file).size;
  before += orig;
  const tmp = file + ".compress.tmp.webp";
  try {
    execFileSync("magick", [
      file, "-auto-orient", "-resize", max + "x" + max + ">",
      "-strip", "-quality", String(quality), tmp
    ], { stdio: "pipe" });
  } catch (err) {
    skipped++;
    try { fs.unlinkSync(tmp); } catch (e) {}
    return;
  }
  const next = fs.statSync(tmp).size;
  const saved = (orig - next) / orig * 100;
  if (next < orig && saved >= minSave) {
    after += next;
    changed++;
    if (write) {
      const dest = file.replace(/\.(png|jpe?g)$/i, ".webp");
      fs.renameSync(tmp, dest);
      if (dest !== file) fs.unlinkSync(file);
    } else {
      fs.unlinkSync(tmp);
    }
  } else {
    after += orig;
    skipped++;
    fs.unlinkSync(tmp);
  }
});
const pct = before ? ((before - after) / before * 100).toFixed(1) : "0";
console.log((write ? "wrote" : "dry-run") + " " + list.length + " files");
console.log("would shrink " + changed + ", leave " + skipped);
console.log("bytes " + before + " -> " + after + " (" + pct + "% smaller)");
console.log("Catalog JS does not contain the photos. This only shrinks image files.");
