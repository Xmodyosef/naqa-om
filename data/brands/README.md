# منتجات حسب الماركة / Products by brand

كل ملف = ماركة واحدة. عشان تضيفين منتج جديد (عربي + إنجليزي):

## كيف تضيفين منتج؟
1. افتحي ملف الماركة (مثال: `sheglam.js`)
2. داخل `NAQA_PRODUCTS.push(` أضيفي كائن منتج جديد (انظري `TEMPLATE.js`)
3. **لازم** `nameAr` + `nameEn` + `descAr` + `descEn` + `useAr` + `useEn`
4. `id` رقم فريد (مو مستخدم)
5. احفظي → ارفعي على GitHub → الموقع يتحدث

## الحقول
| Field | عربي | English |
|-------|------|---------|
| nameAr / nameEn | اسم المنتج | Product name |
| descAr / descEn | الوصف | Description |
| useAr / useEn | الاستعمال | How to use |
| skinAr / skinEn | يناسب | Best for |
| brand | اسم الماركة الإنجليزي المعتمد | Brand |
| cat | عناية / مكياج / شعر / عطور / أدوات | Category |
| price | السعر ر.ع **شامل الضريبة ٥٪** | Price OMR incl. 5% VAT |
| sku | داخلي للطلبات فقط (ما يظهر للزبون) | Internal only |
| imgs | 4–5 صور | 4–5 images |

## الماركات الموجودة
- [`abib.js`](./abib.js) — **Abib** (3)
- [`acm.js`](./acm.js) — **ACM** (3)
- [`acure.js`](./acure.js) — **Acure** (1)
- [`anua.js`](./anua.js) — **Anua** (17)
- [`arencia.js`](./arencia.js) — **Arencia** (7)
- [`aromatica.js`](./aromatica.js) — **Aromatica** (1)
- [`axis-y.js`](./axis-y.js) — **AXIS-Y** (4)
- [`beauty-of-joseon.js`](./beauty-of-joseon.js) — **Beauty of Joseon** (3)
- [`biodance.js`](./biodance.js) — **Biodance** (1)
- [`bioderma.js`](./bioderma.js) — **Bioderma** (1)
- [`cantu.js`](./cantu.js) — **Cantu** (1)
- [`celimax.js`](./celimax.js) — **Celimax** (5)
- [`centellian24.js`](./centellian24.js) — **Centellian24** (1)
- [`cetaphil.js`](./cetaphil.js) — **Cetaphil** (1)
- [`cosrx.js`](./cosrx.js) — **Cosrx** (3)
- [`dr-althea.js`](./dr-althea.js) — **Dr.Althea** (8)
- [`dr-melaxin.js`](./dr-melaxin.js) — **Dr.Melaxin** (1)
- [`epii.js`](./epii.js) — **epii** (1)
- [`eqqualberry.js`](./eqqualberry.js) — **EQQUALBERRY** (3)
- [`essence.js`](./essence.js) — **essence** (5)
- [`eucerin.js`](./eucerin.js) — **Eucerin** (2)
- [`haruharu.js`](./haruharu.js) — **HaruHaru** (2)
- [`isdin.js`](./isdin.js) — **ISDIN** (1)
- [`k-secret.js`](./k-secret.js) — **K-Secret** (2)
- [`k18.js`](./k18.js) — **K18** (3)
- [`loreal.js`](./loreal.js) — **L'oréal** (1)
- [`la-roche-posay.js`](./la-roche-posay.js) — **La Roche-Posay** (1)
- [`laneige.js`](./laneige.js) — **LANEIGE** (1)
- [`liangyan.js`](./liangyan.js) — **LIANGYAN** (1)
- [`lollis.js`](./lollis.js) — **LOLLIS** (21)
- [`m-asam.js`](./m-asam.js) — **M.Asam** (1)
- [`mary-and-may.js`](./mary-and-may.js) — **Mary&May** (1)
- [`medicube.js`](./medicube.js) — **Medicube** (21)
- [`missha.js`](./missha.js) — **MISSHA** (5)
- [`neutrogena.js`](./neutrogena.js) — **Neutrogena** (1)
- [`numbuzin.js`](./numbuzin.js) — **Numbuzin** (4)
- [`nyx.js`](./nyx.js) — **NYX** (1)
- [`olaplex.js`](./olaplex.js) — **OLAPLEX** (2)
- [`purito.js`](./purito.js) — **Purito** (2)
- [`schwarzkopf.js`](./schwarzkopf.js) — **Schwarzkopf** (2)
- [`seapuri.js`](./seapuri.js) — **Seapuri** (1)
- [`sheglam.js`](./sheglam.js) — **SHEGLAM** (27)
- [`shiseido.js`](./shiseido.js) — **Shiseido** (2)
- [`skin-doctor.js`](./skin-doctor.js) — **Skin Doctor** (1)
- [`skin1004.js`](./skin1004.js) — **SKIN1004** (7)
- [`stridex.js`](./stridex.js) — **Stridex** (1)
- [`the-ordinary.js`](./the-ordinary.js) — **The Ordinary** (6)
- [`tirtir.js`](./tirtir.js) — **TIRTIR** (2)
- [`tocobo.js`](./tocobo.js) — **TOCOBO** (1)
- [`ultru.js`](./ultru.js) — **Ultru** (1)
- [`uriage.js`](./uriage.js) — **Uriage** (1)
- [`vaseline.js`](./vaseline.js) — **Vaseline** (1)
- [`vivelab.js`](./vivelab.js) — **ViveLab** (3)
- [`yc.js`](./yc.js) — **YC** (1)

**المجموع: 200 منتج · 54 ماركة**

> الملفات القديمة `data/products-care.js` إلخ أصبحت غير مستخدمة.
