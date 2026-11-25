/* زر الطلبات: تأكيد الدفع وتغيير الحالة. عطل هنا ما يوقف باقي الأزرار. */
(function (w) {
  var A = w.NaqaAdmin;
  if (!A) return;
  function safe(fn) { try { fn(); } catch (err) { try { console.error("naqa orders btn", err); } catch (e) {} } }
  var ordersList = document.getElementById("ordersList");
  if (ordersList) ordersList.addEventListener("click", function (e) {
    safe(function () {
      if (e.target.closest("[data-st-pick]")) return;
      if (e.target.closest(".order-pick-lab") || e.target.classList.contains("order-pick")) return;
      var opener = e.target.closest("[data-open-order]");
      if (opener && !e.target.closest("[data-st],[data-pay],a")) {
        var oid = opener.getAttribute("data-open-order");
        A.openOrderIds = A.openOrderIds || {};
        A.openOrderIds[oid] = !A.openOrderIds[oid];
        var art = opener.closest(".order");
        var body = art && art.querySelector(".order-body");
        if (body) body.hidden = !A.openOrderIds[oid];
        opener.setAttribute("aria-expanded", A.openOrderIds[oid] ? "true" : "false");
        return;
      }
      var payBtn = e.target.closest("[data-pay]");
      if (payBtn) {
        A.confirmPayment(payBtn.getAttribute("data-pay"));
        A.paintOrders();
        var cm = A.t("confirmedMsg") || ""; if (cm) A.setMsg("orderStatus", cm); else A.setMsg("orderStatus", "");
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

  if (ordersList) ordersList.addEventListener("change", function (e) {
    safe(function () {
      if (e.target && e.target.classList && e.target.classList.contains("order-pick")) {
        A.selectedOrderIds = A.selectedOrderIds || {};
        var id = e.target.getAttribute("data-oid");
        if (id) A.selectedOrderIds[id] = !!e.target.checked;
        /* refresh export label without full repaint if possible */
        var exp = document.getElementById("exportOrdersCsv");
        if (exp) {
          var n = 0; Object.keys(A.selectedOrderIds).forEach(function (k) { if (A.selectedOrderIds[k]) n++; });
          exp.textContent = n ? ((A.t("exportSelected") || "تصدير المحدد") + " (" + n + ")") : (A.t("exportExcel") || A.t("exportCsv") || "تصدير Excel");
        }
        var all = document.getElementById("ordSelectAll");
        if (all) {
          var boxes = document.querySelectorAll("#ordersList .order-pick");
          var allOn = boxes.length && Array.prototype.every.call(boxes, function (b) { return b.checked; });
          all.checked = !!allOn;
        }
        return;
      }
      var pick = e.target.closest("[data-st-pick]");
      if (!pick) return;
      var id = pick.getAttribute("data-oid");
      var next = pick.value;
      var prev = "new";
      A.orders.forEach(function (o) { if (String(o.id) === String(id)) prev = A.normalizeStatus(o.status); });
      if (next === prev) return;
      if (next === "cancel" && !confirm(A.t("cancelConfirm") + "\n" + id)) { pick.value = prev; return; }
      A.orders.forEach(function (o) {
        if (String(o.id) !== String(id)) return;
        o.status = next;
        if (next === "cancel" && prev !== "cancel") A.restoreStockForOrder(o);
        else if (next !== "cancel" && prev === "cancel") A.deductStockForOrder(o);
        else if (next !== "cancel" && !o.stockDeducted && (next === "prep" || next === "ship" || next === "delivered")) A.deductStockForOrder(o);
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
