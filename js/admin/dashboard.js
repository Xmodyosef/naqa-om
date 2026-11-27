(function (w) {
  var A = w.NaqaAdmin;
  A.paintDashboard = function () {
    var box = document.getElementById("dashBox");
    if (!box) return;
    var sales = 0, neu = 0, prep = 0, ship = 0, lowStock = 0, pendingReviews = 0;
    var delivered = 0, cancel = 0, activeCount = 0;
    var todaySales = 0, todayOrders = 0, weekOrders = 0;
    var now = new Date();
    var startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    var startWeek = startToday - 6 * 24 * 3600 * 1000;
    var areas = {};
    var productHits = {};

    function orderTime(o) {
      var t = o && (o.at || o.createdAt || o.time || o.date);
      if (!t) return 0;
      if (typeof t === "number") return t;
      var d = Date.parse(t);
      return isFinite(d) ? d : 0;
    }

    (A.liveOrders ? A.liveOrders() : (A.orders || [])).forEach(function (o) {
      var st = A.normalizeStatus(o.status);
      var tot = Number(o.total) || 0;
      var ts = orderTime(o);
      if (st !== "cancel") {
        sales += tot;
        activeCount++;
        if (ts >= startToday) { todaySales += tot; todayOrders++; }
        if (ts >= startWeek) weekOrders++;
        var area = String(o.area || o.wilayat || o.city || o.gov || "").trim();
        if (area) areas[area] = (areas[area] || 0) + 1;
        (o.items || o.lines || []).forEach(function (it) {
          var id = it && (it.id != null ? it.id : it.sku || it.name);
          if (id == null) return;
          var q = Number(it.qty) || 1;
          productHits[id] = (productHits[id] || 0) + q;
        });
      }
      if (st === "new") neu++;
      else if (st === "prep") prep++;
      else if (st === "ship") ship++;
      else if (st === "delivered") delivered++;
      else if (st === "cancel") cancel++;
    });
    (A.reviews || []).forEach(function (r) {
      if (r && r.hidden) pendingReviews++;
    });
    var lowList = [];
    (A.products || []).forEach(function (p) {
      var m = A.merged ? A.merged(p) : p;
      if (!m || m.stock === "" || m.stock == null) return;
      var n = Number(m.stock);
      if (n === 0 || n === 1) {
        lowStock++;
        lowList.push({ name: (A.lang === "en" ? (m.nameEn || m.nameAr) : (m.nameAr || m.nameEn)), stock: n, sku: m.sku });
      }
    });
    lowList.sort(function (a, b) { return a.stock - b.stock || String(a.sku).localeCompare(String(b.sku)); });

    var avg = activeCount ? (sales / activeCount) : 0;
    var topAreas = Object.keys(areas).map(function (k) { return { k: k, n: areas[k] }; })
      .sort(function (a, b) { return b.n - a.n; }).slice(0, 3);
    var topProds = Object.keys(productHits).map(function (k) { return { k: k, n: productHits[k] }; })
      .sort(function (a, b) { return b.n - a.n; }).slice(0, 3);

    function stat(n, label, tab, sub) {
      return '<button type="button" class="stat stat-link" data-go-tab="' + tab + '" data-go-sub="' + A.esc(sub) + '"><strong>' + n + '</strong><span>' + label + '</span></button>';
    }
    var recent = (A.liveOrders ? A.liveOrders() : (A.orders || [])).slice(0, 6).map(function (o) {
      var st = A.normalizeStatus(o.status);
      return '<button type="button" class="cust-row cust-link" data-go-tab="orders" data-go-sub="' + A.esc(st) + '"><div><strong>' + A.esc(o.id) + '</strong><small>' + A.esc(o.name || "") + ' · ' + A.esc(A.statusLabel(st) || "") + '</small></div><strong>' + A.esc(o.total != null ? Number(o.total).toFixed(3) : "—") + '</strong></button>';
    }).join("") || '<p class="note">' + A.t("d_noRecent") + '</p>';
    var lowHtml = lowList.length
      ? lowList.slice(0, 6).map(function (l) {
          return '<button type="button" class="cust-row cust-link" data-go-tab="products" data-go-sub="stock"><div><strong>' + A.esc(l.name) + '</strong><small>SKU ' + A.esc(l.sku || "—") + '</small></div><strong>' + l.stock + '</strong></button>';
        }).join("")
      : '<p class="note">' + A.t("d_noLow") + '</p>';

    var ar = A.lang !== "en";
    var analytics =
      '<div class="panel dash-analytics">'
      + '<h2>' + (ar ? "تحليلات سريعة" : "Quick analytics") + '</h2>'
      + '<div class="stat-grid analytics-grid">'
      + stat(todayOrders, ar ? "طلبات اليوم" : "Orders today", "orders", "all")
      + stat(todaySales.toFixed(2), ar ? "مبيعات اليوم" : "Sales today", "finance", "")
      + stat(weekOrders, ar ? "٧ أيام" : "7 days", "orders", "all")
      + stat(avg.toFixed(2), ar ? "متوسط الطلب" : "Avg order", "finance", "")
      + stat(delivered, ar ? "تم التوصيل" : "Delivered", "orders", "delivered")
      + stat(cancel, ar ? "ملغي" : "Cancelled", "orders", "cancel")
      + '</div>';
    if (topAreas.length) {
      analytics += '<p class="note" style="margin:8px 0 4px"><strong>' + (ar ? "أعلى المناطق" : "Top areas") + '</strong></p><ul class="dash-mini-list">';
      topAreas.forEach(function (a) {
        analytics += '<li>' + A.esc(a.k) + ' <span>(' + a.n + ')</span></li>';
      });
      analytics += '</ul>';
    }
    if (topProds.length) {
      analytics += '<p class="note" style="margin:8px 0 4px"><strong>' + (ar ? "الأكثر طلباً (من الطلبات)" : "Most ordered") + '</strong></p><ul class="dash-mini-list">';
      topProds.forEach(function (p) {
        var label = p.k;
        try {
          var prod = (A.products || []).find(function (x) { return String(x.id) === String(p.k) || String(x.sku) === String(p.k); });
          if (prod) label = ar ? (prod.nameAr || prod.nameEn || p.k) : (prod.nameEn || prod.nameAr || p.k);
        } catch (e) {}
        analytics += '<li>' + A.esc(label) + ' <span>×' + p.n + '</span></li>';
      });
      analytics += '</ul>';
    }
    analytics += '<button type="button" class="mini" data-go-tab="finance" data-go-sub="" style="margin-top:8px">' + (ar ? "تفاصيل المالية ←" : "Finance details →") + '</button>';
    analytics += '</div>';

    var reviewsTile = pendingReviews
      ? stat(pendingReviews, A.t("d_reviews"), "reviews", "")
      : "";
    if (!box._goBound) {
      box._goBound = true;
      box.addEventListener("click", function (e) {
        var b = e.target.closest("[data-go-tab]");
        if (!b || !A.go) return;
        A.go(b.getAttribute("data-go-tab"), b.getAttribute("data-go-sub") || "", { push: true });
      });
    }
    box.innerHTML =
      '<div class="stat-grid">'
      + stat(neu, A.t("d_new"), "orders", "new")
      + stat(prep, A.t("d_prep"), "orders", "prep")
      + stat(ship, A.t("d_ship"), "orders", "ship")
      + stat(lowStock, A.t("d_low"), "products", "stock")
      + reviewsTile
      + '</div>'
      + '<button type="button" class="stat stat-link sales-link" data-go-tab="finance" data-go-sub=""><strong>' + sales.toFixed(3) + ' ' + A.t("omr") + '</strong><span>' + A.t("d_sales") + '</span></button>'
      + analytics
      + '<div class="panel"><h2>' + A.t("d_recent") + '</h2>' + recent + '</div>'
      + '<div class="panel"><h2>' + A.t("d_lowTitle") + '</h2>' + lowHtml
      + '<button type="button" class="mini" data-go-tab="products" data-go-sub="stock" style="margin-top:8px">' + A.t("p_stockAll") + ' · ' + lowStock + '</button></div>'
      ;
  };
})(window);
