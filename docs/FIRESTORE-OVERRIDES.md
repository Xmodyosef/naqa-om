# مزامنة المنتجات بدون رمز GitHub

## تفعيل Firestore (مرة واحدة)
1. Firebase Console → مشروع **naqa-om**
2. Build → **Firestore Database** → Create database → **production** → location قريبة (مثلاً `asia-south1` أو default)
3. Rules → الصقي:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /naqa/overrides {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

4. Publish

## النتيجة
- تسجّلين دخول اللوحة → تعدّلين سعر/كمية/إخفاء → **ينحفظ تلقائياً** على الحساب (Firestore)
- المتجر يقرأ نفس البيانات للزبائن
- **ما تحتاجين رمز GitHub** لهذا الغرض
