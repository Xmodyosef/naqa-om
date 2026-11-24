/* زر الرئيسية فقط */
(function (w) {
  var A = w.NaqaAdmin; if (!A || !A.bindTab) return;
  A.bindTab("home", function () { if (A.paintDashboard) A.paintDashboard(); });
})(window);
