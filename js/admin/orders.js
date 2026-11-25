(function (w) {
  var A = w.NaqaAdmin;
  A.paintStatusBar = function () {
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
      if (A.ordersInRange && !A.ordersInRange(o.at)) return;
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

  A.itemTaxView = function (it) {
    var qty = Math.max(1, Number(it && it.qty) || 1);
    var unit = Number(it && it.price);
    if (!isFinite(unit)) {
      var line0 = Number(it && it.line);
      unit = isFinite(line0) ? line0 / qty : 0;
    }
    var prod = null;
    if (A.products && it && (it.id != null || it.sku)) {
      prod = A.products.find(function (p) {
        return (it.id != null && String(p.id) === String(it.id)) || (it.sku && p.sku && String(p.sku) === String(it.sku));
      }) || null;
    }
    var merged = prod && A.merged ? A.merged(prod) : (prod || {});
    var was = Number(it && it.was != null ? it.was : merged.was);
    var mode = (it && it.taxMode) || merged.taxMode || "vat5";
    var custom = it && it.taxCustom != null ? Number(it.taxCustom) : Number(merged.taxCustom);
    var rate = 0.05;
    var mark = "5%";
    if (mode === "exempt") { rate = 0; mark = "0%"; }
    else if (mode === "custom" && isFinite(custom) && custom >= 0) {
      rate = custom / 100;
      mark = (Math.round(custom * 10) / 10).toString().replace(/\.0$/, "") + "%";
    }
    var off = 0;
    if (isFinite(was) && was > unit + 0.0005) off = Math.round((was - unit) / was * 100);
    var paid = unit * qty;
    var tax = rate <= 0 ? 0 : paid * rate / (1 + rate);
    return { qty: qty, unit: unit, was: was, off: off, tax: tax, mark: mark };
  };


  A.fmtMoney = function (n) {
    n = Number(n);
    if (!isFinite(n)) return "—";
    var s = n.toFixed(3).replace(/\.?0+$/, "");
    if (s === "-0") s = "0";
    return s;
  };

  A.orderTotals = function (o) {
    var paid = 0, discount = 0, tax = 0;
    (o.items || []).forEach(function (it) {
      var v = A.itemTaxView(it);
      paid += v.unit * v.qty;
      if (v.off > 0 && isFinite(v.was) && v.was > v.unit) discount += (v.was - v.unit) * v.qty;
      tax += v.tax;
    });
    if (!(o.items && o.items.length) && o.subtotal != null) paid = Number(o.subtotal) || 0;
    var del = o.delivery != null ? Number(o.delivery) : 0;
    var cod = o.codFee != null ? Number(o.codFee) : 0;
    if (!isFinite(del)) del = 0;
    if (!isFinite(cod)) cod = 0;
    var grand = o.total != null ? Number(o.total) : (paid + del + cod);
    return {
      paid: paid,
      discount: discount,
      beforeTax: Math.max(0, paid - tax),
      tax: tax,
      del: del,
      cod: cod,
      grand: grand
    };
  };

  A.paintOrders = function () {
    try { A.syncOrdersTab(); } catch (e) {}
    A.orders.forEach(function (o) { o.status = A.normalizeStatus(o.status); });
    try { if (A.updateOrdersBadge) A.updateOrdersBadge(); } catch (e2) {}
    A.paintStatusBar();
    var tools = document.getElementById("ordersTools");
    if (tools) {
      if (!tools._ready) {
        tools._ready = true;
        tools.addEventListener("click", function (e) {
          var t = e.target;
          if (t.id === "waOrdersReport") A.waShareText(A.buildOrdersReport(A.orderFilter === "all" ? "new" : A.orderFilter));
          if (t.id === "exportOrdersCsv") A.exportOrdersCsv();
        });
        tools.addEventListener("toggle", function (e) {
          if (e.target && e.target.id === "ordersToolsPanel") {
            A.ordersToolsOpen = !!e.target.open;
          }
        }, true);
      }
      var openAttr = A.ordersToolsOpen ? " open" : "";
      tools.innerHTML =
        '<details class="orders-filter-pill" id="ordersToolsPanel"' + openAttr + '>'
        + '<summary class="status-one filter-sum">' + A.esc(A.t("o_tools") || "فلتر") + '</summary>'
        + '<div class="tools-body">'
        + A.dateFilterHtml("ordDate", "order", { noClear: true })
        + '<button type="button" class="mini" id="waOrdersReport" style="background:#25D366;color:#fff">' + A.t("o_waSum") + '</button>'
        + '<button type="button" class="mini" id="exportOrdersCsv">' + A.t("exportCsv") + '</button>'
        + '</div></details>';
      A.bindDateFilter("ordDate", function () { A.paintOrders(); }, "order");
    }
    var box = document.getElementById("ordersList");
    if (!box) return;
    var list = A.orders.filter(function (o) {
      if (A.ordersInRange && !A.ordersInRange(o.at)) return false;
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
      var emptyF = A.t("o_emptyFilter") || "";
      box.innerHTML = emptyF ? ('<p class="note">' + emptyF + '</p>') : "";
      return;
    }
    var cardHtml = function (o) {
      var st = A.normalizeStatus(o.status);
      var items = "";
      if (Array.isArray(o.items) && o.items.length) {
        items = '<ul class="items">' + o.items.map(function (it) {
          var name = (A.lang === "en" ? (it.nameEn || it.name || it.nameAr) : (it.nameAr || it.name || it.nameEn)) || "";
          var tax = A.itemTaxView(it);
          var thumb = it.img ? ('<img src="' + A.esc(it.img) + '" alt="" class="line-thumb">') : "";
          var money = function (n) { return A.esc(A.fmtMoney(n)); };
          var priceBit = "";
          if (tax.off > 0) {
            priceBit = '<s class="price-was">' + money(tax.was) + '</s>'
              + '<b class="off-mark">−' + tax.off + '%</b>'
              + '<span>' + money(tax.unit) + '</span>';
          } else {
            priceBit = '<span>' + money(tax.unit) + '</span>';
          }
          return '<li class="line">' + thumb + '<div class="line-main"><strong>' + A.esc(name) + '</strong>'
            + '<div class="line-meta">' + priceBit + '<span class="line-qty">×' + A.esc(tax.qty) + '</span>'
            + '<span class="tax-mark">' + A.esc(tax.mark) + '</span>'
            + '<span class="tax-amt">' + money(tax.tax) + '</span></div></div></li>';
        }).join("") + "</ul>";
      } else if (o.itemsText) {
        items = '<pre class="note" style="white-space:pre-wrap">' + A.esc(o.itemsText) + "</pre>";
      }
      var when = "";
      try {
        when = o.at ? A.fmtDateTimeNum(o.at) : "";
      } catch (e) { when = o.at || ""; }
      var phoneDigits = String(o.phone || "").replace(/\D/g, "").replace(/^968/, "");
      var statusPick = '<select class="status-one ' + A.esc(st) + '" data-st-pick data-oid="' + A.esc(o.id) + '" aria-label="' + A.esc(A.t("statusTo")) + '">'
        + A.STATUS_ORDER.map(function (k) {
          return '<option value="' + k + '"' + (st === k ? " selected" : "") + '>' + A.esc(A.statusLabel(k)) + '</option>';
        }).join("") + '</select>';
      var open = A.openOrderIds && A.openOrderIds[o.id];
      var sums = A.orderTotals(o);
      var tot = A.fmtMoney(sums.grand) + " " + A.t("omr");
      var totRows = "";
      totRows += '<div class="tot-row"><span>' + A.t("o_preTax") + '</span><b>' + A.esc(A.fmtMoney(sums.beforeTax)) + '</b></div>';
      if (sums.discount > 0.0005) {
        totRows += '<div class="tot-row disc"><span>' + A.t("o_disc") + '</span><b>−' + A.esc(A.fmtMoney(sums.discount)) + '</b></div>';
      }
      if (sums.del > 0.0005) {
        totRows += '<div class="tot-row"><span>' + A.t("o_del") + '</span><b>' + A.esc(A.fmtMoney(sums.del)) + '</b></div>';
      }
      if (sums.cod > 0.0005) {
        totRows += '<div class="tot-row"><span>' + A.t("o_cod") + '</span><b>' + A.esc(A.fmtMoney(sums.cod)) + '</b></div>';
      }
      totRows += '<div class="tot-row grand"><span>' + A.t("o_grand") + '</span><b>' + A.esc(A.fmtMoney(sums.grand)) + ' ' + A.t("omr") + '</b></div>';
      var totals = '<div class="order-totals">' + totRows + '</div>';
      return '<article class="order" data-oid="' + A.esc(o.id) + '">'
        + '<div class="order-head">'
        + '<b class="order-id">' + A.esc(o.id) + '</b>'
        + statusPick
        + '<button type="button" class="order-sum" data-open-order="' + A.esc(o.id) + '" aria-expanded="' + (open ? "true" : "false") + '">'
        + '<span class="order-when">' + A.esc(when) + '</span>'
        + '<b class="order-tot">' + A.esc(tot) + '</b>'
        + '</button></div>'
        + '<div class="order-body"' + (open ? "" : " hidden") + '>'
        + "<small>" + A.esc(o.name || "—") + " · " + A.esc(o.phone || "—") + " · " + A.esc(o.area || "—") + "</small>"
        + "<small>" + A.t("payLine") + ": <b>" + A.esc(A.payText(o)) + "</b></small>"
        + (o.note ? ("<small>" + A.t("note") + ": " + A.esc(o.note) + "</small>") : "")
        + items
        + totals
        + '<div class="actions">'
        + (A.payState(o) === "pending" ? ('<button type="button" class="mini" data-pay="' + A.esc(o.id) + '">' + A.t("confirmPay") + '</button>') : "")
        + (phoneDigits ? ('<a class="mini" style="background:#25D366;display:inline-block;color:#fff;text-decoration:none;text-align:center" href="https://wa.me/968' + A.esc(phoneDigits) + '" target="_blank" rel="noopener">' + A.t("wa") + '</a>') : "")
        + '</div></div></article>';
    };
    list.sort(function (a, b) { return String(b.at || "").localeCompare(String(a.at || "")); });
    /* No day headers — each order already shows its own date/time */
    box.innerHTML = list.map(cardHtml).join("");
  };
})(window);
