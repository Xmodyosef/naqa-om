# بند 1 — قفل اللوحة (بعد إصلاح core)

## سبب العطل السابق
تعديل خاطئ حذف دوال أساسية من `js/admin/core.js` (merged, esc, orders…).  
تم **استعادة الملف كاملاً** وإضافة `isAuthed` فقط بدون حذف.

## روابط
- https://xmodyosef.github.io/naqa-om/admin.html?v=20261125p1fix

## فحص
1. Incognito → شاشة دخول فقط
2. دخول صحيح → الرئيسية والمنتجات والطلبات تعمل
3. بدون دخول: `NaqaAdmin.openAdmin()` لا يفتح
