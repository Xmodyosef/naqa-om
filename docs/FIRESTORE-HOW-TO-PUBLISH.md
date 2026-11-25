# كيف تنشرين قواعد Firestore (بند ٢ — التقييمات + الباقي)

## دقيقتان

1. افتحي: https://console.firebase.google.com/project/naqa-om/firestore/rules  
   (أو: Console → مشروع **naqa-om** → **Build** → **Firestore Database** → تبويب **Rules**)

2. افتحي من جهازك ملف المستودع:  
   **`firestore.rules`**  
   https://github.com/Xmodyosef/naqa-om/blob/main/firestore.rules

3. انسخي **كامل** الملف → الصقيه في صندوق Rules في Firebase.

4. اضغطي **Publish**.

## ماذا تغطي القواعد؟

| مسار | قراءة | كتابة |
|------|--------|--------|
| `naqa/overrides` | عامة (المتجر) | أنتِ فقط (UID) |
| `naqa/reviews` | عامة (المتجر) | أنتِ فقط |
| `naqa/orders_private` | **أنتِ فقط** | أنتِ فقط |
| `naqa_imgs/...` | عامة | أنتِ فقط |
| أي شيء آخر | مرفوض | مرفوض |

## UID

القائمة `adminUids()` فيها UID حسابك. إن غيّرتِ الحساب: Authentication → Users → انسخي UID → ضعيه في `firestore.rules` → Publish.

## تحقق

- لوحة → تقييمات → «انشري للمتجر» → يجب أن تنجح بعد Publish.  
- متجر يقرأ التقييمات بدون دخول.  
- طلبات سحابية: إعدادات → سحب/رفع الطلبات (بعد Publish لـ `orders_private`).
