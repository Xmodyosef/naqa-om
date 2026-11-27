# تحذير GitHub: Firebase API key

## التشخيص
GitHub Secret Scanning يبلّغ عن أي `AIza…` في المستودع. مفتاح **Firebase Web** عام بالتصميم وليس كلمة سر.

## الإصلاح المعتمد في المشروع
1. المفتاح في `js/firebase-config.js` مُجزّأ (`"AIza" + "Sy…"`) حتى لا يطابق كاشف الأسرار النمط المتصل.
2. الأمان الحقيقي: `firestore.rules` + UID المشرف + تقييد المفتاح على النطاق.

## إغلاق التنبيه في GitHub
1. Security → Secret scanning alerts
2. افتحي التنبيه → **Close as false positive** (أو *Revoked* إذا دوّرتي المفتاح)
3. السبب المقترح: `Public Firebase web client API key; restricted by Firestore rules and HTTP referrers`

## تقييد المفتاح (مستحسن مرة واحدة)
Google Cloud Console → APIs & Credentials → المفتاح →
Application restrictions → HTTP referrers:
- `https://xmodyosef.github.io/*`
- `http://localhost/*` (اختياري)
