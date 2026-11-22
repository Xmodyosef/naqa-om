# Naqa — Audit of 4 fixed weaknesses (evidence-based)

**Date:** 2026-11-23  
**Commit audited:** `5dd9a6f`  
**Live:** https://xmodyosef.github.io/naqa-om/  
**Method:** static code + product JSON metrics + live HTTP fetch (no assumed pass)

---

## Summary / الملخص

| # | Topic | AR | Verdict | Status |
|---|--------|----|---------|--------|
| **1** | Performance / السرعة | تحميل أسرع | **PASS_PARTIAL** | Improved; residual weight |
| **2** | Duplicates / التكرار | أوصاف غير مكررة | **PASS** | 199/199 unique desc AR+EN |
| **3** | Copy quality / جودة النص | وصف + استعمال | **PASS_PARTIAL** | Strong; shared use templates |
| **4** | Accessibility / الوصولية | a11y WCAG helpers | **PASS** (static) | Live files confirmed |

**Overall:** Fixes are **real and deployed**. None of the four is a total failure. W1 and W3 remain **partial** (documented residual risks).

---

## 1) Speed — W1

### Evidence
| Metric | Value | Budget / target | Result |
|--------|-------|-----------------|--------|
| HTML | 10.8 KB | — | OK |
| CSS (5 files) | **31.8 KB** | < 100 KB | **PASS** |
| App JS (no products) | **108.4 KB** | < 300 KB | **PASS** |
| `products.bundle.js` | **266.1 KB** | — | Heavy payload |
| **Total JS** | **374.6 KB** | < 300 KB (strict) | **FAIL budget if bundle counted** |
| Critical text weight | 417 KB | < 1.5 MB | **PASS** |
| `media/` on disk | ~20 MB | (lazy/on demand) | Watch on 3G |
| Blocking `<script src>` | **0** | 0 | **PASS** |
| `defer` scripts | 18 | preferred | **PASS** |
| Google Fonts | none | avoid | **PASS** |
| Live HTML TTFB-ish | ~56 ms (lab fetch) | < 800 ms | **PASS** (lab only) |

### What was fixed (verified in repo)
- Modular CSS/JS split  
- No Google Fonts on store page  
- All store scripts `defer`  
- Product data in one bundle (tradeoff: one large download)

### Residual risk
- **18 script requests** → mobile connection overhead (HTTP/2 helps on GitHub Pages).
- **products.bundle ~266 KB** dominates first load.
- **~20 MB media/** if fully downloaded (logos); must stay lazy.

### Verdict
**PASS_PARTIAL** — architecture is light enough; product catalog still heavy.

---

## 2) Duplicates — W2

### Evidence (199 products)
| Field | Unique / filled | Duplicate values |
|-------|-----------------|------------------|
| id | 199 / 199 | 0 collisions |
| sku | 199 / 199 | 0 empty |
| nameAr | 199 / 199 | **0** |
| nameEn | 199 / 199 | **0** |
| **descAr** | **199 / 199** | **0** |
| **descEn** | **199 / 199** | **0** |
| useAr | 22 unique / 199 | 20 shared texts (by formula type) |
| useEn | 17 unique / 199 | 15 shared texts |

### Verdict
**PASS** for product **names + long descriptions** (the original pain).  
Usage steps intentionally share patterns (serum / cream / hair / lips) → acceptable, not “same product copy”.

---

## 3) Copy quality — W3

### Evidence
| Check | Result |
|-------|--------|
| Old AR template `تركيبة عملية…` | **0** |
| Old EN “practical formula” spam | **0** |
| Short desc (<40 chars) AR/EN | **0 / 0** |
| skinAr / skinEn filled | **199 / 199** |
| Avg desc length AR / EN | ~194 / ~202 chars |
| Avg use length AR / EN | ~100 / ~118 chars |
| Hair misfiled under makeup | **0 real** (1 false positive: lip balm “Volume”) |

Sample (live data): product copy is product-specific (brand + role + texture), bilingual.

### Residual risk
- Usage text still **pools by product role** (~15–20 templates) — clearer than before, not 199 fully unique how-to essays.
- Not a full cosmetic-regulatory claim review (marketing copy only).

### Verdict
**PASS_PARTIAL** — description quality goal met; usage is structured, not fully unique per SKU.

---

## 4) Accessibility — W4

### Static checklist (all OK in commit `5dd9a6f`)
- Skip link, `a11y.css`, `a11y.js` linked  
- `lang` / `dir` + `applyLang` updates `documentElement`  
- Live region `#a11yLive`  
- 4× `role="dialog"` + `aria-modal`  
- `:focus-visible`, `.sr-only`, `prefers-reduced-motion`, 44px targets  
- Escape closes lightbox → checkout → sheet → cart  
- Focus trap + restore focus  
- Cart announce API  
- Card image `alt` = product name  
- Qty buttons labelled  

### Contrast (calculated)
| Pair | Ratio | AA normal (4.5:1) |
|------|-------|-------------------|
| fg `#1f1a17` on bg `#fdf8f6` | **16.36:1** | PASS |
| muted **new** `#5c534d` on bg | **7.12:1** | **PASS** (was 3.70:1 FAIL) |
| rose-deep `#b05c6e` on white | **4.56:1** | PASS (borderline) |
| rose-deep on page bg | **4.33:1** | Borderline for small text |

### Live HTTP (2026-11-23)
| URL | Status | Notes |
|-----|--------|-------|
| `/naqa-om/` | 200 ~56ms | contains skip + a11y refs |
| `/js/a11y.js` | 200 | contains Escape |
| `/css/store/a11y.css` | 200 | contains focus-visible |
| `/data/products.bundle.js` | 200 ~266KB | products |

### Not fully automated here
- VoiceOver / TalkBack session  
- Full keyboard pass on real iPhone Safari  
- axe-core / Lighthouse a11y score  

### Verdict
**PASS (static + live assets)**. Manual AT testing still recommended on device.

---

## Syntax
All store `js/**/*.js` → `node --check` → **0 failures**.

---

## Recommended next (priority)
1. **W1:** merge/bundle app JS (esbuild) or split products by category lazy-load.  
2. **W1:** compress brand logos under `media/` (20MB is high).  
3. **W3:** more unique `useAr`/`useEn` for top 50 SKUs only.  
4. **W4:** 10-minute VoiceOver test on iPhone 11; fix anything announced wrong.

---

*Generated by evidence audit — not a marketing claim.*
