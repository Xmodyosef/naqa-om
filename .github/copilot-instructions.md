# Naqa store + admin

Follow `docs/ENGINEERING-RULES.md` and root `AGENTS.md`.

Critical:
- Bilingual AR/EN for every UI string.
- Hide product = overrides.hidden + Firestore; fix Object.assign unhide; no store flash via empty mergeOverrides.
- Never break `A.refreshProductsFromBundle` in `js/admin/core.js`.
- Rebuild `js/store.min.js` with `scripts/build-store.sh` after store source changes.
- `js/core.js` ≠ `js/admin/core.js`.

- Admin search: 34px tall, ≤220px wide, orders tab only. No document.write in i18n. No booting flash in fbBoot.
