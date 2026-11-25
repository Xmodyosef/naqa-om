# قاعدة صور المنتج / Product images rule (LOCKED)

**حازمة — لا تُكسر ولا تُنسى. Permanent — do not break or forget.**

## العربية
- صورة جديدة = **تنضاف** مع صور المنتج الحالية.
- **ما تمسح** باقي الصور أبداً عند الرفع أو اللصق.
- الحذف فقط بزر **✕** يدوياً (صورة صورة).
- تنطبق على **كل المنتجات** في اللوحة والمتجر (عربي وإنجليزي).
- عند التحميل: أي حفظ قديم مسح الصور يُصلح تلقائياً (`keepImgs` / `naqaKeepImgs` / `repairAllProductImgs`).
- عند الحفظ: نفس القاعدة تُطبَّق قبل الكتابة — ما ينعاد المسح بالغلط.

## English
- A new photo is **added** next to the current product photos.
- Upload/paste must **never wipe** the rest of the gallery.
- Remove only with the **✕** button (one photo at a time).
- Applies to **every product** on admin and storefront (AR and EN).
- On load: any past wipe is repaired (`keepImgs` / `naqaKeepImgs` / `repairAllProductImgs`).
- On save: the same rule runs before write — accidental wipe cannot be stored again.

## Code anchors (do not remove)
- `js/admin/core.js` → `A.keepImgs`, `A.repairAllProductImgs`, `A.merged`
- `js/admin/products.js` → upload / URL / saveEdit / delete with `A._editRemoved`
- `js/core.js` → `naqaKeepImgs` in `mergeOverrides`
- `js/cloud-overrides.js` → repair on `A.loadOverridesCloud`

If someone “fixes” images by replacing the whole `imgs` array with only the new file — **reject that change**.
