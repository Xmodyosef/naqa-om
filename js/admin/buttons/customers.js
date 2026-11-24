/* زر العملاء فقط */
(function (w) {
  var A = w.NaqaAdmin; if (!A || !A.bindTab) return;
  A.bindTab("customers", function () { if (A.paintCustomers) A.paintCustomers(); });
})(window);
