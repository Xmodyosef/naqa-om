# نقاء — Naqa (عُمان)

متجر عناية ومكياج ثابت على GitHub Pages. الطلب عبر واتساب.

**الحي على الإنتاج:** [docs/LIVE.md](docs/LIVE.md)  
**قواعد الوكلاء:** [AGENTS.md](AGENTS.md) · [docs/ENGINEERING-RULES.md](docs/ENGINEERING-RULES.md) · [docs/DESIGN-LOCK.md](docs/DESIGN-LOCK.md)

## روابط
- المتجر: https://xmodyosef.github.io/naqa-om/
- المستودع: https://github.com/Xmodyosef/naqa-om

## ملفات أساسية
| ملف | دور |
|-----|-----|
| `index.html` | هيكل المتجر + كاش `?v=` |
| `js/store.min.js` / `css/store.min.css` | ما يشغّل الزبونة (بعد البناء) |
| `admin.html` | لوحة الإدارة |
| `data/products*.js` | الكتالوج |
| `scripts/build-store.sh` | بناء JS/CSS المتجر |

## تعديل سريع
- منتج/سعر → مصادر الكتالوج ثم بناء الحزمة
- نص متجر → `js/core.js` (`ui` / `T`)
- واتساب → `js/config.js`
- شكل → `css/store/*` ثم `bash scripts/build-store.sh` + رفع `?v=`

خريطة الملفات: [docs/MAP.md](docs/MAP.md)
