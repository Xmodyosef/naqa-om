(function (w) {
  var A = w.NaqaAdmin;
  A.orderDatePreset = A.orderDatePreset || "all";
  A.applyOrderDatePreset = function (v) {
    A.orderDatePreset = v || "all";
    var today = A.dayKey(new Date());
    if (v === "all" || !v) {
      A.orderDateFrom = "";
      A.orderDateTo = "";
      return;
    }
    if (v === "today") {
      A.orderDateFrom = today;
      A.orderDateTo = today;
      return;
    }
    var days = Number(v) || 0;
    if (days > 0) {
      var d = new Date();
      d.setDate(d.getDate() - (days - 1));
      A.orderDateFrom = A.dayKey(d);
      A.orderDateTo = today;
    }
  };

  A.getVisibleOrders = function () {
    var sel = A.selectedOrderIds || {};
    var hasSel = Object.keys(sel).some(function (k) { return !!sel[k]; });
    var out = [];
    (A.orders || []).forEach(function (o) {
      if (!o || !o.id) return;
      if (hasSel) {
        if (sel[o.id]) out.push(o);
        return;
      }
      if (A.ordersInRange && !A.ordersInRange(o.at)) return;
      if (!(A.orderFilter === "all" || A.normalizeStatus(o.status) === A.orderFilter)) return;
      var q = String(A.orderQuery || "").trim().toLowerCase();
      if (q) {
        var bits = [o.id, o.name, o.phone, o.city, o.area, o.address, o.note];
        (o.items || []).forEach(function (it) { bits.push(it.name, it.nameAr, it.sku); });
        if (bits.join(" ").toLowerCase().indexOf(q) < 0) return;
      }
      out.push(o);
    });
    out.sort(function (a, b) { return String(b.at || "").localeCompare(String(a.at || "")); });
    return out;
  };

  A.printOrdersPdf = function () {
    var list = A.getVisibleOrders();
    if (!list.length) {
      A.setMsg("orderStatus", A.t("o_printEmpty") || "");
      return;
    }
    var dir = A.lang === "en" ? "ltr" : "rtl";
    var lang = A.lang === "en" ? "en" : "ar";
    var title = A.t("o_pdfHead") || "Naqa";
    var printed = A.t("o_pdfPrinted") || "";
    var whenPrint = "";
    try { whenPrint = A.fmtDateTimeNum(new Date()); } catch (e) { whenPrint = new Date().toISOString(); }
    var omr = A.t("omr") || "OMR";
    var money = function (n) {
      try { return A.fmtMoney(n); } catch (e2) { return String(n == null ? "—" : n); }
    };
    /* نص دفع نظيف للطباعة — بدون «الرسوم انحذفت» */
    var payLabel = function (o) {
      var s = (o && (o.paymentStatus || o.payStatus || o.payment || o.pay)) || "";
      s = String(s).toLowerCase();
      if (s === "confirmed" || s.indexOf("confirm") >= 0) return A.t("payConfirmed") || "Confirmed";
      if (s === "pending" || s.indexOf("pending") >= 0 || s.indexOf("bank") >= 0) return A.t("payPending") || "Pending";
      if (s === "cod" || s.indexOf("cod") >= 0 || s.indexOf("استلام") >= 0) return A.t("payCod") || "COD";
      if (A.payText) {
        var t = A.payText(o) || "";
        return String(t).replace(/\s*[·•]\s*الرسوم\s*انحذفت?/gi, "").replace(/\s*[·•]\s*fees\s*removed/gi, "").trim() || t;
      }
      return o.payment || "—";
    };
    var cards = list.map(function (o, idx) {
      var st = A.normalizeStatus(o.status);
      var when = "";
      try { when = o.at ? A.fmtDateTimeNum(o.at) : ""; } catch (e2) { when = o.at || ""; }
      var sums = A.orderTotals ? A.orderTotals(o) : { grand: o.total || 0, paid: 0, del: 0, cod: 0, discount: 0, tax: 0 };
      var itemsHtml = "";
      if (Array.isArray(o.items) && o.items.length) {
        itemsHtml = "<table class='items'><thead><tr>"
          + "<th class='c-n'>#</th>"
          + "<th class='c-name'>" + A.esc(A.t("o_pdfItems") || "Items") + "</th>"
          + "<th class='c-q'>" + A.esc(A.t("o_pdfQty") || "Qty") + "</th>"
          + "<th class='c-p'>" + A.esc(A.t("o_pdfPrice") || "Price") + "</th>"
          + "<th class='c-l'>" + A.esc(A.t("o_pdfLine") || "Total") + "</th>"
          + "</tr></thead><tbody>"
          + o.items.map(function (it, i) {
              var name = (A.lang === "en" ? (it.nameEn || it.name || it.nameAr) : (it.nameAr || it.name || it.nameEn)) || "";
              var tax = A.itemTaxView ? A.itemTaxView(it) : { qty: it.qty || 1, unit: it.price || 0 };
              var line = (Number(tax.unit) || 0) * (Number(tax.qty) || 1);
              return "<tr>"
                + "<td class='c-n'>" + (i + 1) + "</td>"
                + "<td class='c-name'>" + A.esc(name) + (it.sku ? (" <span class='sku'>" + A.esc(it.sku) + "</span>") : "") + "</td>"
                + "<td class='c-q'>" + A.esc(tax.qty) + "</td>"
                + "<td class='c-p'>" + A.esc(money(tax.unit)) + "</td>"
                + "<td class='c-l'>" + A.esc(money(line)) + "</td>"
                + "</tr>";
            }).join("")
          + "</tbody></table>";
      } else if (o.itemsText) {
        itemsHtml = "<pre class='note'>" + A.esc(o.itemsText) + "</pre>";
      }
      var sumRows = "";
      if (sums.paid) sumRows += "<div class='sum-row'><span>" + A.esc(A.t("o_sub") || "Subtotal") + "</span><b>" + A.esc(money(sums.paid)) + " " + A.esc(omr) + "</b></div>";
      if (sums.discount > 0) sumRows += "<div class='sum-row'><span>" + A.esc(A.t("o_disc") || "Discount") + "</span><b>−" + A.esc(money(sums.discount)) + " " + A.esc(omr) + "</b></div>";
      if (sums.del) sumRows += "<div class='sum-row'><span>" + A.esc(A.t("o_del") || "Delivery") + "</span><b>" + A.esc(money(sums.del)) + " " + A.esc(omr) + "</b></div>";
      if (sums.cod) sumRows += "<div class='sum-row'><span>" + A.esc(A.t("o_cod") || "COD fee") + "</span><b>" + A.esc(money(sums.cod)) + " " + A.esc(omr) + "</b></div>";
      sumRows += "<div class='sum-row grand'><span>" + A.esc(A.t("o_grand") || "Total") + "</span><b>" + A.esc(money(sums.grand)) + " " + A.esc(omr) + "</b></div>";
      return "<section class='card'>"
        + "<header class='card-head'>"
        + "<div class='oid'><span class='lab'>" + A.esc(A.lang === "en" ? "Order" : "طلب") + "</span><b>" + A.esc(o.id) + "</b></div>"
        + "<span class='st'>" + A.esc(A.statusLabel(st)) + "</span>"
        + "<span class='when'>" + A.esc(when) + "</span>"
        + "</header>"
        + "<div class='grid'>"
        + "<div class='cell'><div class='k'>" + A.esc(A.t("o_pdfCustomer") || "Customer") + "</div><div class='v'>" + A.esc(o.name || "—") + "</div></div>"
        + "<div class='cell'><div class='k'>" + A.esc(A.t("o_pdfContact") || "Contact") + "</div><div class='v dir-ltr'>" + A.esc(o.phone || "—") + "</div></div>"
        + "<div class='cell'><div class='k'>" + A.esc(A.t("o_pdfArea") || "Area") + "</div><div class='v'>" + A.esc(o.area || o.city || "—") + "</div></div>"
        + "<div class='cell'><div class='k'>" + A.esc(A.t("payLine") || "Payment") + "</div><div class='v'>" + A.esc(payLabel(o)) + "</div></div>"
        + "</div>"
        + (o.note ? ("<div class='note-line'><span class='k'>" + A.esc(A.t("note") || "Note") + ":</span> " + A.esc(o.note) + "</div>") : "")
        + itemsHtml
        + "<div class='summary'><div class='sum-title'>" + A.esc(A.t("o_pdfSummary") || "Summary") + "</div>" + sumRows + "</div>"
        + "</section>";
    }).join("");
    var html = "<!doctype html><html lang='" + lang + "' dir='" + dir + "'><head><meta charset='utf-8'>"
      + "<title>" + A.esc(title) + "</title>"
      + "<style>"
      + "/* A4 full-bleed friendly */"
      + "@page{size:A4;margin:10mm 12mm}"
      + "*{box-sizing:border-box}"
      + "html,body{width:100%;margin:0;padding:0;background:#fff}"
      + "body{font-family:'Noto Sans Arabic','IBM Plex Sans',Tahoma,system-ui,sans-serif;color:#1a1412;"
      + "font-size:11.5pt;line-height:1.45;padding:0 2mm}"
      + ".sheet{width:100%;max-width:186mm;margin:0 auto}"
      + ".doc-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;"
      + "border-bottom:2.5px solid #8d3048;padding:0 0 10px;margin:0 0 14px}"
      + ".doc-head h1{font-size:18pt;margin:0;color:#8d3048;font-weight:800;letter-spacing:-.02em}"
      + ".doc-head .sub{font-size:10pt;color:#5c534e;text-align:end}"
      + ".card{width:100%;border:1px solid #e2d4cf;border-radius:8px;padding:12px 14px;margin:0 0 12px;"
      + "page-break-inside:avoid;background:#fff}"
      + ".card-head{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:0 0 10px;"
      + "padding-bottom:8px;border-bottom:1px solid #efe4df}"
      + ".oid .lab{display:block;font-size:8.5pt;color:#8a7f78;font-weight:700}"
      + ".oid b{font-size:13pt;color:#1a1412}"
      + ".st{background:#f3e6e9;color:#8d3048;border-radius:999px;padding:4px 12px;font-size:9.5pt;font-weight:800}"
      + ".when{margin-inline-start:auto;font-size:10pt;color:#5c534e;font-variant-numeric:tabular-nums}"
      + ".grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;margin:0 0 10px}"
      + ".cell .k{font-size:8.5pt;color:#8a7f78;font-weight:700;margin-bottom:2px}"
      + ".cell .v{font-size:11pt;font-weight:600;color:#1a1412;word-break:break-word}"
      + ".dir-ltr{direction:ltr;unicode-bidi:isolate;text-align:start}"
      + ".note-line{font-size:10pt;background:#faf6f4;border-radius:6px;padding:6px 10px;margin:0 0 10px}"
      + ".note-line .k{font-weight:800;color:#8d3048}"
      + "table.items{width:100%;border-collapse:collapse;margin:4px 0 12px;font-size:10.5pt}"
      + "table.items th{background:#f7eee9;color:#5c3a40;font-weight:800;padding:7px 8px;border-bottom:2px solid #e8ddd8;text-align:start}"
      + "table.items td{padding:7px 8px;border-bottom:1px solid #efe4df;vertical-align:top}"
      + "table.items tbody tr:last-child td{border-bottom:0}"
      + ".c-n{width:28px;text-align:center!important;color:#8a7f78}"
      + ".c-q,.c-p,.c-l{width:72px;text-align:end!important;font-variant-numeric:tabular-nums;white-space:nowrap}"
      + ".sku{display:inline-block;font-size:8.5pt;color:#8a7f78;font-weight:600;margin-inline-start:4px}"
      + ".summary{margin-top:4px;padding:10px 12px;background:#fdf8f6;border:1px solid #efe4df;border-radius:8px;"
      + "max-width:280px;margin-inline-start:auto}"
      + ".sum-title{font-size:9pt;font-weight:800;color:#8d3048;margin-bottom:6px}"
      + ".sum-row{display:flex;justify-content:space-between;gap:16px;font-size:10.5pt;padding:3px 0;color:#3a322e}"
      + ".sum-row.grand{margin-top:4px;padding-top:6px;border-top:1.5px solid #d9c8c2;font-size:12.5pt;font-weight:800;color:#8d3048}"
      + "pre.note{white-space:pre-wrap;font-size:10pt;background:#faf6f4;padding:10px;border-radius:8px;margin:0 0 10px}"
      + "@media print{body{padding:0}.sheet{max-width:none}.no-print{display:none!important}}"
      + "@media screen{body{padding:16px;background:#ece6e2}.sheet{background:#fff;padding:14px 16px;border-radius:10px;"
      + "box-shadow:0 2px 12px rgba(0,0,0,.08)}}"
      + "</style></head><body><div class='sheet'>"
      + "<div class='doc-head'><h1>" + A.esc(title) + "</h1>"
      + "<div class='sub'>" + A.esc(printed) + ": " + A.esc(whenPrint) + "<br>" + list.length + " "
      + A.esc(A.lang === "en" ? (list.length === 1 ? "order" : "orders") : "طلب") + "</div></div>"
      + cards
      + "</div>"
      + "<script>window.onload=function(){setTimeout(function(){window.print();},280);}<\\/script>"
      + "</body></html>";
    var w = window.open("", "_blank");
    if (!w) {
      A.setMsg("orderStatus", A.lang === "en" ? "Allow popups to print PDF" : "اسمحي بالنوافذ المنبثقة للطباعة");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

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

  A.selectedOrderIds = A.selectedOrderIds || {};
  A.exportOrdersCsv = function (opts) {
    opts = opts || {};
    var rows = [["id", "at", "status", "name", "phone", "area", "total", "payment", "items"]];
    var sel = A.selectedOrderIds || {};
    var hasSel = Object.keys(sel).some(function (k) { return !!sel[k]; });
    var count = 0;
    (A.orders || []).forEach(function (o) {
      if (!o || !o.id) return;
      if (hasSel) {
        if (!sel[o.id]) return;
      } else {
        if (A.ordersInRange && !A.ordersInRange(o.at)) return;
        if (!(A.orderFilter === "all" || A.normalizeStatus(o.status) === A.orderFilter)) return;
        var q = String(A.orderQuery || "").trim().toLowerCase();
        if (q) {
          var bits = [o.id, o.name, o.phone, o.city, o.area, o.address, o.note];
          (o.items || []).forEach(function (it) { bits.push(it.name, it.nameAr, it.sku); });
          if (bits.join(" ").toLowerCase().indexOf(q) < 0) return;
        }
      }
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
      var when = "";
      try { when = o.at ? A.fmtDateTimeNum(o.at) : (o.at || ""); } catch (e) { when = o.at || ""; }
      rows.push([
        o.id || "", when, st, o.name || "", o.phone || "", o.area || "",
        o.total != null ? o.total : "", A.payText(o), items
      ]);
      count++;
    });
    if (count === 0) {
      A.setMsg("orderStatus", A.t("exportNone") || "");
      return;
    }
    A.downloadCsv("naqa-orders.csv", rows);
    A.setMsg("orderStatus", hasSel ? (A.t("exportOkSel") || A.t("exportOk")) : A.t("exportOk"));
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

  A.syncExportLabel = function () {
    var exp = document.getElementById("exportOrdersCsv");
    if (!exp) return;
    var n = 0;
    Object.keys(A.selectedOrderIds || {}).forEach(function (k) { if (A.selectedOrderIds[k]) n++; });
    exp.textContent = n
      ? ((A.t("exportSelected") || "تصدير المحدد") + " (" + n + ")")
      : (A.t("exportExcel") || "Excel");
    var all = document.getElementById("ordSelectAll");
    if (all) {
      var boxes = document.querySelectorAll("#ordersList .order-pick");
      all.checked = !!(boxes.length && Array.prototype.every.call(boxes, function (b) { return b.checked; }));
    }
  };

  A.ensureOrdersTools = function () {
    var tools = document.getElementById("ordersTools");
    if (!tools) return;
    if (!tools._ready) {
      tools._ready = true;
      tools.addEventListener("change", function (e) {
        var t = e.target;
        if (!t) return;
        if (t.id === "ordDateFrom" || t.id === "ordDateTo") {
          A.orderDatePreset = "custom";
          A.orderDateFrom = (document.getElementById("ordDateFrom") || {}).value || "";
          A.orderDateTo = (document.getElementById("ordDateTo") || {}).value || "";
          /* لا نعيد بناء أدوات التاريخ — فقط نحدّث القائمة */
          A.paintOrders({ skipTools: true });
          return;
        }
        if (t.id === "ordSelectAll") {
          var on = !!t.checked;
          A.selectedOrderIds = A.selectedOrderIds || {};
          document.querySelectorAll("#ordersList .order-pick").forEach(function (cb) {
            var id = cb.getAttribute("data-oid");
            cb.checked = on;
            if (id) A.selectedOrderIds[id] = on;
          });
          A.syncExportLabel();
          return;
        }
      });
      tools.addEventListener("click", function (e) {
        var t = e.target;
        if (!t) return;
        if (t.id === "exportOrdersCsv" || (t.closest && t.closest("#exportOrdersCsv"))) {
          A.exportOrdersCsv();
          return;
        }
        if (t.id === "printOrdersPdf" || (t.closest && t.closest("#printOrdersPdf"))) {
          A.printOrdersPdf();
        }
      });
    }
    /* ابني الأدوات مرة واحدة فقط — إلا إذا ناقص زر PDF (نسخة قديمة) */
    if (tools.querySelector("#ordersToolsPanel") && document.getElementById("printOrdersPdf")) {
      A.syncExportLabel();
      return;
    }
    var from = A.orderDateFrom || "";
    var to = A.orderDateTo || "";
    tools.innerHTML =
      '<div class="orders-filter-inline" id="ordersToolsPanel">'
      + '<label class="date-one-wrap" title="' + A.esc(A.t("f_from") || "من") + '">'
      + '<span class="date-one-lab">' + A.esc(A.t("f_from") || "من") + '</span>'
      + '<input type="date" lang="en" dir="ltr" class="date-one" id="ordDateFrom" value="' + A.esc(from) + '" aria-label="' + A.esc(A.t("f_from") || "من") + '">'
      + '</label>'
      + '<label class="date-one-wrap" title="' + A.esc(A.t("f_to") || "إلى") + '">'
      + '<span class="date-one-lab">' + A.esc(A.t("f_to") || "إلى") + '</span>'
      + '<input type="date" lang="en" dir="ltr" class="date-one" id="ordDateTo" value="' + A.esc(to) + '" aria-label="' + A.esc(A.t("f_to") || "إلى") + '">'
      + '</label>'
      + '<label class="pick-all-lab" title="' + A.esc(A.t("selectAllOrders") || "تحديد الكل") + '">'
      + '<input type="checkbox" id="ordSelectAll"><span class="pick-all-txt">' + A.esc(A.t("selectAllOrders") || "الكل") + '</span></label>'
      + '<button type="button" class="export-one" id="exportOrdersCsv">' + A.esc(A.t("exportExcel") || "Excel") + '</button>'
      + '<button type="button" class="export-one pdf-one" id="printOrdersPdf" title="' + A.esc(A.t("printPdfTitle") || "PDF") + '">' + A.esc(A.t("printPdf") || "PDF") + '</button>'
      + '</div>';
    A.syncExportLabel();
  };

  A.paintOrders = function (opts) {
    opts = opts || {};
    try { A.syncOrdersTab(); } catch (e) {}
    A.orders.forEach(function (o) { o.status = A.normalizeStatus(o.status); });
    try { if (A.updateOrdersBadge) A.updateOrdersBadge(); } catch (e2) {}
    A.paintStatusBar();
    if (!opts.skipTools) A.ensureOrdersTools();
    else A.syncExportLabel();
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
    var totalAll = (A.orders && A.orders.length) || 0;
    var countLine = (A.t("o_countLine") || "Showing: {shown} · All: {all}")
      .split("{shown}").join(String(list.length))
      .split("{all}").join(String(totalAll));
    var countHtml = '<p class="orders-count-line" id="ordersCountLine">' + A.esc(countLine) + '</p>';
    if (!A.orders.length) {
      box.innerHTML = countHtml + '<p class="note">' + A.t("o_empty") + '</p>';
      return;
    }
    if (!list.length) {
      var emptyF = A.t("o_emptyFilter") || "";
      box.innerHTML = countHtml + (emptyF ? ('<p class="note">' + emptyF + '</p>') : "");
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
      var picked = !!(A.selectedOrderIds && A.selectedOrderIds[o.id]);
      return '<article class="order" data-oid="' + A.esc(o.id) + '">'
        + '<div class="order-head">'
        + '<label class="order-pick-lab"><input type="checkbox" class="order-pick" data-oid="' + A.esc(o.id) + '"' + (picked ? " checked" : "") + ' aria-label="select"></label>'
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
    /* No day headers — each order already shows its own date/time. No slice: show ALL matching. */
    box.innerHTML = countHtml + list.map(cardHtml).join("");
  };
})(window);
