(function (w) {
  var A = w.NaqaAdmin;
  A.finDateFrom = A.finDateFrom || "";
  A.finDateTo = A.finDateTo || "";
  A.financeOpen = A.financeOpen || null; /* { type: "area"|"product", key: string } */

  function ar() { return A.lang !== "en"; }
  function omr() { return A.t("omr") || (ar() ? "ر.ع" : "OMR"); }
  function whenOf(o) {
    if (!o || !o.at) return "—";
    if (A.fmtDateTimeNum) return A.fmtDateTimeNum(o.at);
    if (A.fmtDateNum) return A.fmtDateNum(o.at);
    return String(o.at);
  }
  function statusText(st) {
    st = A.normalizeStatus ? A.normalizeStatus(st) : st;
    if (A.statusLabel) return A.statusLabel(st) || st || "—";
    return st || "—";
  }
  function inFinRange(at) {
    var day = A.dayKey ? A.dayKey(at) : String(at || "").slice(0, 10);
    if (A.finDateFrom && (!day || day < A.finDateFrom)) return false;
    if (A.finDateTo && (!day || day > A.finDateTo)) return false;
    return true;
  }
  function activeOrders() {
    var src = A.liveOrders ? A.liveOrders() : (A.orders || []);
    return src.filter(function (o) {
      if (!o) return false;
      if (!inFinRange(o.at)) return false;
      var st = A.normalizeStatus ? A.normalizeStatus(o.status) : String(o.status || "");
      return st !== "cancel";
    });
  }
  function productKey(it) {
    return String((it && (it.sku || it.id || it.name || it.nameAr)) || "?");
  }
  function productByKey(key) {
    var list = A.products || w.products || [];
    var k = String(key || "").toLowerCase();
    return list.find(function (p) {
      if (!p) return false;
      if (String(p.sku || "").toLowerCase() === k) return true;
      if (String(p.id) === String(key)) return true;
      return false;
    }) || null;
  }
  function productTitle(p, fallback) {
    if (!p) return fallback || "—";
    if (ar()) return p.nameAr || p.nameEn || p.brand || p.sku || fallback || "—";
    return p.nameEn || p.nameAr || p.brand || p.sku || fallback || "—";
  }
  function lineRev(it) {
    if (!it) return 0;
    if (it.line != null && isFinite(Number(it.line))) return Number(it.line);
    var q = Number(it.qty) || 0;
    var pr = Number(it.price) || 0;
    return q * pr;
  }

  function paintDateFaces() {
    var fmt = function (iso, empty) {
      if (!iso) return empty;
      var parts = String(iso).split("-");
      if (parts.length === 3) return parts[2] + "/" + parts[1] + "/" + parts[0];
      return iso;
    };
    var fromEl = document.getElementById("finDateFrom");
    var toEl = document.getElementById("finDateTo");
    var fromShow = document.getElementById("finDateFromShow");
    var toShow = document.getElementById("finDateToShow");
    if (fromShow) fromShow.textContent = fmt(fromEl && fromEl.value, A.t("f_from") || (ar() ? "من" : "From"));
    if (toShow) toShow.textContent = fmt(toEl && toEl.value, A.t("f_to") || (ar() ? "إلى" : "To"));
  }

  function toolsHtml() {
    var from = A.finDateFrom || "";
    var to = A.finDateTo || "";
    return '<div class="orders-filter-inline finance-tools" id="financeToolsPanel">'
      + '<label class="date-one-wrap" title="' + A.esc(A.t("f_from") || (ar() ? "من" : "From")) + '">'
      + '<span class="date-one-show" id="finDateFromShow">' + A.esc(A.t("f_from") || (ar() ? "من" : "From")) + '</span>'
      + '<input type="date" lang="en" dir="ltr" class="date-one" id="finDateFrom" value="' + A.esc(from) + '" aria-label="' + A.esc(A.t("f_from") || "من") + '">'
      + '</label>'
      + '<label class="date-one-wrap" title="' + A.esc(A.t("f_to") || (ar() ? "إلى" : "To")) + '">'
      + '<span class="date-one-show" id="finDateToShow">' + A.esc(A.t("f_to") || (ar() ? "إلى" : "To")) + '</span>'
      + '<input type="date" lang="en" dir="ltr" class="date-one" id="finDateTo" value="' + A.esc(to) + '" aria-label="' + A.esc(A.t("f_to") || "إلى") + '">'
      + '</label>'
      + '<button type="button" class="export-one" id="exportFinanceCsv">' + A.esc(A.t("exportCsv") || A.t("exportExcel") || (ar() ? "تصدير Excel" : "Export Excel")) + '</button>'
      + '</div>';
  }

  function bindTools() {
    paintDateFaces();
    function syncDates() {
      var f = document.getElementById("finDateFrom");
      var t = document.getElementById("finDateTo");
      A.finDateFrom = (f && f.value) || "";
      A.finDateTo = (t && t.value) || "";
      paintDateFaces();
      A.paintFinance();
    }
    var f = document.getElementById("finDateFrom");
    var t = document.getElementById("finDateTo");
    if (f) f.onchange = syncDates;
    if (t) t.onchange = syncDates;
    var ex = document.getElementById("exportFinanceCsv");
    if (ex) ex.onclick = function () { A.exportFinanceCsv(); };
  }

  /** دفتر مبيعات محاسبي: صف لكل بند منتج + أعمدة المبالغ */
  A.exportFinanceCsv = function () {
    var head = ar()
      ? [
          "التاريخ", "رقم الطلب", "الحالة", "طريقة الدفع",
          "اسم الزبون", "الجوال", "المنطقة",
          "المنتج", "SKU", "الكمية", "سعر الوحدة", "إجمالي البند",
          "المجموع الفرعي", "التوصيل", "رسوم COD", "الضريبة", "الخصم", "إجمالي الطلب"
        ]
      : [
          "date", "order_id", "status", "payment",
          "customer", "phone", "area",
          "product", "sku", "qty", "unit_price", "line_total",
          "subtotal", "delivery", "cod_fee", "tax", "discount", "order_total"
        ];
    var rows = [head];
    var sumLines = 0, sumOrders = 0, orderSeen = {};
    activeOrders().forEach(function (o) {
      var sub = Number(o.subtotal);
      if (!isFinite(sub)) sub = 0;
      var del = Number(o.delivery) || 0;
      var cod = Number(o.codFee) || 0;
      var tax = Number(o.vat != null ? o.vat : o.tax) || 0;
      var disc = Number(o.discount) || 0;
      var grand = Number(o.total) || 0;
      if (!sub && grand) {
        /* تقدير: المجموع الفرعي ≈ الإجمالي - توصيل - COD - ضريبة + خصم */
        sub = grand - del - cod - tax + disc;
      }
      var pay = "";
      if (A.payText) {
        try { pay = String(A.payText(o) || ""); } catch (e) { pay = o.payment || ""; }
      } else {
        pay = o.payment || o.pay || "";
      }
      var items = Array.isArray(o.items) && o.items.length ? o.items : [{ name: "—", qty: 1, price: grand, line: grand, sku: "" }];
      items.forEach(function (it, idx) {
        var q = Number(it.qty) || 0;
        var line = lineRev(it);
        var unit = q ? (line / q) : (Number(it.price) || 0);
        sumLines += line;
        rows.push([
          whenOf(o),
          o.id || "",
          statusText(o.status),
          pay,
          o.name || "",
          o.phone || "",
          o.area || o.city || "",
          it.name || it.nameAr || it.nameEn || "",
          it.sku || "",
          q,
          unit.toFixed(3),
          line.toFixed(3),
          /* مبالغ الطلب تظهر في أول صف فقط لتجنب تضخيم المجاميع في إكسل */
          idx === 0 ? sub.toFixed(3) : "",
          idx === 0 ? del.toFixed(3) : "",
          idx === 0 ? cod.toFixed(3) : "",
          idx === 0 ? tax.toFixed(3) : "",
          idx === 0 ? disc.toFixed(3) : "",
          idx === 0 ? grand.toFixed(3) : ""
        ]);
      });
      if (!orderSeen[o.id]) {
        orderSeen[o.id] = 1;
        sumOrders += grand;
      }
    });
    rows.push([]);
    rows.push(ar()
      ? ["ملخص", "", "", "", "", "", "", "", "", "", "مجموع البنود", sumLines.toFixed(3), "", "", "", "", "", "مجموع الطلبات", sumOrders.toFixed(3)]
      : ["summary", "", "", "", "", "", "", "", "", "", "lines_sum", sumLines.toFixed(3), "", "", "", "", "", "orders_sum", sumOrders.toFixed(3)]
    );
    var fname = "naqa-sales-" + (A.finDateFrom || "all") + (A.finDateTo ? ("_" + A.finDateTo) : "") + ".csv";
    A.downloadCsv(fname, rows);
    A.setMsg("financeStatus", A.t("exportOk") || (ar() ? "تم تصدير دفتر المبيعات ✓" : "Sales journal exported ✓"));
  };

  function paintAreaDetail(areaName) {
    var box = document.getElementById("financeBox");
    if (!box) return;
    var list = activeOrders().filter(function (o) {
      return String(o.area || o.city || "—") === String(areaName);
    });
    var total = 0;
    list.forEach(function (o) { total += Number(o.total) || 0; });
    var back = ar() ? "رجوع" : "Back";
    var labOrder = ar() ? "الطلب" : "Order";
    var labDate = ar() ? "التاريخ" : "Date";
    var labName = ar() ? "الاسم" : "Name";
    var labPhone = ar() ? "الجوال" : "Mobile";
    var labSt = ar() ? "الحالة" : "Status";
    var labTot = ar() ? "الإجمالي" : "Total";
    var cards = list.map(function (o) {
      var oid = o.id || "—";
      return '<button type="button" class="row rv-hit fin-order-hit" data-fin-order="' + A.esc(String(oid)) + '">'
        + '<div><strong>' + A.esc(labOrder + " " + oid) + '</strong>'
        + '<small>' + A.esc(labName + ": " + (o.name || "—")) + '</small>'
        + '<small class="cust-phone">' + A.esc(labPhone + ": " + (o.phone || "—")) + '</small>'
        + '<small>' + A.esc(labDate + ": " + whenOf(o)) + " · " + statusText(o.status) + '</small></div>'
        + '<strong>' + (Number(o.total) || 0).toFixed(3) + " " + omr() + '</strong></button>';
    }).join("");
    if (!cards) cards = '<p class="note">' + (ar() ? "ما في طلبات لهذه المنطقة في المدى." : "No orders for this area in range.") + '</p>';
    box.innerHTML = toolsHtml()
      + '<div class="panel">'
      + '<button type="button" class="mini" id="finBack">' + A.esc(back) + '</button>'
      + '<h2>' + A.esc(areaName || "—") + '</h2>'
      + '<p class="rv-meta"><span>' + (ar() ? "عدد الطلبات" : "Orders") + '</span> ' + list.length
      + ' · <span>' + labTot + '</span> <strong>' + total.toFixed(3) + " " + omr() + '</strong></p>'
      + cards
      + '</div>'
      + '<p class="status" id="financeStatus"></p>';
    bindTools();
    var backBtn = document.getElementById("finBack");
    if (backBtn) {
      backBtn.onclick = function () {
        A.financeOpen = null;
        A.paintFinance();
      };
    }
    box.querySelectorAll("[data-fin-order]").forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute("data-fin-order") || "";
        A.orderQuery = id;
        if (A.go) A.go("orders", "all", { push: true });
      };
    });
  }

  function paintProductDetail(key) {
    var box = document.getElementById("financeBox");
    if (!box) return;
    var p = productByKey(key);
    var title = productTitle(p, key);
    var qty = 0, rev = 0;
    var orderHits = [];
    activeOrders().forEach(function (o) {
      var hit = false, q = 0, r = 0;
      (o.items || []).forEach(function (it) {
        if (productKey(it) !== String(key) && String(it.sku || "") !== String(key) && String(it.id) !== String(key)) return;
        /* loose match on sku or stored key */
        var same = productKey(it) === String(key)
          || (it.sku && String(it.sku) === String(key))
          || (it.id != null && String(it.id) === String(key));
        if (!same && p && (String(it.sku) === String(p.sku) || String(it.id) === String(p.id))) same = true;
        if (!same) return;
        hit = true;
        q += Number(it.qty) || 0;
        r += lineRev(it);
      });
      if (hit) {
        qty += q;
        rev += r;
        orderHits.push({ o: o, qty: q, rev: r });
      }
    });
    var back = ar() ? "رجوع" : "Back";
    var labOrder = ar() ? "الطلب" : "Order";
    var labDate = ar() ? "التاريخ" : "Date";
    var labQty = ar() ? "الكمية" : "Qty";
    var labRev = ar() ? "الإيراد" : "Revenue";
    var cards = orderHits.map(function (h) {
      var o = h.o;
      var oid = o.id || "—";
      return '<button type="button" class="row rv-hit fin-order-hit" data-fin-order="' + A.esc(String(oid)) + '">'
        + '<div><strong>' + A.esc(labOrder + " " + oid) + '</strong>'
        + '<small>' + A.esc(labDate + ": " + whenOf(o)) + " · " + statusText(o.status) + '</small>'
        + '<small>' + A.esc(labQty + ": " + h.qty) + '</small></div>'
        + '<strong>' + h.rev.toFixed(3) + " " + omr() + '</strong></button>';
    }).join("");
    if (!cards) cards = '<p class="note">' + (ar() ? "ما في طلبات لهذا المنتج في المدى." : "No orders for this product in range.") + '</p>';
    var editBtn = p
      ? ('<button type="button" class="export-one" id="finOpenProduct">' + A.esc(A.t("p_editProduct") || (ar() ? "تعديل المنتج" : "Edit product")) + '</button>')
      : "";
    box.innerHTML = toolsHtml()
      + '<div class="panel">'
      + '<button type="button" class="mini" id="finBack">' + A.esc(back) + '</button>'
      + '<h2>' + A.esc(title) + '</h2>'
      + (p && p.sku ? ('<p class="rv-meta"><span>SKU</span> ' + A.esc(p.sku) + '</p>') : "")
      + '<p class="rv-meta"><span>' + labQty + '</span> ' + qty
      + ' · <span>' + labRev + '</span> <strong>' + rev.toFixed(3) + " " + omr() + '</strong></p>'
      + (editBtn ? ('<div style="margin:10px 0">' + editBtn + '</div>') : "")
      + '<h3 class="cust-orders-h">' + (ar() ? "الطلبات التي تتضمن المنتج" : "Orders with this product") + '</h3>'
      + cards
      + '</div>'
      + '<p class="status" id="financeStatus"></p>';
    bindTools();
    var backBtn = document.getElementById("finBack");
    if (backBtn) {
      backBtn.onclick = function () {
        A.financeOpen = null;
        A.paintFinance();
      };
    }
    var ep = document.getElementById("finOpenProduct");
    if (ep && p) {
      ep.onclick = function () {
        if (A.go) A.go("products", "all", { push: true });
        setTimeout(function () {
          if (A.openEdit) A.openEdit(p.id);
        }, 40);
      };
    }
    box.querySelectorAll("[data-fin-order]").forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute("data-fin-order") || "";
        A.orderQuery = id;
        if (A.go) A.go("orders", "all", { push: true });
      };
    });
  }

  A.paintFinance = function () {
    var box = document.getElementById("financeBox");
    if (!box) return;

    if (A.financeOpen && A.financeOpen.type === "area") {
      paintAreaDetail(A.financeOpen.key);
      return;
    }
    if (A.financeOpen && A.financeOpen.type === "product") {
      paintProductDetail(A.financeOpen.key);
      return;
    }

    var sales = 0, count = 0, cancel = 0, todaySales = 0, todayCount = 0;
    var delivered = 0, ship = 0, prep = 0, neu = 0;
    var byArea = {}, byProduct = {};
    var today = (function () {
      try {
        return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Muscat", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      } catch (e) {
        return new Date().toISOString().slice(0, 10);
      }
    })();

    (A.orders || []).forEach(function (o) {
      if (!inFinRange(o.at)) return;
      var st = A.normalizeStatus(o.status);
      var day = A.dayKey(o.at);
      if (st === "cancel") { cancel++; return; }
      count++;
      var tot = Number(o.total) || 0;
      sales += tot;
      if (day === today) { todaySales += tot; todayCount++; }
      if (st === "delivered") delivered++;
      else if (st === "ship") ship++;
      else if (st === "prep") prep++;
      else neu++;
      var area = o.area || o.city || "—";
      if (!byArea[area]) byArea[area] = { n: 0, rev: 0 };
      byArea[area].n++;
      byArea[area].rev += tot;
      (o.items || []).forEach(function (it) {
        var k = productKey(it);
        if (!byProduct[k]) byProduct[k] = { key: k, name: it.name || it.nameAr || k, sku: it.sku || "", id: it.id, qty: 0, rev: 0 };
        byProduct[k].qty += Number(it.qty) || 0;
        byProduct[k].rev += lineRev(it);
        if (!byProduct[k].name && it.name) byProduct[k].name = it.name;
      });
    });

    var byDay = {};
    activeOrders().forEach(function (o) {
      var d = A.dayKey(o.at);
      if (!d) return;
      byDay[d] = (byDay[d] || 0) + (Number(o.total) || 0);
    });
    var dayKeys = Object.keys(byDay).sort().slice(-7);
    var chartHtml = "";
    if (dayKeys.length) {
      var maxV = 1;
      dayKeys.forEach(function (k) { if (byDay[k] > maxV) maxV = byDay[k]; });
      var W = 320, H = 128, gap = 10;
      var bw = Math.max(8, Math.floor((W - gap * (dayKeys.length + 1)) / dayKeys.length));
      var bars = dayKeys.map(function (k, i) {
        var bh = Math.max(4, Math.round((byDay[k] / maxV) * (H - 28)));
        var x = gap + i * (bw + gap);
        var y = H - 22 - bh;
        return '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="4" fill="#8d3048"></rect>'
          + '<text x="' + (x + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="10" fill="#6b625c">' + A.esc(String(k).slice(5)) + '</text>';
      }).join("");
      chartHtml = '<div class="panel"><h2>' + A.t("f_chart") + '</h2><svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="140" role="img" aria-label="' + A.esc(A.t("f_chart")) + '">' + bars + '</svg></div>';
    }

    var areas = Object.keys(byArea).map(function (k) {
      return { name: k, n: byArea[k].n, rev: byArea[k].rev };
    }).sort(function (a, b) { return b.rev - a.rev; }).slice(0, 12);

    var products = Object.keys(byProduct).map(function (k) { return byProduct[k]; })
      .sort(function (a, b) { return b.rev - a.rev; }).slice(0, 12);

    var areaHtml = areas.length
      ? areas.map(function (a) {
          return '<button type="button" class="row rv-hit fin-area-hit" data-fin-area="' + A.esc(a.name) + '">'
            + '<div><strong>' + A.esc(a.name) + '</strong>'
            + '<small>' + a.n + " " + (A.t("f_orderN") || (ar() ? "طلب" : "orders")) + '</small></div>'
            + '<strong>' + a.rev.toFixed(3) + " " + omr() + '</strong></button>';
        }).join("")
      : '<p class="note">' + (A.t("f_noAreas") || (ar() ? "ما في بيانات مناطق بعد." : "No area data yet.")) + '</p>';

    var prodHtml = products.length
      ? products.map(function (p) {
          var label = p.name || p.key;
          var prod = productByKey(p.sku || p.key);
          if (prod) label = productTitle(prod, label);
          return '<button type="button" class="row rv-hit fin-prod-hit" data-fin-prod="' + A.esc(p.key) + '">'
            + '<div><strong>' + A.esc(label) + '</strong>'
            + '<small>×' + p.qty + (p.sku ? (" · " + A.esc(p.sku)) : "") + '</small></div>'
            + '<strong>' + p.rev.toFixed(3) + " " + omr() + '</strong></button>';
        }).join("")
      : '<p class="note">' + (A.t("f_noProds") || (ar() ? "ما في تفصيل منتجات بعد." : "No product data yet.")) + '</p>';

    box.innerHTML =
      toolsHtml()
      + '<div class="stat-grid">'
      + '<div class="stat"><strong>' + todaySales.toFixed(3) + '</strong><span>' + A.t("f_todaySales") + '</span></div>'
      + '<div class="stat"><strong>' + todayCount + '</strong><span>' + A.t("f_todayOrders") + '</span></div>'
      + '<div class="stat"><strong>' + sales.toFixed(3) + '</strong><span>' + A.t("f_totalSales") + '</span></div>'
      + '<div class="stat"><strong>' + count + '</strong><span>' + A.t("f_active") + '</span></div>'
      + '<div class="stat"><strong>' + (count ? (sales / count).toFixed(3) : "0.000") + '</strong><span>' + A.t("f_avg") + '</span></div>'
      + '<div class="stat"><strong>' + delivered + '</strong><span>' + A.t("f_delivered") + '</span></div>'
      + '<div class="stat"><strong>' + ship + '</strong><span>' + A.t("f_ship") + '</span></div>'
      + '<div class="stat"><strong>' + prep + '</strong><span>' + A.t("f_prep") + '</span></div>'
      + '<div class="stat"><strong>' + neu + '</strong><span>' + A.t("f_new") + '</span></div>'
      + '<div class="stat"><strong>' + cancel + '</strong><span>' + A.t("f_cancel") + '</span></div>'
      + '</div>'
      + chartHtml
      + '<div class="panel"><h2>' + A.t("f_areas") + '</h2>' + areaHtml + '</div>'
      + '<div class="panel"><h2>' + A.t("f_prods") + '</h2>' + prodHtml + '</div>'
      + '<p class="status" id="financeStatus"></p>';

    bindTools();
    box.querySelectorAll("[data-fin-area]").forEach(function (b) {
      b.onclick = function () {
        A.financeOpen = { type: "area", key: b.getAttribute("data-fin-area") || "" };
        A.paintFinance();
      };
    });
    box.querySelectorAll("[data-fin-prod]").forEach(function (b) {
      b.onclick = function () {
        A.financeOpen = { type: "product", key: b.getAttribute("data-fin-prod") || "" };
        A.paintFinance();
      };
    });
  };
})(window);
