# هيكل ملفات نقاء (naqa-om)

تقسيم لتسهيل الإصلاح على GitHub — كل قسم في ملفه.

## المتجر (واجهة الزبونة)

| ملف | المسؤولية |
|-----|-----------|
| `index.html` | هيكل الصفحة + تحميل السكربتات |
| `css/naqa.css` | أنماط المتجر |
| `js/config.js` | إعدادات عامة (واتساب، عملة…) |
| `js/core.js` | لغة، منتجات، فلترة أساسية |
| `js/render.js` | رسم الشبكة والبطاقات |
| `js/sheet.js` | صفحة المنتج / نظرة سريعة |
| `js/cart.js` | السلة والدفع |
| `js/features/wish-concerns.js` | محفوظات + احتياجات البشرة |
| `js/features/bundles.js` | باقات + ماركات + ثقة |
| `js/features/quiz.js` | اختبار البشرة |
| `js/features/boot.js` | تشغيل المزايا |
| `js/extras.js` | رقم طلب، توست، روتين… |
| `data/oman-areas.js` | **مناطق عُمان فقط** (عدّلي هنا) |
| `data/products-*.js` | كتالوج المنتجات حسب النوع |
| `media/brands/` | شعارات الماركات |

## لوحة التحكم

| ملف | المسؤولية |
|-----|-----------|
| `admin.html` | هيكل التبويبات |
| `css/admin.css` | أنماط اللوحة |
| `js/admin/core.js` | حالة مشتركة + نسخ/نشر |
| `js/admin/dashboard.js` | الرئيسية |
| `js/admin/orders.js` | الطلبات |
| `js/admin/products.js` | المنتجات |
| `js/admin/customers.js` | العملاء |
| `js/admin/finance.js` | المالية |
| `js/admin/settings.js` | الإعدادات |
| `js/admin/app.js` | تشغيل + تبويبات |
| `docs/ADMIN.md` | شرح اللوحة |

## بيانات مشتركة

| ملف | ملاحظة |
|-----|--------|
| `data/orders.json` | سجل طلبات منشور (اختياري) |
| `data/overrides.json` | تعديلات منتجات من اللوحة |
| `order.html` | صفحة طلب قديمة (مرجع) |

## قاعدة سريعة

- عطل في **الطلب/المناطق** → `data/oman-areas.js` أو `js/cart.js`
- عطل في **الاختبار** → `js/features/quiz.js`
- عطل في **اللوحة طلبات** → `js/admin/orders.js`
- عطل في **منتج** → `data/products-*.js` أو `js/admin/products.js`

## أنماط المتجر (CSS)

| ملف | المسؤولية |
|-----|-----------|
| `css/store/base.css` | متغيرات، هيدر، هيرو، بطاقات، رفوف |
| `css/store/cart-chrome.css` | شريط السلة، درج، تذييل، واتساب |
| `css/store/sheet.css` | صفحة المنتج / نظرة سريعة / لايت بوكس |
| `css/store/features.css` | اختبار، محفوظات، باقات، checkout extras |

## العرض (render) وصفحة المنتج (sheet)

| ملف | المسؤولية |
|-----|-----------|
| `js/render/cards.js` | HTML البطاقة والرفوف |
| `js/render/main.js` | `applyLang` + `render()` |
| `js/sheet/carousel.js` | سلايدر الصور الدائري |
| `js/sheet/panel.js` | فتح/إغلاق المنتج واللايت بوكس |
