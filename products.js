/* Naqa products loader
 * Products are split by BRAND under data/brands/<slug>.js
 * Each brand file does: window.NAQA_PRODUCTS.push({...}, {...})
 * Add a product: open the brand file (or create a new one) and edit AR + EN fields.
 * See data/brands/README.md and data/brands/TEMPLATE.js
 */
window.NAQA_PRODUCTS = window.NAQA_PRODUCTS || [];
