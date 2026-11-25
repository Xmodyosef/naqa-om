(function (w) {
  var A = w.NaqaAdmin;

  function whenOf(o) {
    if (!o || !o.at) return "—";
    try {
      if (A.fmtDateTimeNum) return A.fmtDateTimeNum(o.at);
      if (A.fmtDateNum) return A.fmtDateNum(o.at);
    } catch (e) {}
    return String(o.at);
  }
  function statusText(st) {
    st = A.normalizeStatus ? A.normalizeStatus(st) : st;
    if (A.statusLabel) return A.statusLabel(st) || st || "—";
    var ar = A.lang !== "en";
    var map = {
      new: ar ? "جديد" : "New",
      prep: ar ? "تجهيز" : "Preparing",
      ship: ar ? "توصيل" : "Shipping",
      delivered: ar ? "تم" : "Delivered",
      cancel: ar ? "ملغي" : "Cancelled"
    };
    return map[st] || st || "—";
  }
  function productOfItem(it) {
    var list = A.products || w.products || [];
    if (!it) return null;
    return list.find(function (p) {
      if (!p) return false;
      if (it.id != null && Number(p.id) === Number(it.id)) return true;
      if (it.pid != null && Number(p.id) === Number(it.pid)) return true;
      return it.sku && String(p.sku) === String(it.sku);
    }) || null;
  }
  function productTitle(p, fallback) {
    if (!p) return fallback || "—";
    var en = A.lang === "en";
    return String((en ? (p.nameEn || p.nameAr) : (p.nameAr || p.nameEn)) || p.brand || p.sku || fallback || "—");
  }
  function lineRev(it) {
    if (!it) return 0;
    if (it.line != null && isFinite(Number(it.line))) return Number(it.line);
    var q = Number(it.qty) || 0;
    var pr = Number(it.price) || 0;
    return q * pr;
  }
  function activeOrdersInRange() {
    var out = [];
    (A.orders || []).forEach(function (o) {
      if (!o) return;
      if (!A.inDateRange(o.at)) return;
      if (A.normalizeStatus(o.status) === "cancel") return;
      out.push(o);
    });
    out.sort(function (a, b) { return String(b.at || "").localeCompare(String(a.at || "")); });
    return out;
  }

  /** من / إلى — نفس شكل الطلبات في الشريط العلوي */
  A.ensureFinanceTools = function () {
    var tools = document.getElementById("ordersTools");
    if (!tools) return;
    var from = A.dateFrom || "";
    var to = A.dateTo || "";
    var ar = A.lang !== "en";
    tools.hidden = false;
    tools.innerHTML =
      '<div class="orders-filter-inline" id="financeToolsPanel">'
      + '<label class="date-one-wrap" title="' + A.esc(A.t("f_from") || (ar ? "من" : "From")) + '">'
      + '<span class="date-one-show" id="finDateFromShow">' + A.esc(A.t("f_from") || (ar ? "من" : "From")) + '</span>'
      + '<input type="date" lang="en" dir="ltr" class="date-one" id="finDateFrom" value="' + A.esc(from) + '" aria-label="' + A.esc(A.t("f_from") || (ar ? "من" : "From")) + '">'
      + '</label>'
      + '<label class="date-one-wrap" title="' + A.esc(A.t("f_to") || (ar ? "إلى" : "To")) + '">'
      + '<span class="date-one-show" id="finDateToShow">' + A.esc(A.t("f_to") || (ar ? "إلى" : "To")) + '</span>'
      + '<input type="date" lang="en" dir="ltr" class="date-one" id="finDateTo" value="' + A.esc(to) + '" aria-label="' + A.esc(A.t("f_to") || (ar ? "إلى" : "To")) + '">'
      + '</label>'
      + '</div>';
    A.paintFinanceDateFaces();
    if (!tools._finBound) {
      tools._finBound = true;
      tools.addEventListener("change", function (e) {
        var t = e.target;
        if (!t) return;
        if (t.id !== "finDateFrom" && t.id !== "finDateTo") return;
        A.dateFrom = (document.getElementById("finDateFrom") || {}).value || "";
        A.dateTo = (document.getElementById("finDateTo") || {}).value || "";
        A.paintFinanceDateFaces();
        if (A.currentTab === "finance" && A.paintFinance) A.paintFinance();
      });
    }
  };

  A.paintFinanceDateFaces = function () {
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
    if (fromShow) fromShow.textContent = fmt(fromEl && fromEl.value, A.t("f_from") || "من");
    if (toShow) toShow.textContent = fmt(toEl && toEl.value, A.t("f_to") || "إلى");
  };

  A.exportFinanceCsv = function () {
    var ar = A.lang !== "en";
    var head = ar
      ? ["رقم الطلب", "التاريخ", "الحالة", "الاسم", "الجوال", "المنطقة", "الإجمالي"]
      : ["order", "date", "status", "name", "phone", "area", "total"];
    var rows = [head];
    activeOrdersInRange().forEach(function (o) {
      rows.push([
        o.id || "",
        whenOf(o),
        statusText(o.status),
        o.name || "",
        o.phone || "",
        o.area || o.city || "",
        o.total != null ? Number(o.total).toFixed(3) : ""
      ]);
    });
    A.downloadCsv("naqa-finance.csv", rows);
    if (A.setMsg) A.setMsg("financeStatus", A.t("exportOk") || (ar ? "تم التصدير" : "Exported"));
  };

  A.paintFinance = function () {
    var box = document.getElementById("financeBox");
    if (!box) return;
    var ar = A.lang !== "en";
    try { A.ensureFinanceTools(); } catch (e0) {}

    var openArea = A.financeOpenArea || "";
    var openProd = A.financeOpenProd || "";

    /* —— تفاصيل منطقة —— */
    if (openArea) {
      var areaOrders = activeOrdersInRange().filter(function (o) {
        return String(o.area || o.city || "—") === String(openArea);
      });
      var areaTot = 0;
      areaOrders.forEach(function (o) { areaTot += Number(o.total) || 0; });
      var cards = areaOrders.map(function (o) {
        return '<article class="rv-card cust-order-card">'
          + '<p class="rv-meta"><span>' + (ar ? "الطلب" : "Order") + '</span> '
          + '<button type="button" class="rv-link" data-fin-order="' + A.esc(String(o.id || "")) + '">' + A.esc(String(o.id || "—")) + '</button></p>'
          + '<p class="rv-meta"><span>' + (ar ? "التاريخ" : "Date") + '</span> ' + A.esc(whenOf(o)) + '</p>'
          + '<p class="rv-meta"><span>' + (ar ? "الاسم" : "Name") + '</span> ' + A.esc(o.name || "—") + '</p>'
          + '<p class="rv-meta"><span>' + (ar ? "الجوال" : "Mobile") + '</span> ' + A.esc(o.phone || "—") + '</p>'
          + '<p class="rv-meta"><span>' + (ar ? "الحالة" : "Status") + '</span> ' + A.esc(statusText(o.status)) + '</p>'
          + '<p class="rv-meta"><span>' + (ar ? "المبلغ" : "Amount") + '</span> <strong>' + (Number(o.total) || 0).toFixed(3) + ' ' + (A.t("omr") || "OMR") + '</strong></p>'
          + '</article>';
      }).join("") || ('<p class="note">' + (ar ? "ما في طلبات لهذه المنطقة في الفترة." : "No orders for this area in range.") + '</p>');

      box.innerHTML = '<div class="panel">'
        + '<button type="button" class="mini" id="finBack">' + (ar ? "رجوع" : "Back") + '</button>'
        + '<h2>' + A.esc(openArea) + '</h2>'
        + '<p class="note">' + areaOrders.length + ' ' + (A.t("f_orderN") || (ar ? "طلب" : "orders"))
        + ' · ' + (ar ? "الإجمالي" : "Total") + ' <strong>' + areaTot.toFixed(3) + ' ' + (A.t("omr") || "OMR") + '</strong></p>'
        + cards
        + '</div>';
      var back = document.getElementById("finBack");
      if (back) back.onclick = function () { A.financeOpenArea = ""; A.paintFinance(); };
      box.querySelectorAll("[data-fin-order]").forEach(function (b) {
        b.onclick = function () {
          A.orderQuery = b.getAttribute("data-fin-order") || "";
          if (A.go) A.go("orders", "all", { push: true });
        };
      });
      return;
    }

    /* —— تفاصيل منتج —— */
    if (openProd) {
      var pid = openProd;
      var matched = [];
      var qtyAll = 0, revAll = 0;
      var pMeta = null;
      activeOrdersInRange().forEach(function (o) {
        (o.items || []).forEach(function (it) {
          var p = productOfItem(it);
          var key = p ? String(p.id) : String(it.sku || it.name || "");
          if (key !== String(pid) && String(it.sku || "") !== String(pid)) return;
          if (p && !pMeta) pMeta = p;
          var lr = lineRev(it);
          qtyAll += Number(it.qty) || 0;
          revAll += lr;
          matched.push({ order: o, item: it, rev: lr });
        });
      });
      var title = productTitle(pMeta, matched[0] && (matched[0].item.name || matched[0].item.sku) || pid);
      var sku = (pMeta && pMeta.sku) || (matched[0] && matched[0].item.sku) || "";
      var cardsP = matched.map(function (m) {
        var o = m.order;
        var it = m.item;
        return '<article class="rv-card cust-order-card">'
          + '<p class="rv-meta"><span>' + (ar ? "الطلب" : "Order") + '</span> '
          + '<button type="button" class="rv-link" data-fin-order="' + A.esc(String(o.id || "")) + '">' + A.esc(String(o.id || "—")) + '</button></p>'
          + '<p class="rv-meta"><span>' + (ar ? "التاريخ" : "Date") + '</span> ' + A.esc(whenOf(o)) + '</p>'
          + '<p class="rv-meta"><span>' + (ar ? "الكمية" : "Qty") + '</span> ×' + (Number(it.qty) || 0) + '</p>'
          + '<p class="rv-meta"><span>' + (ar ? "المبلغ" : "Amount") + '</span> <strong>' + m.rev.toFixed(3) + ' ' + (A.t("omr") || "OMR") + '</strong></p>'
          + '<p class="rv-meta"><span>' + (ar ? "الزبون" : "Customer") + '</span> ' + A.esc(o.name || "—") + ' · ' + A.esc(o.phone || "") + '</p>'
          + '</article>';
      }).join("") || ('<p class="note">' + (ar ? "ما في مبيعات لهذا المنتج في الفترة." : "No sales for this product in range.") + '</p>');

      var editBtn = pMeta
        ? ('<button type="button" class="mini" id="finOpenProduct" style="margin-inline-start:8px">' + (ar ? "تعديل المنتج" : "Edit product") + '</button>')
        : "";

      box.innerHTML = '<div class="panel">'
        + '<button type="button" class="mini" id="finBack">' + (ar ? "رجوع" : "Back") + '</button>'
        + editBtn
        + '<h2>' + A.esc(title) + '</h2>'
        + (sku ? ('<p class="note">SKU: ' + A.esc(sku) + '</p>') : "")
        + '<p class="note">×' + qtyAll + ' · ' + (ar ? "الإيراد" : "Revenue") + ' <strong>' + revAll.toFixed(3) + ' ' + (A.t("omr") || "OMR") + '</strong></p>'
        + cardsP
        + '</div>';
      var back2 = document.getElementById("finBack");
      if (back2) back2.onclick = function () { A.financeOpenProd = ""; A.paintFinance(); };
      var ep = document.getElementById("finOpenProduct");
      if (ep && pMeta) {
        ep.onclick = function () {
          if (A.go) A.go("products", "all", { push: true });
          if (A.openEdit) A.openEdit(pMeta.id);
        };
      }
      box.querySelectorAll("[data-fin-order]").forEach(function (b) {
        b.onclick = function () {
          A.orderQuery = b.getAttribute("data-fin-order") || "";
          if (A.go) A.go("orders", "all", { push: true });
        };
      });
      return;
    }

    /* —— لوحة المالية الرئيسية —— */
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
      if (!A.inDateRange(o.at)) return;
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
        var p = productOfItem(it);
        var key = p ? String(p.id) : String(it.sku || it.name || "?");
        if (!byProduct[key]) {
          byProduct[key] = {
            key: key,
            name: productTitle(p, it.name || it.nameAr || it.sku || key),
            sku: (p && p.sku) || it.sku || "",
            pid: p ? p.id : null,
            qty: 0,
            rev: 0
          };
        }
        byProduct[key].qty += Number(it.qty) || 0;
        byProduct[key].rev += lineRev(it);
      });
    });

    var byDay = {};
    (A.orders || []).forEach(function (o) {
      if (!A.inDateRange(o.at)) return;
      if (A.normalizeStatus(o.status) === "cancel") return;
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
          return '<button type="button" class="row rv-hit fin-hit" data-fin-area="' + A.esc(a.name) + '">'
            + '<div><strong>' + A.esc(a.name) + '</strong>'
            + '<small>' + a.n + ' ' + (A.t("f_orderN") || (ar ? "طلب" : "orders")) + '</small></div>'
            + '<strong class="fin-rev">' + a.rev.toFixed(3) + '</strong></button>';
        }).join("")
      : '<p class="note">' + A.t("f_noAreas") + '</p>';

    var prodHtml = products.length
      ? products.map(function (p) {
          return '<button type="button" class="row rv-hit fin-hit" data-fin-prod="' + A.esc(String(p.key)) + '">'
            + '<div><strong>' + A.esc(p.name) + '</strong>'
            + '<small>' + (p.sku ? ("SKU " + A.esc(p.sku) + " · ") : "") + "×" + p.qty + '</small></div>'
            + '<strong class="fin-rev">' + p.rev.toFixed(3) + '</strong></button>';
        }).join("")
      : '<p class="note">' + A.t("f_noProds") + '</p>';

    box.innerHTML =
      '<div id="financeStatus" class="msg"></div>'
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
      + '<div class="panel"><h2>' + A.t("f_areas") + '</h2>'
      + '<p class="note">' + (ar ? "اضغطي المنطقة لعرض طلباتها والإجمالي." : "Tap an area to see its orders and totals.") + '</p>'
      + areaHtml + '</div>'
      + '<div class="panel"><h2>' + A.t("f_prods") + '</h2>'
      + '<p class="note">' + (ar ? "اضغطي المنتج لعرض التفاصيل والمبيعات." : "Tap a product for sales detail.") + '</p>'
      + prodHtml + '</div>';

    box.querySelectorAll("[data-fin-area]").forEach(function (b) {
      b.onclick = function () {
        A.financeOpenArea = b.getAttribute("data-fin-area") || "";
        A.financeOpenProd = "";
        A.paintFinance();
      };
    });
    box.querySelectorAll("[data-fin-prod]").forEach(function (b) {
      b.onclick = function () {
        A.financeOpenProd = b.getAttribute("data-fin-prod") || "";
        A.financeOpenArea = "";
        A.paintFinance();
      };
    });
  };
})(window);
