# Product images rule (LOCKED)

## Behavior
1. **Gallery is truth on Save** — what you see in the edit screen is what is stored.
2. **✕ deletes only that photo** — other photos stay. No magic re-injection of catalog shots on save.
3. **Intentional deletes** are stored in `removedImgs` so reload does not bring them back.
4. **Wipe repair** only when stored imgs are *only* `fs:`/`https` while the product still has `media/*` catalog (old bug). Never on intentional delete.
5. **Cloud sanitize** allows `media/*`, `fs:`, `https://` and `removedImgs`.

## Login performance
- Overrides load **once** (deduped promise).
- No auto cloud rewrite after repair.
- `getIdToken(false)` — no forced refresh every save.

## Code
- `js/admin/core.js` — keepImgs / isWipeImgs / merged / repairAllProductImgs
- `js/admin/products.js` — openEdit / delete / saveEdit
- `js/cloud-overrides.js` — sanitize + load
- `js/core.js` — storefront merge


## Arabic + English
Same code path for Arabic and English. No separate AR/EN image save.
Switch language with the admin language button — edit form reloads labels via `setLang` → `openEdit`.
