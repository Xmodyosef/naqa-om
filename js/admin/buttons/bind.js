/* كل زر يسجّل نفسه. ما في رجوع تلقائي للرئيسية. */
(function (w) {
  var A = w.NaqaAdmin;
  if (!A) return;
  A._paints = A._paints || {};
  A.bindTab = function (id, paint) {
    if (paint) A._paints[id] = paint;
    var btn = document.querySelector('#sideNav .side-main[data-tab="' + id + '"]');
    if (!btn || btn.getAttribute("data-bound") === "1") return;
    btn.setAttribute("data-bound", "1");
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      try {
        if (id === "products" && A.editingId != null && A.closeEdit) A.closeEdit(true);
        if (id === "products") A.productPage = 1;
        var sub = A.defaultSub ? A.defaultSub(id) : "";
        var same = id === A.currentTab;
        A.go(id, sub, { push: !same, page: id === "products" ? 1 : undefined });
      } catch (err) {
        try { console.error("naqa btn", id, err); } catch (e2) {}
      }
    });
  };
})(window);
