# خريطة ملفات نقاء

الموقع ثابت على GitHub Pages. ما في خادم يدمج الملفات وقت الزيارة، فالدمج يصير قبل الرفع.

## الحجم

| المجلد | دوره | الحجم تقريباً |
|---|---|---|
| `media/` | صور المنتجات والشعارات، حوالي ١٠٠٠ ملف | ١٤ ميجا |
| `p/` | ١٩٩ صفحة منتج جاهزة للرابط | ٠٫٨ ميجا |
| `data/` | كتالوج المنتجات + ملفات الماركات + التعديلات | ٠٫٨ ميجا |
| `js/` | سلوك المتجر واللوحة | ٠٫٣ ميجا |
| `css/` | التنسيق | ٩٠ ك.ب |
| `scripts/` | أدوات البناء والدمج، ما تنزل للزبونة | ٤٧ ك.ب |

## وش ينفتح فعلياً

- المتجر `index.html` يحمّل `data/products.min.js` ثم `js/store.min.js`.
- اللوحة `admin.html` تحمّل `data/products.bundle.js` ثم ملفات `js/admin/`.
- `store.min.js` نسخة مجمّعة. المصدر المقسوم هو `js/cart.js` و`js/core.js` و`js/app.js` و`js/render/` و`js/sheet/` و`js/features/`.

## الترجمة

المصدر: `js/admin/i18n/ar/*.json` و`js/admin/i18n/en/*.json` (خمسة ملفات لكل لغة: chrome, orders, products, reviews, settings).

الدمج:

```
node scripts/merge-json.js --lang ar --out js/admin/i18n/dict-ar.js js/admin/i18n/ar/*.json
node scripts/merge-json.js --lang en --out js/admin/i18n/dict-en.js js/admin/i18n/en/*.json
```

اللوحة تحمّل لغة واحدة فقط عبر `js/admin/i18n.js`. تبديل اللغة ينزّل الملف الثاني عند الحاجة.

`scripts/merge-json.js` يدمج أي JSON: الكائنات تتداخل، والمصفوفات تُستبدل بالملف الأخير.

## ما انقسم

كتالوج المنتجات (حوالي ٢٦٠ ك.ب) يبقى ملفاً واحداً لأن البحث والعرض يحتاجان كل المنتجات. تقسيمه يزيد الطلبات وما يسرّع أول فتح.
