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

  /* الطلبات الظاهرة حالياً (فلتر + بحث + تاريخ) — بدون شرط التحديد */
  A.getFilteredOrders = function () {
    var out = [];
    (A.orders || []).forEach(function (o) {
      if (!o || !o.id) return;
      if (A.ordersInRange && !A.ordersInRange(o.at)) return;
      if (!(A.orderFilter === "all" || A.normalizeStatus(o.status) === A.orderFilter)) return;
      var q = String(A.orderQuery || "").trim().toLowerCase();
      if (q) {
        var bits = [o.id, o.name, o.phone, o.city, o.area, o.address, o.note, o.payment];
        (o.items || []).forEach(function (it) { bits.push(it.name, it.nameAr, it.nameEn, it.sku); });
        if (bits.join(" ").toLowerCase().indexOf(q) < 0) return;
      }
      out.push(o);
    });
    out.sort(function (a, b) { return String(b.at || "").localeCompare(String(a.at || "")); });
    return out;
  };

  /* المحدد فقط — للطباعة والتصدير عند وجود تحديد */
  A.getSelectedOrders = function () {
    var sel = A.selectedOrderIds || {};
    var out = [];
    (A.orders || []).forEach(function (o) {
      if (o && o.id && sel[o.id]) out.push(o);
    });
    out.sort(function (a, b) { return String(b.at || "").localeCompare(String(a.at || "")); });
    return out;
  };

  /* للتوافق: إن وُجد تحديد → المحدد، وإلا الظاهر */
  A.getVisibleOrders = function () {
    var sel = A.getSelectedOrders();
    if (sel.length) return sel;
    return A.getFilteredOrders();
  };

  A.countSelectedOrders = function () {
    var n = 0;
    Object.keys(A.selectedOrderIds || {}).forEach(function (k) {
      if (A.selectedOrderIds[k]) n++;
    });
    return n;
  };

  A.printOrdersPdf = function () {
    var list = A.getSelectedOrders ? A.getSelectedOrders() : [];
    if (!list.length) {
      A.setMsg("orderStatus", A.t("o_printNeedSel") || A.t("o_printEmpty") || "");
      return;
    }
    var dir = A.lang === "en" ? "ltr" : "rtl";
    var lang = A.lang === "en" ? "en" : "ar";
    var brand = A.t("o_pdfHead") || "Naqa";
    var printed = A.t("o_pdfPrinted") || "";
    var whenPrint = "";
    try { whenPrint = A.fmtDateTimeNum(new Date()); } catch (e) { whenPrint = new Date().toISOString(); }
    var omr = A.t("omr") || "OMR";
    var money = function (n) {
      try { return A.fmtMoney(n); } catch (e2) { return String(n == null ? "—" : n); }
    };
    var payLabel = function (o) {
      var s = String((o && (o.paymentStatus || o.payStatus || o.payment || o.pay)) || "").toLowerCase();
      if (s === "confirmed" || s.indexOf("confirm") >= 0) return A.t("payConfirmed") || "Confirmed";
      if (s === "pending" || s.indexOf("pending") >= 0 || s.indexOf("bank") >= 0 || s.indexOf("transfer") >= 0) return A.t("payPending") || "Pending";
      if (s === "cod" || s.indexOf("cod") >= 0 || s.indexOf("استلام") >= 0) return A.t("payCod") || "COD";
      if (A.payText) {
        var t = String(A.payText(o) || "");
        return t.replace(/\s*[·•]\s*الرسوم\s*انحذفت?/gi, "").replace(/\s*[·•]\s*fees\s*removed/gi, "").trim() || t;
      }
      return o.payment || "—";
    };
    var phoneLab = A.t("o_pdfPhone") || A.t("o_pdfContact") || (A.lang === "en" ? "Mobile number" : "رقم الجوال");
    var totalN = list.length;
    var pages = list.map(function (o, idx) {
      var st = A.normalizeStatus(o.status);
      var when = "";
      try { when = o.at ? A.fmtDateTimeNum(o.at) : ""; } catch (e2) { when = o.at || ""; }
      var sums = A.orderTotals ? A.orderTotals(o) : {
        grand: o.total || 0, paid: o.subtotal || 0, del: o.delivery || 0,
        cod: o.codFee || 0, discount: 0, tax: o.vat || 0, beforeTax: 0
      };
      if (o.subtotal != null && isFinite(Number(o.subtotal))) sums.paid = Number(o.subtotal);
      if (o.delivery != null && isFinite(Number(o.delivery))) sums.del = Number(o.delivery);
      if (o.codFee != null && isFinite(Number(o.codFee))) sums.cod = Number(o.codFee);
      if (o.vat != null && isFinite(Number(o.vat))) sums.tax = Number(o.vat);
      if (o.total != null && isFinite(Number(o.total))) sums.grand = Number(o.total);

      var itemsHtml = "";
      if (Array.isArray(o.items) && o.items.length) {
        itemsHtml = "<table class='items'><thead><tr>"
          + "<th class='c-n'>#</th>"
          + "<th class='c-name'>" + A.esc(A.t("o_pdfItems") || "Items") + "</th>"
          + "<th class='c-sku'>SKU</th>"
          + "<th class='c-q'>" + A.esc(A.t("o_pdfQty") || "Qty") + "</th>"
          + "<th class='c-p'>" + A.esc(A.t("o_pdfPrice") || "Price") + "</th>"
          + "<th class='c-l'>" + A.esc(A.t("o_pdfLine") || "Total") + "</th>"
          + "</tr></thead><tbody>"
          + o.items.map(function (it, i) {
              var name = (A.lang === "en" ? (it.nameEn || it.name || it.nameAr) : (it.nameAr || it.name || it.nameEn)) || "";
              var unit = it.price != null ? Number(it.price) : 0;
              var qty = it.qty != null ? Number(it.qty) : 1;
              var line = it.line != null ? Number(it.line) : (unit * qty);
              return "<tr>"
                + "<td class='c-n'>" + (i + 1) + "</td>"
                + "<td class='c-name'>" + A.esc(name) + "</td>"
                + "<td class='c-sku'>" + A.esc(it.sku || "—") + "</td>"
                + "<td class='c-q'>" + A.esc(qty) + "</td>"
                + "<td class='c-p'>" + A.esc(money(unit)) + " " + A.esc(omr) + "</td>"
                + "<td class='c-l'>" + A.esc(money(line)) + " " + A.esc(omr) + "</td>"
                + "</tr>";
            }).join("")
          + "</tbody></table>";
      } else if (o.itemsText) {
        itemsHtml = "<pre class='note'>" + A.esc(o.itemsText) + "</pre>";
      } else {
        itemsHtml = "<p class='empty-items'>" + A.esc(A.lang === "en" ? "No line items" : "ما في أصناف مسجّلة") + "</p>";
      }

      var sumRows = "";
      sumRows += "<div class='sum-row'><span>" + A.esc(A.t("o_sub") || "Subtotal") + "</span><b>" + A.esc(money(sums.paid)) + " " + A.esc(omr) + "</b></div>";
      if (sums.discount > 0.0005) sumRows += "<div class='sum-row'><span>" + A.esc(A.t("o_disc") || "Discount") + "</span><b>−" + A.esc(money(sums.discount)) + " " + A.esc(omr) + "</b></div>";
      if (sums.del > 0.0005) sumRows += "<div class='sum-row'><span>" + A.esc(A.t("o_del") || "Delivery") + "</span><b>" + A.esc(money(sums.del)) + " " + A.esc(omr) + "</b></div>";
      if (sums.cod > 0.0005) sumRows += "<div class='sum-row'><span>" + A.esc(A.t("o_cod") || "COD fee") + "</span><b>" + A.esc(money(sums.cod)) + " " + A.esc(omr) + "</b></div>";
      if (sums.tax > 0.0005) sumRows += "<div class='sum-row'><span>" + A.esc(A.t("o_pdfVat") || "VAT") + "</span><b>" + A.esc(money(sums.tax)) + " " + A.esc(omr) + "</b></div>";
      sumRows += "<div class='sum-row grand'><span>" + A.esc(A.t("o_grand") || "Total") + "</span><b>" + A.esc(money(sums.grand)) + " " + A.esc(omr) + "</b></div>";

      var pageLab = (A.t("o_pdfPageOf") || "Order {n} of {t}")
        .split("{n}").join(String(idx + 1))
        .split("{t}").join(String(totalN));

      return "<section class='page'>"
        + "<header class='doc-head'>"
        + "<div class='brand'>"
        + "<div class='brand-name'>نقاء · Naqa</div>"
        + "<div class='brand-sub'>" + A.esc(brand) + "</div>"
        + "</div>"
        + "<div class='doc-meta'>"
        + "<div>" + A.esc(printed) + ": " + A.esc(whenPrint) + "</div>"
        + "<div>" + A.esc(pageLab) + "</div>"
        + "</div>"
        + "</header>"
        + "<div class='order-title'>"
        + "<div class='oid'><span>" + A.esc(A.lang === "en" ? "Order No." : "رقم الطلب") + "</span><b>" + A.esc(o.id) + "</b></div>"
        + "<span class='st'>" + A.esc(A.statusLabel(st)) + "</span>"
        + "<span class='when'>" + A.esc(when) + "</span>"
        + "</div>"
        + "<div class='body-block'>"
        + "<div class='grid'>"
        + "<div class='cell'><div class='k'>" + A.esc(A.t("o_pdfCustomer") || "Customer") + "</div><div class='v'>" + A.esc(o.name || "—") + "</div></div>"
        + "<div class='cell'><div class='k'>" + A.esc(phoneLab) + "</div><div class='v dir-ltr'>" + A.esc(o.phone || "—") + "</div></div>"
        + "<div class='cell'><div class='k'>" + A.esc(A.t("o_pdfArea") || "Area") + "</div><div class='v'>" + A.esc(o.area || "—") + "</div></div>"
        + "<div class='cell'><div class='k'>" + A.esc(A.t("o_pdfCity") || "City") + "</div><div class='v'>" + A.esc(o.city || "—") + "</div></div>"
        + ((o.address || o.addr) ? ("<div class='cell span2'><div class='k'>" + A.esc(A.t("o_pdfAddress") || "Address") + "</div><div class='v'>" + A.esc(o.address || o.addr) + "</div></div>") : "")
        + "<div class='cell'><div class='k'>" + A.esc(A.t("payLine") || "Payment") + "</div><div class='v'>" + A.esc(payLabel(o)) + "</div></div>"
        + "<div class='cell'><div class='k'>" + A.esc(A.t("o_pdfStatus") || "Status") + "</div><div class='v'>" + A.esc(A.statusLabel(st)) + "</div></div>"
        + "</div>"
        + (o.note ? ("<div class='note-line'><span class='k'>" + A.esc(A.t("note") || "Note") + ":</span> " + A.esc(o.note) + "</div>") : "")
        + itemsHtml
        + "<div class='summary'>" + sumRows + "</div>"
        + "</div>"
        + "<footer class='foot'>" + A.esc(A.t("o_pdfThanks") || (A.lang === "en" ? "Thank you for your order · Naqa" : "نشكركِ من أعماق القلب على طلبكِ · نقاء")) + "</footer>"
        + "</section>";
    }).join("");

    var html = "<!doctype html><html lang='" + lang + "' dir='" + dir + "'><head><meta charset='utf-8'>"
      + "<title>" + A.esc(brand) + "</title>"
      + "<style>"
      + "@page{size:A4 portrait;margin:14mm 14mm 16mm 14mm}"
      + "html,body{margin:0;padding:0;width:100%;height:100%;background:#fff}"
      + "body{font-family:'Noto Naskh Arabic','Amiri','Traditional Arabic','Times New Roman','Noto Sans Arabic',Georgia,serif;"
      + "color:#1a1412;font-size:12pt;line-height:1.55;-webkit-print-color-adjust:exact;print-color-adjust:exact}"
      /* صفحة A4 كاملة: ارتفاع منطقة الطباعة ≈ 297−30 = 267مم */
      + ".page{width:100%;max-width:182mm;margin:0 auto;"
      + "min-height:267mm;height:auto;"
      + "display:flex;flex-direction:column;"
      + "box-sizing:border-box;"
      + "page-break-after:always;break-after:page;"
      + "page-break-inside:avoid;padding:0}"
      + ".page:last-child{page-break-after:auto;break-after:auto}"
      + ".doc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;"
      + "border-bottom:2.5px solid #8d3048;padding:0 0 14px;margin:0 0 18px;flex:0 0 auto}"
      + ".brand{text-align:start}"
      + ".brand-name{font-size:22pt;font-weight:800;color:#8d3048;letter-spacing:.02em;line-height:1.15}"
      + ".brand-sub{font-size:11pt;color:#5c534e;margin-top:4px}"
      + ".doc-meta{text-align:end;font-size:10.5pt;color:#5c534e;line-height:1.55}"
      + ".order-title{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;margin:0 0 16px;"
      + "padding:12px 14px;background:#fdf8f6;border:1px solid #efe4df;border-radius:10px;flex:0 0 auto}"
      + ".oid span{display:block;font-size:9.5pt;color:#8a7f78;font-weight:700}"
      + ".oid b{font-size:16pt;font-weight:800;color:#1a1412}"
      + ".st{background:#8d3048;color:#fff;border-radius:999px;padding:6px 16px;font-size:10.5pt;font-weight:800}"
      + ".when{margin-inline-start:auto;font-size:11pt;color:#5c534e;font-variant-numeric:tabular-nums}"
      + ".grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 20px;margin:0 0 16px;flex:0 0 auto}"
      + ".cell.span2{grid-column:1 / -1}"
      + ".cell .k{font-size:9.5pt;color:#8a7f78;font-weight:700;margin-bottom:3px}"
      + ".cell .v{font-size:12.5pt;font-weight:700;word-break:break-word}"
      + ".dir-ltr{direction:ltr;unicode-bidi:isolate;text-align:start}"
      + ".note-line{font-size:11.5pt;background:#faf6f4;border-radius:8px;padding:10px 14px;margin:0 0 14px;border:1px solid #efe4df;flex:0 0 auto}"
      + ".note-line .k{font-weight:800;color:#8d3048}"
      + "table.items{width:100%;border-collapse:collapse;margin:4px 0 0;font-size:11pt;flex:0 0 auto}"
      + "table.items th{background:#8d3048;color:#fff;font-weight:800;padding:10px 8px;text-align:start}"
      + "table.items td{padding:10px 8px;border-bottom:1px solid #e8ddd8;vertical-align:top}"
      + "table.items tbody tr:nth-child(even) td{background:#fdf8f6}"
      + ".c-n{width:28px;text-align:center!important;color:#8a7f78}"
      + ".c-sku{width:100px;font-size:9.5pt;color:#6b625c;word-break:break-all}"
      + ".c-q,.c-p,.c-l{width:82px;text-align:end!important;font-variant-numeric:tabular-nums;white-space:nowrap}"
      + ".body-block{flex:1 1 auto;display:flex;flex-direction:column;min-height:0}"
      + ".summary{margin:18px 0 0;padding:14px 16px;background:#fdf8f6;border:1.5px solid #e2d4cf;border-radius:10px;"
      + "max-width:340px;width:100%;margin-inline-start:auto;flex:0 0 auto}"
      + ".sum-row{display:flex;justify-content:space-between;gap:18px;font-size:11.5pt;padding:5px 0}"
      + ".sum-row.grand{margin-top:6px;padding-top:10px;border-top:2px solid #8d3048;font-size:14pt;font-weight:800;color:#8d3048}"
      /* التذييل يثبت أسفل الصفحة ليملأ A4 */
      + ".foot{margin-top:auto;padding:18px 12px 4px;border-top:1px solid #e2d4cf;text-align:center;"
      + "font-size:11.5pt;line-height:1.75;color:#5c3a40;font-weight:600}"
      + "pre.note{white-space:pre-wrap;font-size:11pt;background:#faf6f4;padding:12px;border-radius:8px}"
      + ".empty-items{color:#8a7f78;font-size:11pt;text-align:center;padding:12px}"
      + "@media print{"
      + "  html,body{width:auto;height:auto;background:#fff}"
      + "  .page{max-width:none;width:100%;min-height:267mm;height:267mm;"
      + "    page-break-after:always;break-after:page}"
      + "  .page:last-child{page-break-after:auto}"
      + "}"
      + "@media screen{"
      + "  body{padding:12px;background:#e8e0dc}"
      + "  .page{background:#fff;padding:18px 20px;border-radius:12px;"
      + "    box-shadow:0 2px 14px rgba(0,0,0,.08);margin:0 auto 16px;"
      + "    min-height:min(267mm, calc(100vh - 24px));width:min(182mm,100%)}"
      + "}"
      + "</style></head><body>"
      + pages
      + "<script>window.onload=function(){setTimeout(function(){window.print();},300);}<\\/script>"
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
    var n = A.countSelectedOrders ? A.countSelectedOrders() : 0;
    var exp = document.getElementById("exportOrdersCsv");
    if (exp) {
      exp.textContent = n
        ? ((A.t("exportSelected") || "تصدير المحدد") + " (" + n + ")")
        : (A.t("exportExcel") || "Excel");
    }
    var pdf = document.getElementById("printOrdersPdf");
    if (pdf) {
      pdf.disabled = n < 1;
      pdf.title = n < 1
        ? (A.t("o_printNeedSel") || "Select orders first")
        : (A.t("printPdfTitle") || "Print PDF");
      var lab = A.t("printPdf") || "PDF";
      pdf.textContent = n ? (lab + " (" + n + ")") : lab;
    }
    var all = document.getElementById("ordSelectAll");
    if (all) {
      var boxes = document.querySelectorAll("#ordersList .order-pick");
      all.checked = !!(boxes.length && Array.prototype.every.call(boxes, function (b) { return b.checked; }));
      all.indeterminate = !!(boxes.length && n > 0 && !all.checked && Array.prototype.some.call(boxes, function (b) { return b.checked; }));
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
          /* مسح التحديد السابق ثم تحديد الظاهر فقط — عشان ما يبقى «جديد» فقط */
          A.selectedOrderIds = {};
          document.querySelectorAll("#ordersList .order-pick").forEach(function (cb) {
            var id = cb.getAttribute("data-oid");
            cb.checked = on;
            if (id) A.selectedOrderIds[id] = !!on;
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
    if (tools.querySelector("#ordersToolsPanel")) {
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
      + '</div>';
    A.syncExportLabel();
  };


  /* زر الطباعة ثابت بجانب البحث */
  if (!A._pdfBtnBound) {
    A._pdfBtnBound = true;
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t) return;
      var btn = (t.id === "printOrdersPdf") ? t : (t.closest && t.closest("#printOrdersPdf"));
      if (!btn) return;
      e.preventDefault();
      if (btn.disabled) {
        A.setMsg("orderStatus", A.t("o_printNeedSel") || "");
        return;
      }
      A.printOrdersPdf();
    });
    /* تغيير خانات الطلبات */
    document.addEventListener("change", function (e) {
      var t = e.target;
      if (!t || !t.classList || !t.classList.contains("order-pick")) return;
      var id = t.getAttribute("data-oid");
      if (!id) return;
      A.selectedOrderIds = A.selectedOrderIds || {};
      A.selectedOrderIds[id] = !!t.checked;
      A.syncExportLabel();
    });
  }

  A.paintOrders = function (opts) {
    opts = opts || {};
    try { A.syncOrdersTab(); } catch (e) {}
    A.orders.forEach(function (o) { o.status = A.normalizeStatus(o.status); });
    try { if (A.updateOrdersBadge) A.updateOrdersBadge(); } catch (e2) {}
    A.paintStatusBar();
    if (!opts.skipTools) A.ensureOrdersTools();
    else A.syncExportLabel();
    /* حافظ على التحديد فقط للطلبات الظاهرة حالياً */
    (function () {
      var keep = {};
      var filtered = A.getFilteredOrders ? A.getFilteredOrders() : (A.orders || []);
      var ids = {};
      filtered.forEach(function (o) { if (o && o.id) ids[o.id] = true; });
      Object.keys(A.selectedOrderIds || {}).forEach(function (k) {
        if (A.selectedOrderIds[k] && ids[k]) keep[k] = true;
      });
      A.selectedOrderIds = keep;
    })();
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
      try { A.syncExportLabel(); } catch (e0) {}
      return;
    }
    if (!list.length) {
      var emptyF = A.t("o_emptyFilter") || "";
      box.innerHTML = emptyF ? ('<p class="note">' + emptyF + '</p>') : "";
      try { A.syncExportLabel(); } catch (e0b) {}
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
    box.innerHTML = list.map(cardHtml).join("");
    try { A.syncExportLabel(); } catch (e3) {}
  };
})(window);
