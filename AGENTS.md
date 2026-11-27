# Agent instructions — Naqa (naqa-om)

Before changing code, read **`docs/ENGINEERING-RULES.md`** and **`docs/DESIGN-LOCK.md`**.
Live site state (what is actually shipped): **`docs/LIVE.md`**. Deep external audit: **`docs/AUDIT-DEEP.md`**.

Live URL: https://xmodyosef.github.io/naqa-om/  
Cache key (store assets): see `index.html` (`?v=20261127c9` as of 2026-11-27). `cloud-overrides.js` is also c8. Other files may keep independent keys (e.g. products b7) until that bundle changes.

## Hard requirements
1. **Arabic + English always** — never ship a fix for one language only (store `T()` / `ui` in `js/core.js`; admin `dict-ar.js` + `dict-en.js`).
2. **Do not break hide/overrides** — ENGINEERING-RULES §2 (Object.assign + store flash).
3. **admin/core.js** — `A.refreshProductsFromBundle` must be a real top-level function, never inside `.map` after `return`.
4. **Store rebuild** — after editing any store source listed in `scripts/build-store.sh`, run `bash scripts/build-store.sh` and commit both `js/store.min.js` and `css/store.min.css`. Bump `?v=` in `index.html`.
5. **Verify live** when user says “not working” — check GitHub Pages / `main`; do not assume local only.
6. **No GitHub PAT** in settings UI for product publish — Firestore `naqa/overrides` only.
7. **Product images (STRICT)** — see `docs/PRODUCT_IMAGES_RULE.md`:
    - `imgs[0]` = **real packshot on pure white background** (card + first sheet slide).
    - `imgs[1+]` = additional **real** product photos; **add only, never wipe** gallery.
    - No dots/thumbs under photos. No collage/logo-only as first image.
    - Reject publish if first shot is model/lifestyle/dark bg without packshot.
8. Orders: cancel with confirm, no hard-delete button.
9. **Admin search** — orders only, height 34px, width ≤ 220px. Never stretch full width.
10. **i18n admin** — never `document.write` in `js/admin/i18n.js`. Load `dict-ar.js` then `dict-en.js` before `i18n.js`.
11. **Auth boot** — do not start `fbBoot` with `renderAuthUI("booting")`. `enterOpen` must always call `loadAdminModules`.
12. **No add-button flash** — `#addProductBtn` and `#ordersSearchWrap` start `hidden`.
13. **Design lock** — brand button `#8d3048`. No admin sidebar. Desktop admin only in `css/admin/desktop.css` (≥1100px).

## Storefront locks (shipped 2026-11-27 — do not undo without explicit request)
14. **Home** = swipeable hero banner (`hero-swipe`) + campaign product rails. No auto-crawl rails (`naqaStartCampRails` stub only).
15. **Category chips** (`#cats`): `الكل · عناية · وجه · شفاه · عيون · حواجب · أدوات · شعر`. **No «عطور» button.** Click clears `currentCatalog` / `query` / `currentConcern` / search input, then filters.
16. **Search**: live filter on input; multi-word AND; SKU/brand/name; clears catalog filters while searching; exact SKU/name on submit opens product sheet.
17. **Chrome hide on scroll**: collapse height of `.search-row` + `.nav-cats` (no empty reserved block).
18. **Product sheet**: image first; **no carousel dots / no thumbnail strip** (swipe only; all photos remain). Pull-down **closes sheet** — never `location.reload()`.
19. **Sheet horizontal lock**: `overflow-x:hidden` on sheet card; carousel `overscroll-behavior-x: contain`; no left/right rubber-band into empty space.
20. **`#grid`**: no 280px empty min-height when empty/hidden.
21. **Admin products catalog cache**: `data/products.admin.min.js?v=…` may be bumped alone so the panel loads new products; do not change other admin module keys unless asked.
22. **Bank transfer** stays hidden until name + IBAN are set (intentional).
23. Prefer short Arabic summaries before large changes when the user asks «لخّص قبل لا تبدأ».

24. **Summarize before coding** when the user says «لخّص قبل لا تبدأ» — short plan, wait for «ابدا».
25. **Admin scope** — do not overhaul admin modules/cache unless asked; products catalog bust alone is enough for “تحديث المنتجات”.
26. **No orphan catalog load** — do not re-link deleted/unused heavy bundles (e.g. old 199-SKU bundle) into the live store.
27. **Document live truth** in `docs/LIVE.md`; do not revive deleted status/audit/plan docs.

28. **No live `tmp/`** — never commit or deploy `tmp/`, packshot scratch, batch sources, or QA dump folders to the storefront root. Keep intermediates out of `main` / GitHub Pages.
29. **SEO pages** — do not re-run / land `scripts/build-seo-pages.js` in a way that wipes existing product redirects or SEO routes unless the user explicitly asked for an SEO rebuild. Prefer leaving `p/` redirects and current SEO output intact.

Project map: `docs/MAP.md` · Structure: `docs/STRUCTURE.md` · Live workflow: `docs/LIVE.md` · Images: `docs/PRODUCT_IMAGES_RULE.md`
