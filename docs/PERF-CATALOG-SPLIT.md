# Catalog performance split (2026-11-25 clean1)

| File | Role | ~Size |
|------|------|-------|
| `data/products.min.js` | Store first paint (cards: name/price/img/stock) | ~74 KB |
| `data/products.detail.json` | Lazy desc/use/skin after first render | ~189 KB |
| `data/products.admin.min.js` | Admin full catalog after sign-in | ~260 KB |

Rebuild: `node scripts/build-products-bundle.js`  
Store boot merges detail via `naqaMergeProductDetails` in `js/core.js` + fetch in `js/app.js`.
