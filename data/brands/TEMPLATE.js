/* قالب منتج جديد — انسخي داخل ملف الماركة
   New product template — paste inside the brand file
   1) غيّري id لرقم غير مستخدم (أكبر من آخر id)
   2) املئي nameAr / nameEn و descAr / descEn و useAr / useEn
   3) price بالريال العماني · cat من: عناية | مكياج | شعر | عطور | أدوات | أخرى
   4) أضيفي الفاصلة بين المنتجات داخل push(...)
*/
window.NAQA_PRODUCTS = window.NAQA_PRODUCTS || [];
window.NAQA_PRODUCTS.push(
{
  "id": 9999,
  "brand": "BRAND_NAME",
  "cat": "عناية",
  "sku": "0000000000000",
  "price": 9.900,
  "em": "✨",
  "imgs": [
    "media/products/p9999_0.webp",
    "media/products/p9999_1.webp",
    "media/products/p9999_2.webp",
    "media/products/p9999_3.webp"
  ],
  "nameAr": "اسم المنتج بالعربي",
  "nameEn": "Product name in English",
  "descAr": "وصف جذاب بالعربي…",
  "descEn": "Compelling English description…",
  "useAr": "طريقة الاستعمال…",
  "useEn": "How to use…",
  "skinAr": "كل أنواع البشرة",
  "skinEn": "All skin types"
}
);
