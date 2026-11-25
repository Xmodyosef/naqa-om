# قواعد هندسة نقاء (دائمة) — Naqa Engineering Rules

> **هدف الملف:** منع تكرار أخطاء حقيقية حصلت في المشروع.  
> **يلزم** أي تعديل (بشري أو AI) يقرأ هذا الملف قبل لمس الكود.  
> آخر تحديث: 2026-11-25 · يُحدَّث عند كل درس جديد.

---

## 0) مبدأ واحد

| المتجر | اللوحة |
|--------|--------|
| `index.html` + `js/store.min.js` | `admin.html` + `js/admin/*` |
| عام للزبائن | محمي بـ Firebase Auth |

- **ملف واحد للمنطق** — عربي/إنجليزي = مفاتيح i18n فقط، مو نسختين من المنطق.
- `js/core.js` (متجر) **≠** `js/admin/core.js` (لوحة). لا تخلط.
- بعد أي تغيير في مصادر المتجر (`js/app.js`, `js/core.js`, `js/render/*`, …) **يجب** تشغيل `bash scripts/build-store.sh` ثم دفع `js/store.min.js`.

---

## 1) عربي + إنجليزي دائماً (قاعدة إلزامية)

1. أي نص يظهر للمستخدم في اللوحة → مفتاح في **`js/admin/i18n/dict-ar.js` و `dict-en.js` معاً**.
2. أي نص في المتجر → مسار الترجمة الموجود (T / applyLang) للغتين.
3. **ممنوع** إصلاح عربي فقط أو إنجليزي فقط.
4. التحقق: غيّري اللغة في اللوحة والمتجر وتأكدي أن الزر/الرسالة موجودان.

---

## 2) إخفاء المنتج (Hide) — دروس 2026-11-25

### 2.1 الواجهة
- قائمة المنتجات **يجب** أن تحتوي زراً `data-hide` (إخفاء/إظهار) **و** `data-open` (تعديل).
- إذا المعالج يستمع لـ `[data-hide]` والزر غير موجود في HTML → الزر «مو شغال» ظاهرياً.
- نصوص: `p_hide` / `p_show` / `p_hidden` في dict-ar + dict-en.

### 2.2 المنطق
- الإخفاء = `overrides[id].hidden = true` في `localStorage` (`naqa_overrides`) **ثم** مزامنة Firestore `naqa/overrides`.
- **ليس** عبر GitHub token ولا تعديل `products.min.js` يدوياً لكل إخفاء.
- `toggleHide` و checkbox `f_hidden` يجب أن يستدعيا `A.syncOverridesCloud` (أو `publishLive` = نفس الشيء).

### 2.3 خطأ Object.assign (تكرر سابقاً)
```js
// ❌ غلط: عند إلغاء الإخفاء next ما فيه hidden → يبقى prev.hidden
A.overrides[id] = Object.assign({}, prev, next);

// ✅ صح:
A.overrides[id] = Object.assign({}, prev, next);
if (!next.hidden) delete A.overrides[id].hidden;
```
**قاعدة عامة:** أي علم boolean يُلغى (hidden، flags…) لازم `delete` صريح بعد الدمج.

### 2.4 وميض المتجر (يظهر ثم يختفي)
**السبب الذي حصل فعلياً:**
1. `mergeOverrides({})` كان يعمل `p.hidden = false` لكل المنتجات.
2. `render()` يظهر المخفي.
3. بعد تحميل Firestore يُعاد الإخفاء → وميض.

**القواعد:**
- `mergeOverrides`: إذا **ما في** override لهذا المنتج → **لا تلمسي** `p.hidden` (لا تفرضي ظاهر).
- لا تستدعي `mergeOverrides({})` كـ «تصفير».
- قبل أول رسم: طبّقي كاش الجلسة `sessionStorage.naqa_ov_pub_v1` إن وُجد.
- بعد جلب السحابة: احفظي الكاش + `render()`.
- `store-cloud-boot.js`: تشغيل فوري + إعادة محاولة قصيرة (مو تأخير 400ms فقط).

### 2.5 اختبار إخفاء (قبل ما تقولين «تم»)
- [ ] لوحة عربي: إخفاء من القائمة → رسالة → المنتج في تبويب «مخفية»
- [ ] لوحة إنجليزي: Hide / Show
- [ ] تعديل منتج: ✓ إخفاء فوري بدون انتظار «حفظ» فقط
- [ ] إلغاء الإخفاء يمسحه من overrides (مو يبقي true)
- [ ] متجر عربي + إنجليزي: المنتج **ما يظهر** (ولا وميض بعد أول زيارة بنفس الجلسة)
- [ ] Firestore: المستند `naqa/overrides` يحتوي `"id": { "hidden": true }`

---

## 3) تحميل موديولات اللوحة (deferred)

- الموديولات الثقيلة تُحمَّل **بعد** تسجيل الدخول (`js/admin/load-modules.js`).
- **إلزامي بعد التحميل:**
  1. `A.refreshProductsFromBundle()` — يملأ `A.products` من `NAQA_PRODUCTS`
  2. `A.bindProductListClicks()` إن وُجدت
  3. `A.paintList` / المسار الحالي
- **ممنوع** تعريف `refreshProductsFromBundle` داخل `.map(function(){ return ...; /* كود بعد return */ })` — كود ميت ويفشل بهدوء.
- `A.products = []` عند الإقلاع؛ الملء فقط بعد وصول `data/products.bundle.js`.

```js
// ✅ الشكل الصحيح
A.products = [];
A.refreshProductsFromBundle = function () {
  A.products = (w.NAQA_PRODUCTS || []).map(function (p) {
    return Object.assign({ imgs: [] }, p);
  });
  return A.products;
};
```

---

## 4) overrides والسحابة (Firebase)

| مكان | ماذا يُحفظ |
|------|------------|
| `localStorage.naqa_overrides` | تعديلات المشرفة على **هذا** الجهاز |
| Firestore `naqa/overrides` | نفس الخريطة للعامة (قراءة) + كتابة للمشرفة فقط |
| المتجر | **لا** يقرأ localStorage للإخفاء/السعر (أجهزة الزبائن) — فقط سحابة + كاش جلسة عام |

- `sanitizeMap`: لا ترفعي `data:image` base64 للسحابة؛ احتفظي بمسارات `media/` و `https`.
- عند فشل المزامنة: احفظي محلياً + رسالة واضحة عربي/إنجليزي (لا تبتلعي الخطأ).
- **لا** تطلبين GitHub PAT من الشاشة الرئيسية للإعدادات مرة ثانية (أُزيل عن قصد).

قواعد Firestore التفصيلية: `docs/P2-FIRESTORE-RULES.md` و `docs/FIRESTORE-OVERRIDES.md`.

---

## 5) صور المنتج (دائمة)

راجع: `docs/PRODUCT_IMAGES_RULE.md`

- صورة جديدة = **إضافة** للمعرض، **ممنوع** مسح الباقي.
- الحذف فقط بزر ✕.
- الحد 6.
- `removedImgs` + `keepImgs` / منع wipe في `merged`.

---

## 6) الطلبات والمالية

- **لا زر حذف طلب نهائي** — إلغاء فقط مع **تأكيد** (`cancelConfirm`).
- تصدير Excel للطلبات/المالية موجود؛ الاستيراد بحذر.
- فلتر التاريخ: مفاتيح `dateFrom` / `dateTo` + منطقة `Asia/Muscat`.
- الطلبات تبقى على الجهاز (localStorage) — **لا تُنشر** لـ GitHub.

---

## 7) الأمان والخصوصية

- البريد **لا يُعرض** في واجهة اللوحة بعد الدخول (انظر `docs/EMAIL-PRIVACY.md`).
- لا توكين GitHub دائم في localStorage؛ النشر للمنتجات = Firestore.
- `admin.html` / `panel.html`: noindex؛ لا تروّجي الرابط في المتجر.
- Firebase Auth = بوابة اللوحة؛ المتجر مفتوح بدون حساب.
- `requireAuth` يمنع العملية فقط — **لا** يخفي اللوحة كاملة من خطأ فرعي.

---

## 8) التنقل والواجهة (لوحة)

- سايدبار: أب + أبناء **في الجنب** (نمط سلة/زد) — مو نقل الأبناء لوسط الصفحة إلا بطلب صريح جديد.
- `A.go` / hash: `#/products/...`, `#/orders/...`, `#/products/edit/:id`
- أزرار الرجوع/السحب: ترجع للقسم السابق بشكل صحيح.
- Pagination منتجات: 50/صفحة + pager مربوط.

---

## 9) البناء والنشر

```bash
# بعد تعديل مصادر المتجر
bash scripts/build-store.sh

# تحقق
node --check js/admin/core.js
node --check js/admin/products.js
node --check js/core.js
node --check js/app.js
```

- Cache-bust: حدّثي `?v=...` في `admin.html` / `index.html` / `load-modules.js` عند تغيير JS حرج.
- GitHub Pages: الدفع لـ `main` ينشر؛ انتظري دقيقة + تحديث قوي عند الاختبار.

---

## 10) ممنوع / مطلوب عند أي «إصلاح»

| ممنوع | مطلوب |
|-------|--------|
| افتراض بدون فتح الملف المنشور | `curl` أو قراءة الملف من `main` |
| إصلاح لغة واحدة | dict-ar + dict-en |
| لصق CSS/JS مكرر فوق عطل قديم | ابحثي عن السبب الجذري |
| `mergeOverrides({})` لتصفير hidden | كاش + دمج جزئي |
| كود بعد `return` داخل map | دوال على `A.*` واضحة |
| القول «تم» بدون مسار اختبار | قائمة §2.5 أو ما يعادلها |
| تعديل `store.min.js` يدوياً | عبر `build-store.sh` |
| GitHub token كحل للإخفاء | Firestore overrides |

---

## 11) سجل أخطاء مثبتة (لا تعيديها)

| # | العَرَض | السبب الجذري | الملف |
|---|---------|---------------|--------|
| 1 | زر إخفاء «مو شغال» | لا يوجد `data-hide` في HTML القائمة | `products.js` paintList |
| 2 | إظهار من التعديل ما يشتغل | `Object.assign` يبقي `hidden` | `saveEdit` |
| 3 | منتج يظهر ثم يختفي في المتجر | `mergeOverrides({})` + تأخير السحابة | `core.js` + `app.js` |
| 4 | منتجات فاضي بعد الدخول | `refreshProductsFromBundle` ميت داخل map | `admin/core.js` |
| 5 | بطء شاشة الدخول | تحميل كل الموديولات قبل Auth | `load-modules.js` (مؤجّل بعد الدخول) |
| 6 | رفع صورة يمسح المعرض | منطق wipe | `PRODUCT_IMAGES_RULE.md` |
| 7 | إعدادات تطلب توكن GitHub | مسار نشر قديم | أُزيل؛ السحابة فقط |
| 8 | زر إخفاء القائمة «ما يشتغل» | مستمعان على `#list` → toggleHide مرتين | handler واحد + capture + لا data-open على البطاقة |

---

## 12) كيف تضيفين قاعدة جديدة

1. اكتبي الصف في الجدول §11 (عرض / سبب / ملف).
2. أضيفي فقرة قصيرة تحت القسم المناسب.
3. Commit: `docs(rules): …`
4. لا تحذفي درساً قديماً — أرّخيه.

---

## مراجع سريعة

- `docs/STRUCTURE.md` · `docs/MAP.md`
- `docs/FIREBASE.md` · `docs/FIRESTORE-OVERRIDES.md` · `docs/P2-FIRESTORE-RULES.md`
- `docs/PRODUCT_IMAGES_RULE.md` · `docs/EMAIL-PRIVACY.md` · `docs/LOCK-PANEL.md`
