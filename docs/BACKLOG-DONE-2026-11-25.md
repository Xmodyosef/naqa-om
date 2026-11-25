# مؤجل → منفَّذ / قرار (2026-11-25)

قرار: **قواعد Firestore = يدوي (Publish من Console)** — لا FIREBASE_TOKEN إلزامي.

| بند | قرار / حالة |
|-----|-------------|
| قواعد Firestore | يدوي — الصقي `firestore.rules` → Publish |
| إخفاء قائمة | إصلاح مستمع مزدوج (def/arch) |
| طلبات سحابية | `orders_private` + أزرار سحب/رفع + لصق واتساب |
| تقييمات بلا GitHub | Firestore `naqa/reviews` + رسائل خطأ أوضح للقواعد |
| صور منتج | `naqa_imgs` — مسار GitHub materialize مُعطَّل |
| PIN / توكن في الإعدادات | مُزال من الواجهة؛ بقايا مفاتيح i18n ميتة غير ظاهرة |
| شارة طلبات + ليلي + Ctrl+K | ux-extras |
| ضغط صور | سكربت جاهز؛ `media/products` أصلاً خفيف (~16MB، ملفات ≤48KB) |
| رسم مالية | موجود SVG |
| ربط GitHub→Firebase تلقائي | جاهز اختيارياً؛ **مو مفعّل** (قرار يدوي) |

## ما يتبقى اختيارياً (مو حرج يومياً)
- تنظيف مفاتيح i18n الميتة لـ PIN/token (تجميلي)
- lazy-load أعمق لـ products.bundle
- اختبار VoiceOver يدوي على الآيفون (قائمة CHECKLIST-VO-WA)
- axe/Lighthouse a11y لاحقاً
