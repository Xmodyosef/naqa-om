# Naqa store + admin

Follow root `AGENTS.md`, `docs/ENGINEERING-RULES.md`, `docs/DESIGN-LOCK.md`, and live state `docs/LIVE.md`.

Critical:
- Bilingual AR/EN for every UI string.
- Hide product = overrides.hidden + Firestore; fix Object.assign unhide; no store flash via empty mergeOverrides.
- Rebuild store with `scripts/build-store.sh` after store source changes; bump `?v=` in `index.html`.
- `js/core.js` ≠ `js/admin/core.js`.
- Design lock: brand `#8d3048`, bg `#fdf8f6`. No admin sidebar.
- Store locks (2026-11-27): no عطور chip; no carousel dots/thumbs; sheet pull closes (no reload); horizontal overscroll locked; cats clear catalog filters; chrome-hide collapses height.
- Product images: imgs[0]=real packshot on white; imgs[1+]=extra real photos; never wipe gallery (`docs/PRODUCT_IMAGES_RULE.md`).
