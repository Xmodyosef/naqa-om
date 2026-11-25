/* زر المنتجات: الصفحات، فتح التعديل. (بحث المنتجات أُلغي — البحث للطلبات فقط) */
(function (w) {
  var A = w.NaqaAdmin;
  if (!A) return;
  function safe(fn) { try { fn(); } catch (err) { try { console.error("naqa products btn", err); } catch (e) {} } }
  var list = document.getElementById("list");
  if (list) list.addEventListener("click", function (e) {
    safe(function () {
      var pg = e.target.closest("[data-page]");
      if (pg && !pg.disabled) {
        var n = parseInt(pg.getAttribute("data-page"), 10);
        if (!n || n < 1) return;
        A.productPage = n;
        A.paintList("");
        try { history.pushState({ naqa: "sec", tab: "products", page: n }, "", A.sectionHash()); } catch (err) {}
        var box = document.getElementById("productsTab");
        if (box && box.scrollIntoView) box.scrollIntoView({ block: "start" });
        return;
      }
      var hide = e.target.closest("[data-hide]");
      if (hide) {
        e.preventDefault();
        e.stopPropagation();
        if (A.toggleHide) A.toggleHide(hide.getAttribute("data-hide"));
        return;
      }
      var btn = e.target.closest("[data-open]");
      if (!btn) return;
      A.openEdit(+btn.getAttribute("data-open"));
    });
  });
})(window);

(function (w) {
  var A = w.NaqaAdmin; if (!A || !A.bindTab) return;
  A.bindTab("products", function () {
    if (A.paintList && A.editingId == null) {
      A.paintList("");
    }
  });
})(window);
