(function (w) {
  var A = w.NaqaAdmin;
  A.paintDashboard = function () {
    var box = document.getElementById("dashBox");
    if (!box) return;
    var sales = 0, neu = 0, prep = 0, ship = 0, lowStock = 0, pendingReviews = 0;
    A.orders.forEach(function (o) {
      var st = A.normalizeStatus(o.status);
      if (st === "cancel") return;
      sales += Number(o.total) || 0;
      if (st === "new") neu++;
      else if (st === "prep") prep++;
      else if (st === "ship") ship++;
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
    function stat(n, label, tab, sub) {
      return '<button type="button" class="stat stat-link" data-go-tab="' + tab + '" data-go-sub="' + A.esc(sub) + '"><strong>' + n + '</strong><span>' + label + '</span></button>';
    }
    var recent = (A.orders || []).slice(0, 6).map(function (o) {
      var st = A.normalizeStatus(o.status);
      return '<button type="button" class="cust-row cust-link" data-go-tab="orders" data-go-sub="' + A.esc(st) + '"><div><strong>' + A.esc(o.id) + '</strong><small>' + A.esc(o.name || "") + ' · ' + A.esc(A.statusLabel(st) || "") + '</small></div><strong>' + A.esc(o.total != null ? Number(o.total).toFixed(3) : "—") + '</strong></button>';
    }).join("") || '<p class="note">' + A.t("d_noRecent") + '</p>';
    var lowHtml = lowList.length
      ? lowList.slice(0, 6).map(function (l) {
          return '<button type="button" class="cust-row cust-link" data-go-tab="products" data-go-sub="stock"><div><strong>' + A.esc(l.name) + '</strong><small>SKU ' + A.esc(l.sku || "—") + '</small></div><strong>' + l.stock + '</strong></button>';
        }).join("")
      : '<p class="note">' + A.t("d_noLow") + '</p>';
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
      + '<div class="panel"><h2>' + A.t("d_recent") + '</h2>' + recent + '</div>'
      + '<div class="panel"><h2>' + A.t("d_lowTitle") + '</h2>' + lowHtml
      + '<button type="button" class="mini" data-go-tab="products" data-go-sub="stock" style="margin-top:8px">' + A.t("p_stockAll") + ' · ' + lowStock + '</button></div>'
      ;
  };
})(window);
