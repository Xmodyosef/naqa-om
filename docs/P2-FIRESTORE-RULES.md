# بند 2 — قواعد Firestore (مهم)

## الهدف
- **قراءة عامة** فقط لـ `naqa/overrides` و `naqa/reviews` (المتجر يحتاجها).
- **كتابة** = مستخدم مسجّل دخول في Firebase فقط.
- أي مسار آخر = **مرفوض**.

## طريقة التطبيق (مجاني — Console)

1. افتحي [Firebase Console](https://console.firebase.google.com/) → مشروع **naqa-om**
2. **Build → Firestore Database**
   - إن لم يُنشأ: Create database → **Production mode** → موقع قريب (مثل `me-central1` أو `eur3`)
3. تبويب **Rules**
4. امسحي القديم والصقي محتوى الملف `firestore.rules` من المستودع
5. **Publish**

## تشديد (موصى به بعد أول دخول)
1. Authentication → Users → انسخي **User UID**
2. في `firestore.rules` داخل `adminUids()` أضيفي:
   ```
   'YOUR_UID_HERE'
   ```
3. Publish مرة ثانية  
   بعدها **أي حساب Firebase آخر** ما يقدر يكتب حتى لو سجّل دخول.

## تحقق سريع
| من | ماذا | متوقع |
|----|------|--------|
| المتجر بدون دخول | يقرأ أسعار/إخفاء من السحابة | يعمل |
| شخص غريب (Console / REST بدون auth) | يكتب overrides | **Permission denied** |
| أنتِ بعد دخول اللوحة | حفظ سعر/إخفاء | ينجح |
| حذف وثيقة | — | مرفوض بالقواعد |

## ملاحظات
- لا تفعّلي **test mode** المفتوح للعالم.
- الإيميل **لا** يُحفظ في الوثائق (uid فقط).
- طلبات العملاء تبقى على الجهاز — **ليست** في Firestore حالياً (أأمن للمتجر الثابت).


دليل النشر خطوة بخطوة: [FIRESTORE-HOW-TO-PUBLISH.md](./FIRESTORE-HOW-TO-PUBLISH.md)
