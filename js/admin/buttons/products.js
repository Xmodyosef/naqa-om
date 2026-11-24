/* زر المنتجات: بحث القائمة، الصفحات، فتح التعديل. عطل هنا ما يوقف باقي الأزرار. */
(function (w) {
  var A = w.NaqaAdmin;
  if (!A) return;
  function safe(fn) { try { fn(); } catch (err) { try { console.error("naqa products btn", err); } catch (e) {} } }
  var q = document.getElementById("q");
  if (q) q.addEventListener("input", function (e) {
    safe(function () {
      A.productPage = 1;
      A.paintList(e.target.value.trim());
      try { history.replaceState({ naqa: "sec", tab: "products", page: 1 }, "", A.sectionHash()); } catch (err) {}
      A.syncNav();
    });
  });
  var list = document.getElementById("list");
  if (list) list.addEventListener("click", function (e) {
    safe(function () {
      var pg = e.target.closest("[data-page]");
      if (pg && !pg.disabled) {
        var n = parseInt(pg.getAttribute("data-page"), 10);
        if (!n || n < 1) return;
        A.productPage = n;
        A.paintList(document.getElementById("q") ? document.getElementById("q").value.trim() : "");
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
