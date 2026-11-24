# Firebase Authentication (مجاني) — لوحة نقاء

## الفكرة
- **المتجر** (`index.html`) يبقى مفتوحاً للزبائن **بدون** تسجيل دخول.
- **اللوحة** (`admin.html`) تُحمى بإيميل وكلمة سر عبر Firebase Spark (مجاني).
- **GitHub** يبقى لاستضافة الموقع ونشر المنتجات. Firebase لا يستبدل GitHub.

## إعدادك
1. https://console.firebase.google.com → مشروع جديد (Spark).
2. Authentication → Email/Password → تفعيل.
3. Users → Add user (إيميلك + كلمة سر قوية).
4. Project settings → Web app → انسخي `firebaseConfig`.
5. Authentication → Settings → Authorized domains:
   - `xmodyosef.github.io`
   - لاحقاً دومينك إن وُجد
6. الصقي القيم في `js/firebase-config.js` (apiKey, authDomain, projectId, appId…).
7. لا تكتبي كلمة السر في أي ملف.

إذا بقي `apiKey` فاضي، اللوحة تستخدم الرمز على الجهاز كالسابق.

## الدومين والبنك
- الدومين: أضيفيه في Authorized domains.
- البنك: منفصل تماماً عن Firebase.
