# Product images rule (permanent)

A new photo **adds** to the product gallery. It never replaces the whole set.

- Upload or paste URL → image is added (first image is the main one).
- Catalog photos stay unless the admin removes one with the ✕ button.
- On load, every product override is repaired with `keepImgs` / `naqaKeepImgs` so a past wipe is undone for all products.
- On save, the same rule is applied so a wipe cannot be stored again.
- Storefront merge uses the same rule so the live shop never shows a single upload in place of the full gallery by accident.
