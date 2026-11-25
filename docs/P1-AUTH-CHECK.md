# بند 1 — فحص قفل اللوحة (Firebase)

## روابط
- لوحة: https://xmodyosef.github.io/naqa-om/admin.html?v=20261125p1
- متجر: https://xmodyosef.github.io/naqa-om/

## اختبار إلزامي (جلسة خاصة / Incognito)
1. افتحي اللوحة في نافذة خاصة (بدون حساب).
2. يجب: شاشة تسجيل دخول فقط — **لا** سايدبار / منتجات / طلبات.
3. إيميل أو كلمة سر خاطئة → رسالة خطأ، اللوحة تبقى مقفلة.
4. من Console (اختياري): `NaqaAdmin.openAdmin()` → **يجب ألا** تفتح اللوحة بدون جلسة.
5. بعد دخول صحيح → تظهر اللوحة.
6. تسجيل خروج من الإعدادات → ترجع شاشة الدخول وتختفي الإدارة.

## ما تم في الكود
- CSS يخفي `#tools` بالكامل عند `naqa-locked` / بدون `naqa-open`.
- `A.isAuthed` + `A.requireAuth` قبل: openAdmin، go، applyRoute، openEdit، saveEdit، toggleHide، publish.
- نشر GitHub (`ghPut`) معطّل — الكتابة السحابية عبر Firestore بعد تسجيل الدخول فقط.
