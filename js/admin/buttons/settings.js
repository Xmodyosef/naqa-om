/* زر الإعدادات فقط */
(function (w) {
  var A = w.NaqaAdmin; if (!A || !A.bindTab) return;
  A.bindTab("settings", function () { if (A.paintSettings) A.paintSettings(); });
})(window);
