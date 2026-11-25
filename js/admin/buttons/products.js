/* Product list clicks live in js/admin/products.js (single handler — avoid double toggleHide). */
(function (w) {
  var A = w.NaqaAdmin; if (!A || !A.bindTab) return;
  A.bindTab("products", function () {
    if (A.paintList && A.editingId == null) A.paintList("");
    if (A.bindProductListClicks) A.bindProductListClicks();
  });
})(window);
