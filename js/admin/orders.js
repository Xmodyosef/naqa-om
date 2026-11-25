(function (w) {
  var A = w.NaqaAdmin;
  A.paintStatusBar = function () {
    if (A.fillPageSubNav) A.fillPageSubNav();
    if (A.updateOrdersBadge) A.updateOrdersBadge();
  };
  A.syncOrdersTab = function () {
    var btn = document.querySelector('#tabs button[data-tab="orders"]');
    if (!btn || !A.t) return;
    var n = (A.orders && A.orders.length) || 0;
    var label = A.t("tab_orders");
    btn.textContent = n ? (label + " (" + n + ")") : label;
  };

  A.exportOrdersCsv = function () {
    var rows = [["id", "at", "status", "name", "phone", "area", "total", "payment", "items"]];
    (A.orders || []).forEach(function (o) {
      if (!A.inDateRange(o.at)) return;
      var st = A.normalizeStatus(o.status);
      var items = "";
      if (Array.isArray(o.items) && o.items.length) {
        items = o.items.map(function (it) {
          var n = A.lang === "en" ? (it.nameEn || it.name || it.nameAr) : (it.nameAr || it.name || it.nameEn);
          return (n || "") + " x" + (it.qty || 1) + " (" + (it.sku || "") + ")";
        }).join("; ");
      } else {
        items = o.itemsText || "";
      }
      rows.push([
        o.id || "", o.at || "", st, o.name || "", o.phone || "", o.area || "",
        o.total != null ? o.total : "", A.payText(o), items
      ]);
    });
    A.downloadCsv("naqa-orders.csv", rows);
    A.setMsg("orderStatus", A.t("exportOk"));
  };
  A.importOrdersCsv = function (file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var text = String(reader.result || "");
        var table = A.parseCsv ? A.parseCsv(text) : null;
        if (!table || !table.length) {
          A.setMsg("orderStatus", A.t("importFail"));
          return;
        }
        var header = (table[0] || []).map(function (h) { return String(h || "").toLowerCase().trim(); });
        var idx = function (name) { return header.indexOf(name); };
        var idI = idx("id"), atI = idx("at"), stI = idx("status"), nameI = idx("name"), phoneI = idx("phone"), areaI = idx("area"), totalI = idx("total");
        if (idI < 0) {
          A.setMsg("orderStatus", A.t("importFail"));
          return;
        }
        var by = {};
        (A.orders || []).forEach(function (o) { if (o && o.id) by[o.id] = o; });
        for (var r = 1; r < table.length; r++) {
          var row = table[r] || [];
          var id = String(row[idI] || "").trim();
          if (!id) continue;
          var cur = by[id] || { id: id };
          if (atI >= 0 && row[atI]) cur.at = row[atI];
          if (stI >= 0 && row[stI]) cur.status = A.normalizeStatus(row[stI]);
          if (nameI >= 0) cur.name = row[nameI] || cur.name || "";
          if (phoneI >= 0) cur.phone = row[phoneI] || cur.phone || "";
          if (areaI >= 0) cur.area = row[areaI] || cur.area || "";
          if (totalI >= 0 && row[totalI] !== "" && row[totalI] != null) cur.total = Number(row[totalI]);
          by[id] = cur;
        }
        A.orders = Object.keys(by).map(function (k) { return by[k]; });
        if (A.saveOrders) A.saveOrders();
        A.setMsg("orderStatus", A.t("importOk"));
        A.paintOrders();
      } catch (e) {
        A.setMsg("orderStatus", A.t("importFail"));
      }
    };
    reader.readAsText(file);
  };
  A.paintOrders = function () {
    try { A.syncOrdersTab(); } catch (e) {}
    A.orders.forEach(function (o) { o.status = A.normalizeStatus(o.status); });
    A.paintStatusBar();
    var tools = document.getElementById("ordersTools");
    if (tools) {
      if (!tools._ready) {
        tools._ready = true;
        tools.addEventListener("click", function (e) {
          var t = e.target;
          if (t.id === "copyAllOrders") A.copyText(A.buildOrdersReport("all"), "orderStatus");
          if (t.id === "copyNewOrders") A.copyText(A.buildOrdersReport("new"), "orderStatus");
          if (t.id === "waOrdersReport") A.waShareText(A.buildOrdersReport(A.orderFilter === "all" ? "new" : A.orderFilter));
          if (t.id === "exportOrdersCsv") A.exportOrdersCsv();
          if (t.id === "importOrdersBtn") {
            var inp = document.getElementById("importOrdersFile");
            if (inp) inp.click();
          }
        });
        tools.addEventListener("change", function (e) {
          if (e.target && e.target.id === "importOrdersFile") {
            A.importOrdersCsv(e.target.files && e.target.files[0]);
            e.target.value = "";
          }
        });
      }
      tools.innerHTML =
        A.dateFilterHtml("ordDate")
        + '<button type="button" class="mini" id="copyAllOrders">' + A.t("o_copyAll") + '</button>'
        + '<button type="button" class="mini" id="copyNewOrders">' + A.t("o_copyNew") + '</button>'
        + '<button type="button" class="mini" id="waOrdersReport" style="background:#25D366;color:#fff">' + A.t("o_waSum") + '</button>'
        + '<button type="button" class="mini" id="exportOrdersCsv">' + A.t("exportCsv") + '</button>'
        + '<button type="button" class="mini" id="importOrdersBtn">' + A.t("importCsv") + '</button>'
        + '<input id="importOrdersFile" type="file" accept=".csv,text/csv" hidden>';
      A.bindDateFilter("ordDate", function () { A.paintOrders(); });
    }
    var box = document.getElementById("ordersList");
    if (!box) return;
    var list = A.orders.filter(function (o) {
      if (!A.inDateRange(o.at)) return false;
      if (!(A.orderFilter === "all" || A.normalizeStatus(o.status) === A.orderFilter)) return false;
      var q = String(A.orderQuery || "").trim().toLowerCase();
      if (!q) return true;
      var bits = [o.id, o.name, o.phone, o.city, o.area, o.address, o.note];
      (o.items || []).forEach(function (it) { bits.push(it.name, it.nameAr, it.sku); });
      return bits.join(" ").toLowerCase().indexOf(q) >= 0;
    });
    if (!A.orders.length) {
      box.innerHTML = '<p class="note">' + A.t("o_empty") + '</p>';
      return;
    }
    if (!list.length) {
      box.innerHTML = '<p class="note">' + A.t("o_emptyFilter") + '</p>';
      return;
    }
    box.innerHTML = list.map(function (o) {
      var st = A.normalizeStatus(o.status);
      var items = "";
      if (Array.isArray(o.items) && o.items.length) {
        items = '<ul class="items">' + o.items.map(function (it) {
          var thumb = it.img ? ('<img src="' + A.esc(it.img) + '" alt="" style="width:40px;height:40px;object-fit:contain;border-radius:8px;background:#f6f1ee;margin-left:8px">') : "";
          return '<li>' + thumb + '<strong>' + A.esc((A.lang === 'en' ? (it.nameEn || it.name || it.nameAr) : (it.nameAr || it.name || it.nameEn)) || "") + '</strong><small>SKU ' + A.esc(it.sku || "—") + ' · ×' + A.esc(it.qty) + ' · ' + A.esc(it.line != null ? it.line : it.price) + ' ' + A.t("omr") + ' <span style="color:#9a7b72">' + A.t("o_vatLine") + '</span></small>'
            + (it.link ? ('<div><a href="' + A.esc(it.link) + '" target="_blank" rel="noopener">' + A.t("productLink") + '</a></div>') : "") + "</li>";
        }).join("") + "</ul>";
      } else if (o.itemsText) {
        items = '<pre class="note" style="white-space:pre-wrap">' + A.esc(o.itemsText) + "</pre>";
      }
      var when = o.at ? new Date(o.at).toLocaleString(A.lang === "en" ? "en-OM" : "ar-OM") : "";
      var phoneDigits = String(o.phone || "").replace(/\D/g, "").replace(/^968/, "");
      var statusBtns = A.STATUS_ORDER.map(function (k) {
        return '<button type="button" class="mini' + (st === k ? " on" : (k === "cancel" ? " ghost" : "")) + '" data-st="' + k + '" data-oid="' + A.esc(o.id) + '">' + A.statusLabel(k) + '</button>';
      }).join("");
      return '<article class="order" data-oid="' + A.esc(o.id) + '">'
        + '<strong>' + A.esc(o.id) + ' <span class="badge ' + A.esc(st) + '">' + A.esc(A.statusLabel(st) || st) + "</span></strong>"
        + "<small>" + A.esc(when) + "</small>"
        + "<small>" + A.esc(o.name || "—") + " · " + A.esc(o.phone || "—") + " · " + A.esc(o.area || "—") + "</small>"
        + "<small>" + A.t("total") + ": <b>" + A.esc(o.total != null ? Number(o.total).toFixed(3) : "—") + " " + A.t("omr") + "</b></small>"
        + "<small style=\"color:#9a8b84;font-size:12px\">" + A.t("vatInc") + " · " + A.t("vatOf") + " " + A.esc(
          o.vat != null ? Number(o.vat).toFixed(3) : (o.total != null ? (Number(o.total) * 0.05 / 1.05).toFixed(3) : "—")
        ) + " " + A.t("omr") + "</small>"
        + "<small>" + A.t("payLine") + ": <b>" + A.esc(A.payText(o)) + "</b>"
        + (o.subtotal != null ? (" · " + A.t("o_sub") + " " + A.esc(Number(o.subtotal).toFixed(3))) : "")
        + (o.shipping != null ? (" · " + A.esc(Number(o.shipping).toFixed(3)) + " " + A.t("omr")) : "")
        + "</small>"
        + (o.note ? ("<small>" + A.t("note") + ": " + A.esc(o.note) + "</small>") : "")
        + items + '<div class="actions">' + statusBtns
        + (A.payState(o) === "pending" ? ('<button type="button" class="mini" data-pay="' + A.esc(o.id) + '">' + A.t("confirmPay") + '</button>') : "")
        + (phoneDigits ? ('<a class="mini" style="background:#25D366;display:inline-block;color:#fff;text-decoration:none;text-align:center" href="https://wa.me/968' + A.esc(phoneDigits) + '" target="_blank" rel="noopener">' + A.t("wa") + '</a>') : "")
        + '</div></article>';
    }).join("");
  };
})(window);
