# هيكل المشروع

الخريطة التفصيلية: **[docs/MAP.md](./MAP.md)**

## قاعدة واحدة
- متجر = `index.html` + `js/store.min.js`
- لوحة = `admin.html` + `js/admin/*`
- ترجمة لوحة = `dict-ar.js` / `dict-en.js` (مو لوحتين منفصلتين)
- كتالوج = `data/brands/*.js`

## لا تخلطين
`js/core.js` ≠ `js/admin/core.js`
