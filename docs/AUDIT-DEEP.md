# فحص عميق — متجر نقاء

> للنسخ والإرسال للفاحصين. **ليس** إعادة قراءة وثائق.  
> آخر تحديث: **2026-11-27**  
> المتجر: https://xmodyosef.github.io/naqa-om/?v=20261127c10  
> اللوحة: https://xmodyosef.github.io/naqa-om/admin.html  
> المستودع: https://github.com/Xmodyosef/naqa-om  

## اقرأ قبل البدء
1. [docs/LIVE.md](LIVE.md) — خاصة §9 حالة التجربة الحية  
2. [docs/AUDIT-BRIEF.md](AUDIT-BRIEF.md) — الفحص الشامل  
3. [AGENTS.md](../AGENTS.md)  
4. [ENGINEERING-RULES.md](ENGINEERING-RULES.md)  
5. [DESIGN-LOCK.md](DESIGN-LOCK.md)  
6. [PRODUCT_IMAGES_RULE.md](PRODUCT_IMAGES_RULE.md)  
7. [firestore.rules](../firestore.rules)  

## قواعد العمل
1. **ممنوع التخمين.** كل بند: `OK / FAIL / N/A / RISK` + دليل (مسار+سطر، Network، Console، فيديو 10–30ث).  
2. ممنوع نسخ رقم واتساب أو إيميل في التقرير/اللقطات.  
3. بنود LIVE §9 «شغال — مجرَّب حياً» لا تُعاد كغير متحقق إلا بـ FAIL بدليل حي جديد.  
4. المشروع **مجاني فقط** (Pages + Firebase Spark).  
5. لا PAT · لا عطور · لا dots ظاهرة · لا reload عند سحب الورقة · لا تغيير `#8d3048`.

---

## أ) تأكيد سريع فقط (≤10 دقائق) — لا تعيد من الصفر
بنر، تصنيفات بلا عطور، بحث، ورقة بلا نقاط ظاهرة، سحب يغلق بدون reload، سلة واجهة، أسعار/توصيل، كاش المتجر + `cloud-overrides` **c10** (ملفات أخرى قد تبقى بمفاتيح مستقلة مثل products b7).

---

## ب) مسار الطلب — أولوية قصوى (حي إلزامي)
1. نافذة خاصة.  
2. منتجان في السلة (كمية >1 لأحدهما).  
3. مجموع / توصيل تحت 30 ومن 30 / ضريبة / استلام.  
4. بيانات تجريبية واضحة («اختبار فحص»).  
5. إرسال بالطريقة المعتمدة — **بدون كتابة الرقم في التقرير**.  
6. اللوحة: يظهر الطلب؟ مبلغ؟ عناصر؟  
7. جهاز/نافذة ثانية بعد دخول المشرف: سحب `orders_private` بعد Publish القواعد.  
8. Console: أي `permission-denied`؟  
9. النتيجة نجح/فشل + Network لطلبات Firestore (بدون بيانات شخصية حقيقية إن أمكن).

`[طلب] OK/FAIL`

---

## ج) إخفاء المنتجات — حي + كود
الإصلاح: `js/cloud-overrides.js?v=20261127c10` — بعد `mergeOverrides` **لا** `p.hidden = false` على الكل.

**كاش:** افتحوا المتجر بـ `?v=20261127c10`. في Network يجب ظهور  
`cloud-overrides.js?v=20261127c10` (سكربت مستقل عن باقي الملفات).  
إذا ظهر `b7` أو أقدم → hard refresh أو `clear-cache.html`؛ **بدون c8 البند غير صالح**.

1. أخفِ من اللوحة → زمّن.  
2. متجر hard refresh — المنتج لا يظهر.  
3. Network: السكربت **c10** فقط.  
4. اقرأ الملف: ممنوع مسح `hidden` بعد الدمج.  
5. أظهر من اللوحة → يظهر.  
6. راقب وميض يظهر/يختفي (ENGINEERING §2).

`[إخفاء] OK/FAIL`

---

## د) Firestore — سطراً بسطر (GitHub + Console)
| مجموعة | تحقق |
|--------|------|
| `naqa/overrides` | read عام · write مشرف + keys + stamp |
| `naqa/reviews` | مثلها |
| `naqa/store` | read عام · write مشرف |
| `naqa/orders_private` | **`allow read: if isAdmin()` منفصل** عن create/update · لا `request.resource` على read |
| `naqa_imgs` | حدود jpeg |
| `naqa_inbox` | create بقيود · admin read/update/delete |
| `{document=**}` | deny |

- UID في `adminUids()` = حساب الدخول؟ (بدون نشر إيميل)  
- مشرف يقرأ orders → نجاح · زائر → رفض  
- أي `read` مربوط بـ `request.resource` = **FAIL**

**Console:** إن توفر — قارنوا Rules في Firebase مع الملف في GitHub.  
**إذا تعذّر الوصول إلى Console:** يكفي فتح `firestore.rules` في GitHub وفحصه سطراً بسطر؛ **غياب لقطة Console لا يُسقط البند**.

`[قواعد] OK/FAIL` — نُشرت يدوياً في Console 2026-11-27؛ عند توفر Console يُفضّل التطابق.

---

## هـ) overrides والسحابة — تتبع منطقي
ملفات: `js/cloud-overrides.js` · `js/core.js` (`mergeOverrides`, `naqaUnhideIfEmptyCatalog`, `naqaForceCatalogStock`) · `js/store-cloud-boot.js` · `js/admin/products.js` · `js/admin/cloud-orders.js`

1. كتابة: إخفاء/سعر/مخزون → sanitize → Firestore.  
2. قراءة متجر: load → session → merge → render.  
3. `naqaUnhideIfEmptyCatalog`: فقط إذا **كل** المنتجات مخفية.  
4. فرض `stock = 3` بعد الدمج: وثّق مقصود أم خطر.  
5. صور `fs:` / `naqa_imgs` بدون مسح معرض الكتالوج.  
6. لا PAT.

`[سحابة] OK/FAIL/RISK`

---

## و) الصور — منهجي (PRODUCT_IMAGES_RULE)
1. ≥15 عشوائي متعدد التصنيفات + منتجات hot/رئيسية.  
2. جدول: `id | sku | imgs[0] | بيضاء؟ | عدد imgs | HTTP 200 | ملاحظات`.  
3. افتح `media/products/p{ID}_0.webp` من Pages.  
4. FAIL: كولاج / لوجو فقط / موديل بلا عبوة / خلفية غامقة كأولى.  
5. لا تحكم على 307 من 3 صور.

`[صور] جدول + نسبة FAIL`

---

## ز) UX تفاعلي — فيديو لكل مسار
1. بحث: كلمة، كلمتين، SKU، مسح.  
2. كل تصنيف.  
3. ورقة ≥3 صور: سحب يمين/يسار، لا فراغ، لا نقاط ظاهرة.  
4. سحب لتحت → إغلاق بدون reload.  
5. chrome-hide: لا مربع فاضي.  
6. ثيم + EN.  
7. جوال/ضيق + لوحة ≥1100px.

`[UX] OK/FAIL + فيديو`

---

## ح) أداء وأمان (مجاني)
1. Lighthouse Incognito: رئيسية + منتج — LCP/CLS/TBT.  
2. Network: أحجام `store.min.js` / `store.min.css` / `products.min.js` / أول صور.  
3. هل `products.admin.min.js` يُحمَّل على المتجر بالغلط؟  
4. Application → SW: المتوقع **unregister** من `index.html` (لا كاش قديم نشط). `sw.js` أداة تقاعد.  
5. Console أول تحميل + بعد 30ث.  
6. 404 / mixed content.  
7. `naqa_inbox` spam = RISK مع سيناريو.

`[أداء/أمن]`

---

## ط) SEO وبناء
`robots.txt` · `sitemap.xml` (~308 رابط) · `manifest` · عيّنة 5 من `p/{sku}` · meta من `index.html` · **لا** rebuild SEO يمسح `p/`.

---

## ي) نظافة المستودع
```
git ls-files | grep -E 'tmp/|scratch|\.env'
```
لا أسرار · لا tmp بعد التنظيف (p119/p201 حُذفت 2026-11-27) · `firestore.rules` GitHub ≈ Console.

---

## ممنوع كـ «لازم»
شوبيفاي/استضافة مدفوعة كشرط · عطور · dots/thumbs ظاهرة · reload · تغيير لون الهوية · سايدبار لوحة · تحويل بنكي قبل BANK · PAT.

---

## شكل التقرير
1. ملخص: هل **مسار الطلب** نجح؟  
2. جدول ب–ي: بند | حالة | دليل | شدة.  
3. FAIL مع خطوات إعادة الإنتاج.  
4. توصيات مجانية مرتبة.  
5. مدفوع اختياري منفصل.  
6. «تعارض مع LIVE §9» إن وجد.

**وقت مقترح:** 3–5 ساعات.  
**مرحلتان:**  
1) **حرج ~90 دقيقة:** ب (طلب) + ج (إخفاء) + د (قواعد).  
2) **تكميلي:** هـ–ي (سحابة، صور، UX فيديو، أداء، SEO، نظافة).  

**نجاح:** طلب حي OK + إخفاء حي OK + قراءة orders OK + لا FAIL حرج جديد.
