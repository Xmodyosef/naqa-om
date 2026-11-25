# نقاء — Naqa (عُمان)

متجر عناية ومكياج ثابت على GitHub Pages. الطلب عبر واتساب.

## الملفات (قسمناها عشان الإصلاح يكون سهل)

| ملف | وش فيه |
|---|---|
| `index.html` | هيكل الصفحة فقط (هيدر، شبكة، سلة، فوتر) |
| `css/store.min.css` | تنسيق المتجر (يُبنى من `css/store/`) |
| `products.js` | بيانات المنتجات (أسعار، صور، أوصاف) |
| `js/config.js` | رقم واتساب، العملة، دومينات الماركات |
| `js/core.js` | الحالة، الترجمة، الماركة، التوجيه |
| `js/render/` | كروت المنتجات والشبكة |
| `js/sheet/` | صفحة المنتج ونظرة سريعة |
| `js/cart.js` | السلة والدرج |
| `js/app.js` | الأحداث، السحب، التشغيل |

## تشغيل

افتحي: https://xmodyosef.github.io/naqa-om/

أو محلياً أي سيرفر ثابت على المجلد.

## تعديل سريع

- سعر أو منتج → `products.js`
- نص عربي/إنجليزي → `js/core.js` (كائن `ui`)
- رقم واتساب → `js/config.js`
- شكل/ألوان → `css/store/` ثم `scripts/build-store.sh`
- نظرة سريعة / سحب → `js/sheet/` و `js/app.js`

## هيكل الملفات

انظر [docs/STRUCTURE.md](docs/STRUCTURE.md) و [docs/ADMIN.md](docs/ADMIN.md).
