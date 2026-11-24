# Firebase Authentication — لوحة نقاء

## الحالة
- مشروع: `naqa-om`
- الإيميل المسموح محفوظ كبصمة، مو كنص ظاهر في الملفات.
- المتجر مفتوح للزبائن بدون تسجيل
- اللوحة: إيميل/كلمة سر + Google، فقط الإيميل المسموح

## لازم في الكونسول
1. Authentication → Email/Password → Enabled
2. Authentication → Google → Enabled + Save
3. Authentication → Settings → Authorized domains:
   - `xmodyosef.github.io`
   - `localhost` (اختياري للتجربة)
4. Users: نفس الإيميل موجود، أو ادخل مرة بـ Google

## الملفات
- `js/firebase-config.js` — المفاتيح + قائمة الإيميلات
- `js/admin/firebase-gate.js` — الدخول والخروج والاسترجاع
