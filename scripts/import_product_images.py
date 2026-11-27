#!/usr/bin/env python3
"""Import three curator-approved real product images per catalog item."""
from __future__ import annotations
import hashlib, io, json, os, re, sys, urllib.request, urllib.parse
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/product-image-sources.json"
CATALOG = ROOT / "data/products.bundle.js"
MAX_BYTES = 12 * 1024 * 1024
MIN_EDGE = 300
UA = "NaqaProductImageImporter/1.0 (+https://github.com/Xmodyosef/naqa-om)"

def fail(msg):
    print("ERROR:", msg, file=sys.stderr)
    raise SystemExit(1)

def get_bytes(url):
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname:
        fail(f"Only direct HTTPS image URLs are accepted: {url!r}")
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "image/avif,image/webp,image/png,image/jpeg"})
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            ctype = res.headers.get_content_type()
            data = res.read(MAX_BYTES + 1)
    except Exception as exc:
        fail(f"Download failed for {url}: {exc}")
    if len(data) > MAX_BYTES:
        fail(f"Image exceeds {MAX_BYTES} bytes: {url}")
    if ctype not in ("image/jpeg", "image/png", "image/webp", "image/avif"):
        fail(f"URL did not return an image (Content-Type={ctype}): {url}")
    return data

def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    raw = CATALOG.read_text(encoding="utf-8")
    prefix = "window.NAQA_PRODUCTS="
    if not raw.startswith("/* AUTO-GENERATED full catalog (admin) */\n" + prefix):
        fail("Unexpected product catalog format; refusing to rewrite it.")
    start = raw.index(prefix) + len(prefix)
    end = raw.rfind(";")
    products = json.loads(raw[start:end])
    by_id = {int(p["id"]): p for p in products}
    entries = manifest.get("products", [])
    if len(entries) != 50:
        fail(f"Expected exactly 50 target products; found {len(entries)}.")
    seen_urls, seen_pixels, staged = set(), set(), {}
    for entry in entries:
        pid = int(entry["id"])
        p = by_id.get(pid)
        if not p or p.get("brand") != entry["brand"] or p.get("sku") != entry["sku"] or p.get("nameEn") != entry["name"]:
            fail(f"Catalog identity mismatch for product id {pid}; refresh manifest before importing.")
        urls = entry.get("imageUrls", [])
        if len(urls) != 3 or any(not u for u in urls):
            fail(f"Product {pid} ({entry['name']}) needs 3 curator-verified imageUrls; found {len(urls)}.")
        paths = []
        for idx, url in enumerate(urls, start=1):
            if url in seen_urls:
                fail(f"Repeated source URL across batch: {url}")
            seen_urls.add(url)
            data = get_bytes(url)
            try:
                im = Image.open(io.BytesIO(data))
                im = ImageOps.exif_transpose(im).convert("RGB")
                im.load()
            except Exception as exc:
                fail(f"Invalid image for product {pid}: {exc}")
            if min(im.size) < MIN_EDGE:
                fail(f"Image too small for product {pid}: {im.size}")
            sig = hashlib.sha256(im.resize((96, 96)).tobytes()).hexdigest()
            if sig in seen_pixels:
                fail(f"Duplicate/near-identical image detected in batch at product {pid}, image {idx}.")
            seen_pixels.add(sig)
            out = io.BytesIO()
            im.save(out, format="WEBP", quality=88, method=6)
            path = f"media/products/p{pid}_{idx}.webp"
            target = ROOT / path
            if target.exists():
                fail(f"Refusing to overwrite existing gallery image: {path}")
            staged[path] = out.getvalue()
            paths.append(path)
        existing = p.get("imgs", [])
        if not existing or existing[0] != f"media/products/p{pid}_0.webp":
            fail(f"Unexpected primary image path for product {pid}; refusing to modify.")
        if len(existing) != 1:
            fail(f"Product {pid} no longer has exactly one image; refresh the batch.")
        p["imgs"] = existing + paths
    # Write only after every URL and image passed validation.
    for rel, data in staged.items():
        dest = ROOT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
    CATALOG.write_text("/* AUTO-GENERATED full catalog (admin) */\nwindow.NAQA_PRODUCTS=" + json.dumps(products, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"Imported {len(staged)} verified images for {len(entries)} products.")
    print(f"Total WebP bytes: {sum(map(len, staged.values()))}")

if __name__ == "__main__":
    main()
