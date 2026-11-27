# هيكل المشروع

**الحي المثبت:** [LIVE.md](./LIVE.md)  
**القواعد:** [ENGINEERING-RULES.md](./ENGINEERING-RULES.md) · [DESIGN-LOCK.md](./DESIGN-LOCK.md) · [../AGENTS.md](../AGENTS.md)  
**الخريطة:** [MAP.md](./MAP.md)

## قاعدة واحدة
- متجر = `index.html` + `js/store.min.js` + `css/store.min.css`
- لوحة = `admin.html` + `js/admin/*`
- ترجمة لوحة = `dict-ar.js` / `dict-en.js`
- كتالوج = `data/brands/*.js` → حزم products

## لا تخلطين
`js/core.js` ≠ `js/admin/core.js`

## قبل أي دفع
1. اقرأ ENGINEERING-RULES + DESIGN-LOCK + LIVE
2. عربي + إنجليزي
3. إن لمست المتجر: `bash scripts/build-store.sh` + bump `?v=`
4. إن لمست hide/overrides: اختبر الإخفاء (§2)
