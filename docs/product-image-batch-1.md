# Product image batch 1 — first 50 single-image products

This batch is intentionally strict: no generated images, no generic stock images, no look-alike products, and no replacement of the primary `p<ID>_0.webp` image.

## What is in this branch

- `data/product-image-sources.json`: exact live-catalog identities for the first 50 products that currently have one image.
- `scripts/import_product_images.py`: downloads exactly 3 curator-approved direct image URLs per product, checks HTTPS/content type/size/dimensions/duplicates/catalog identity, converts to WebP, and appends gallery paths without replacing the main image.
- `.github/workflows/import-product-images.yml`: runs the importer on this branch and commits the generated WebP assets here.

## Required source curation

For each product, add exactly 3 direct HTTPS image URLs to `imageUrls`. The images must show the exact product/brand and exact shade, size, or pack variant where applicable. Prefer brand-owned product assets or suppliers whose reuse rights are confirmed. Put the product page used to verify identity in `sourcePage`.

Do not use an image search thumbnail URL, a search result page, an image from a different shade/size, or a URL that returns HTML. The importer intentionally refuses incomplete products and fails the batch rather than publishing a partial or misleading gallery.

## Run

After all 150 URLs have been reviewed and added, push the manifest to this branch or run **Actions → Import verified product gallery images → Run workflow**. The workflow commits the images only to this branch. It does not merge to `main`.

## Status at branch creation

The 50 catalog targets are populated. Image URLs have not yet been curated, downloaded, or imported. Therefore this workflow is a safe import mechanism, not a claim that 150 images already exist.
