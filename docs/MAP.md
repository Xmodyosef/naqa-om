# خريطة نقاء — أين الملف؟ (عربي + English)

**لا نفصل لوحة كاملة عربي ولوحة إنجليزي.**  
الترجمة = ملفان فقط: `dict-ar.js` و `dict-en.js`. نفس الكود.

---

## ١) المدخلات

| ماذا | الرابط / الملف |
|------|----------------|
| المتجر | `index.html` |
| اللوحة | `admin.html` |
| اختصار لوحة | `panel.html` → يحوّل لـ admin |
| اختصار متجر | `store.html` → يحوّل لـ index |

---

## ٢) المتجر (Store)

| تحتاجين تعدّلين | الملف |
|-----------------|--------|
| واجهة + تحميل | `index.html` |
| منطق المتجر (مصدر) | `js/core.js`, `js/cart.js`, `js/app.js`, `js/render/*`, `js/sheet/*`, `js/features/*` |
| **ما يشتغل عند الزبونة** | `js/store.min.js` + `css/store.min.css` (بعد `bash scripts/build-store.sh`) |
| مزامنة تعديلات اللوحة | `js/cloud-overrides.js` + `js/store-cloud-boot.js` |
| كتالوج منتجات | `data/brands/<ماركة>.js` → يُبنى إلى `data/products.min.js` |
| صور منتجات | `media/products/` |
| إعدادات Firebase | `js/firebase-config.js` |

> لا تعدّلي `store.min.js` يدوياً — عدّلي المصدر ثم ابنِ.

---

## ٣) اللوحة (Admin)

| تحتاجين تعدّلين | الملف |
|-----------------|--------|
| هيكل الصفحة | `admin.html` |
| تنقل / تبويبات | `js/admin/app.js` |
| حالة + دمج صور + طلبات | `js/admin/core.js` |
| منتجات + معرض صور | `js/admin/products.js` |
| طلبات | `js/admin/orders.js` |
| عملاء / مالية / رئيسية / إعدادات / تقييمات | `js/admin/*.js` بنفس الاسم |
| دخول Firebase | `js/admin/firebase-gate.js` |
| ترجمة عربي | `js/admin/i18n/dict-ar.js` |
| ترجمة إنجليزي | `js/admin/i18n/dict-en.js` |
| محرّك الترجمة | `js/admin/i18n.js` |
| مزامنة سحابة | `js/cloud-overrides.js` |
| CSS | `css/admin.css` → `css/admin/*.css` |

### أسماء تتشابه — لا تخلطين

| الاسم | المتجر | اللوحة |
|-------|--------|--------|
| `core.js` | `js/core.js` | `js/admin/core.js` |
| `app.js` | `js/app.js` | `js/admin/app.js` |
| `products.js` | لا (كتالوج في `data/brands`) | `js/admin/products.js` |

---

## ٤) عربي / إنجليزي — كيف؟

| الجزء | الطريقة |
|-------|---------|
| لوحة | `dict-ar.js` + `dict-en.js` + زر اللغة |
| متجر | نصوص داخل `js/core.js` (كائني `ar` / `en`) داخل `store.min.js` |
| **ممنوع** | نسختان من `admin.html` أو مجلد `admin-ar` / `admin-en` كامل |

---

## ٥) بعد كل تعديل مهم

```bash
# كتالوج
node scripts/build-products-bundle.js

# متجر (JS+CSS مضغوط)
bash scripts/build-store.sh
```

---

## ٦) محذوف / بلا فائدة (لا تبحثين عنها)

- `preview-nav.html`, `preview-salla.html` — تجارب قديمة
- `js/admin/i18n/ar/*.json`, `js/admin/i18n/en/*.json` — بقايا غير مستخدمة (الترجمة من dict فقط)
