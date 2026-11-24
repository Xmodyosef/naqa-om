/* زر المالية فقط */
(function (w) {
  var A = w.NaqaAdmin; if (!A || !A.bindTab) return;
  A.bindTab("finance", function () { if (A.paintFinance) A.paintFinance(); });
})(window);
