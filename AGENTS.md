# Agent instructions — Naqa (naqa-om)

Before changing code, read **`docs/ENGINEERING-RULES.md`** in full.

Hard requirements:
1. **Arabic + English always** — never ship a fix for one language only (`dict-ar.js` + `dict-en.js`).
2. **Do not break hide/overrides** — see ENGINEERING-RULES §2 (Object.assign + store flash).
3. **admin/core.js** — `A.refreshProductsFromBundle` must be a real top-level function, never inside `.map` after `return`.
4. **Store** — after editing `js/app.js` / `js/core.js` / render sources, run `bash scripts/build-store.sh`.
5. **Verify live files** when user says “not working” — fetch `https://xmodyosef.github.io/naqa-om/...` or read `main`; do not assume.
6. **No GitHub PAT** in settings UI for product publish — Firestore `naqa/overrides` only.
7. Product images: add only, never wipe gallery — `docs/PRODUCT_IMAGES_RULE.md`.
8. Orders: cancel with confirm, no hard-delete button.

Project map: `docs/MAP.md` · Structure: `docs/STRUCTURE.md`
