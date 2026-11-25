# Naqa store + admin

Follow `docs/ENGINEERING-RULES.md` and root `AGENTS.md`.

Critical:
- Bilingual AR/EN for every UI string.
- Hide product = overrides.hidden + Firestore; fix Object.assign unhide; no store flash via empty mergeOverrides.
- Never break `A.refreshProductsFromBundle` in `js/admin/core.js`.
- Rebuild `js/store.min.js` with `scripts/build-store.sh` after store source changes.
- `js/core.js` ≠ `js/admin/core.js`.

- Admin search: 34px tall, ≤220px wide, orders tab only. No document.write in i18n. No booting flash in fbBoot.

- Design lock: `docs/DESIGN-LOCK.md`. Do not change brand colors (`#8d3048` primary, `#fdf8f6` background) or move header/admin buttons. No sidebar. Desktop admin rules live only in `css/admin/desktop.css` (min-width 1100px).

