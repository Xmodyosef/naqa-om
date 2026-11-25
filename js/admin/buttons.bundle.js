/* ===== bind.js ===== */
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

/* ===== home.js ===== */
/* زر الرئيسية فقط */
(function (w) {
  var A = w.NaqaAdmin; if (!A || !A.bindTab) return;
  A.bindTab("home", function () { if (A.paintDashboard) A.paintDashboard(); });
})(window);

/* ===== orders.js ===== */
/* زر الطلبات: تأكيد الدفع وتغيير الحالة. عطل هنا ما يوقف باقي الأزرار. */
(function (w) {
  var A = w.NaqaAdmin;
  if (!A) return;
  function safe(fn) { try { fn(); } catch (err) { try { console.error("naqa orders btn", err); } catch (e) {} } }
  var ordersList = document.getElementById("ordersList");
  if (ordersList) ordersList.addEventListener("click", function (e) {
    safe(function () {
      var payBtn = e.target.closest("[data-pay]");
      if (payBtn) {
        A.confirmPayment(payBtn.getAttribute("data-pay"));
        A.paintOrders();
        A.setMsg("orderStatus", A.t("confirmedMsg"));
        return;
      }
      var st = e.target.closest("[data-st]");
      if (!st) return;
      var id = st.getAttribute("data-oid");
      var next = st.getAttribute("data-st");
      if (next === "cancel") {
        if (!confirm(A.t("cancelConfirm") + "\n" + id)) return;
      }
      A.orders.forEach(function (o) {
        if (String(o.id) !== String(id)) return;
        var prev = A.normalizeStatus(o.status);
        o.status = next;
        if (next === "cancel" && prev !== "cancel") A.restoreStockForOrder(o);
        else if (next !== "cancel" && prev === "cancel") A.deductStockForOrder(o);
        else if (next !== "cancel" && !o.stockDeducted && (next === "prep" || next === "ship" || next === "delivered" || next === "new")) {
          if (next === "prep" || next === "ship" || next === "delivered") A.deductStockForOrder(o);
        }
      });
      A.saveOrders();
      A.paintOrders();
      A.setMsg("orderStatus", A.t("statusTo") + " " + id + " → " + (A.statusLabel(next) || next));
    });
  });
  var statusBarEl = document.getElementById("statusBar");
  if (statusBarEl) statusBarEl.addEventListener("click", function (e) {
    safe(function () {
      var f = e.target.closest("[data-filter]");
      if (!f) return;
      A.orderFilter = f.getAttribute("data-filter") || "all";
      A.paintOrders();
    });
  });
})(window);

(function (w) {
  var A = w.NaqaAdmin; if (!A || !A.bindTab) return;
  A.bindTab("orders", function () { if (A.paintOrders) A.paintOrders(); });
})(window);

/* ===== products.js ===== */
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

/* ===== reviews.js ===== */
/* زر التقييمات فقط */
(function (w) {
  var A = w.NaqaAdmin; if (!A || !A.bindTab) return;
  A.bindTab("reviews", function () { if (A.paintReviews) A.paintReviews(); });
})(window);

/* ===== customers.js ===== */
/* زر العملاء فقط */
(function (w) {
  var A = w.NaqaAdmin; if (!A || !A.bindTab) return;
  A.bindTab("customers", function () { if (A.paintCustomers) A.paintCustomers(); });
})(window);

/* ===== finance.js ===== */
/* زر المالية فقط */
(function (w) {
  var A = w.NaqaAdmin; if (!A || !A.bindTab) return;
  A.bindTab("finance", function () { if (A.paintFinance) A.paintFinance(); });
})(window);

/* ===== settings.js ===== */
/* زر الإعدادات فقط */
(function (w) {
  var A = w.NaqaAdmin; if (!A || !A.bindTab) return;
  A.bindTab("settings", function () { if (A.paintSettings) A.paintSettings(); });
})(window);
