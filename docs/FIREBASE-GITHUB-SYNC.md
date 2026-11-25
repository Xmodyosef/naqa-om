# ربط GitHub → Firebase (تلقائي)

## ماذا يمكن أن يصير تلقائياً؟

| من GitHub | إلى Firebase | تلقائي؟ |
|-----------|--------------|---------|
| ملف `firestore.rules` | قواعد Firestore | ✅ نعم (بهذا الـ workflow) |
| Hosting (إن استخدمتموه) | Firebase Hosting | ✅ ممكن (مو مفعّل الآن — عندك GitHub Pages) |
| بيانات الطلبات/الأسعار داخل اللوحة | Firestore documents | ❌ **لا** — هذه تُكتب من اللوحة بعد دخولك، مو من ملف GitHub |
| تعديل عشوائي في أي ملف JS | يتغير Firestore data | ❌ **لا** |

**الخلاصة:**  
- **القواعد (Rules)** = ملف في GitHub → يمكن نشره تلقائياً بدون ما تدخلين Console كل مرة.  
- **البيانات (overrides / طلبات / تقييمات)** = من اللوحة بحسابك؛ GitHub ما «يملأ» Firestore لوحده إلا إذا بنيتِ سكربت نشر مخصص (غير مطلوب لمتجرك الحالي).

---

## إعداد مرة واحدة (١٠ دقائق)

### 1) على جهازك (أو Codespace) — توكن Firebase

```bash
npm install -g firebase-tools
firebase login:ci
```

انسخ التوكن الطويل الذي يظهر.

### 2) في GitHub

1. المستودع **Xmodyosef/naqa-om**  
2. **Settings → Secrets and variables → Actions → New repository secret**  
3. الاسم: `FIREBASE_TOKEN`  
4. القيمة: الصق التوكن → Save  

### 3) تفعيل

- الملف جاهز: `.github/workflows/firebase-rules.yml`  
- أي تعديل على `firestore.rules` + push لـ `main` → GitHub ينشر القواعد لـ **naqa-om** تلقائياً.  
- أو يدوياً: Actions → **Deploy Firestore rules** → Run workflow  

### 4) تحقق

Firebase Console → Firestore → Rules → يجب أن تطابق محتوى `firestore.rules` في GitHub.

---

## بدون ربط (الطريقة اليدوية — دقيقة واحدة)

انسخي محتوى `firestore.rules` →  
https://console.firebase.google.com/project/naqa-om/firestore/rules  
→ Publish.
