# هيكل المشروع

الخريطة التفصيلية: **[docs/MAP.md](./MAP.md)**  
**القواعد الدائمة (إلزامية):** **[docs/ENGINEERING-RULES.md](./ENGINEERING-RULES.md)**  
تعليمات الوكلاء: **[AGENTS.md](../AGENTS.md)**

## قاعدة واحدة
- متجر = `index.html` + `js/store.min.js`
- لوحة = `admin.html` + `js/admin/*`
- ترجمة لوحة = `dict-ar.js` / `dict-en.js` (مو لوحتين منفصلتين)
- كتالوج = `data/brands/*.js` + `data/products.bundle.js`

## لا تخلطين
`js/core.js` ≠ `js/admin/core.js`

## قبل أي PR / دفع
1. اقرأ `ENGINEERING-RULES.md`
2. عربي + إنجليزي
3. إن لمست المتجر: `bash scripts/build-store.sh`
4. اختبار إخفاء المنتج إن لمست products/overrides (§2.5)
