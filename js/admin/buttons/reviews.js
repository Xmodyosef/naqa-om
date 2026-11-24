/* زر التقييمات فقط */
(function (w) {
  var A = w.NaqaAdmin; if (!A || !A.bindTab) return;
  A.bindTab("reviews", function () { if (A.paintReviews) A.paintReviews(); });
})(window);
