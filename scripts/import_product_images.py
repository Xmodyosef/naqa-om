#!/usr/bin/env python3
"""Import curated real product gallery images from verified Shopify product pages."""
from __future__ import annotations
import hashlib, io, json, re, sys, urllib.request, urllib.parse
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/product-image-sources.json"
CATALOG = ROOT / "data/products.bundle.js"
MAX_BYTES = 12 * 1024 * 1024
MIN_EDGE = 300
UA = "NaqaProductImageImporter/2.0 (+https://github.com/Xmodyosef/naqa-om)"

def fail(msg):
    print("ERROR:", msg, file=sys.stderr)
    raise SystemExit(1)

def fetch(url, accept="*/*"):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    try:
        with urllib.request.urlopen(req, timeout=35) as res:
            data = res.read(MAX_BYTES + 1)
            ctype = res.headers.get_content_type()
    except Exception as exc:
        fail(f"Request failed for {url}: {exc}")
    if len(data) > MAX_BYTES:
        fail(f"Response exceeds {MAX_BYTES} bytes: {url}")
    return data, ctype

def shopify_gallery(entry):
    page = entry.get("sourcePage", "").strip()
    expected = entry.get("sourceTitleIncludes", "").strip()
    parsed = urllib.parse.urlparse(page)
    if parsed.scheme != "https" or not parsed.hostname or not expected:
        fail(f"Product {entry.get('id')}: sourcePage and sourceTitleIncludes are required.")
    if parsed.path.endswith(".js"):
        json_url = page
    else:
        json_url = parsed._replace(path=parsed.path.rstrip("/") + ".js", query="", fragment="").geturl()
    data, ctype = fetch(json_url, "application/json")
    if "json" not in ctype and not data.lstrip().startswith(b"{"):
        fail(f"Shopify product endpoint did not return JSON: {json_url} ({ctype})")
    try:
        product = json.loads(data)
    except Exception as exc:
        fail(f"Invalid product JSON for {entry['id']}: {exc}")
    title = str(product.get("title", ""))
    if expected.casefold() not in title.casefold():
        fail(f"Source title mismatch for product {entry['id']}: expected {expected!r}, got {title!r}")
    images = product.get("images") or []
    urls = []
    for item in images:
        url = item.get("src") if isinstance(item, dict) else item
        if not isinstance(url, str):
            continue
        if url.startswith("//"):
            url = "https:" + url
        u = urllib.parse.urlparse(url)
        if u.scheme == "https" and u.hostname and url not in urls:
            urls.append(url)
    if len(urls) < 3:
        fail(f"Only {len(urls)} gallery images found for product {entry['id']} ({title}); need 3.")
    return title, urls

def image_bytes(url):
    data, ctype = fetch(url, "image/avif,image/webp,image/png,image/jpeg,*/*")
    if ctype not in ("image/jpeg", "image/png", "image/webp", "image/avif"):
        fail(f"Gallery URL did not return an image (Content-Type={ctype}): {url}")
    return data

def load_image(data, label):
    try:
        im = Image.open(io.BytesIO(data))
        im = ImageOps.exif_transpose(im).convert("RGB")
        im.load()
    except Exception as exc:
        fail(f"Invalid image {label}: {exc}")
    if min(im.size) < MIN_EDGE:
        fail(f"Image too small {label}: {im.size}")
    return im

def signature(im):
    return hashlib.sha256(im.resize((96, 96)).tobytes()).hexdigest()

def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    raw = CATALOG.read_text(encoding="utf-8")
    prefix = "window.NAQA_PRODUCTS="
    if not raw.startswith("/* AUTO-GENERATED full catalog (admin) */\\n" + prefix):
        fail("Unexpected product catalog format; refusing to rewrite it.")
    start = raw.index(prefix) + len(prefix)
    end = raw.rfind(";")
    products = json.loads(raw[start:end])
    by_id = {int(p["id"]): p for p in products}
    entries = manifest.get("products", [])
    if len(entries) != 50:
        fail(f"Expected exactly 50 target products; found {len(entries)}.")
    pending = [e for e in entries if not e.get("sourcePage") or not e.get("sourceTitleIncludes")]
    if pending:
        print(f"Source curation pending: {len(pending)} of 50 products still need a verified source page. No files changed.")
        for e in pending[:12]:
            print(f"  - {e.get('id')}: {e.get('name')}")
        if len(pending) > 12:
            print(f"  ... and {len(pending) - 12} more")
        return
    staged, seen_urls, seen_pixels = {}, set(), set()
    for entry in entries:
        pid = int(entry["id"])
        p = by_id.get(pid)
        if not p or p.get("brand") != entry["brand"] or p.get("sku") != entry["sku"] or p.get("nameEn") != entry["name"]:
            fail(f"Catalog identity mismatch for product id {pid}; refresh manifest before importing.")
        title, urls = shopify_gallery(entry)
        primary = ROOT / f"media/products/p{pid}_0.webp"
        if not primary.is_file():
            fail(f"Missing primary image for product {pid}; refusing import.")
        primary_im = load_image(primary.read_bytes(), f"existing primary p{pid}_0.webp")
        local_signatures = {signature(primary_im)}
        chosen = []
        for url in urls:
            if url in seen_urls:
                continue
            data = image_bytes(url)
            im = load_image(data, f"product {pid} gallery")
            sig = signature(im)
            if sig in local_signatures or sig in seen_pixels:
                continue
            local_signatures.add(sig)
            seen_pixels.add(sig)
            chosen.append((url, im))
            if len(chosen) == 3:
                break
        if len(chosen) != 3:
            fail(f"Could not find 3 distinct non-primary gallery images for product {pid} ({title}); found {len(chosen)}.")
        paths = []
        for idx, (url, im) in enumerate(chosen, start=1):
            seen_urls.add(url)
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
    # All 150 images must pass before any repository file is changed.
    for rel, data in staged.items():
        dest = ROOT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
    CATALOG.write_text("/* AUTO-GENERATED full catalog (admin) */\\nwindow.NAQA_PRODUCTS=" + json.dumps(products, ensure_ascii=False, separators=(",", ":")) + ";\\n", encoding="utf-8")
    print(f"Imported {len(staged)} verified images for {len(entries)} products.")
    print(f"Total WebP bytes: {sum(map(len, staged.values()))}")

if __name__ == "__main__":
    main()
