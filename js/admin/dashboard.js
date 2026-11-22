(function (w) {
  var A = w.NaqaAdmin;
  A.paintDashboard = function () {
    var box = document.getElementById("dashBox");
    if (!box) return;
    var sales = 0, active = 0, lowStock = 0, hidden = 0, neu = 0, prep = 0, ship = 0, delivered = 0;
    var productSales = {};
    A.orders.forEach(function (o) {
      var st = A.normalizeStatus(o.status);
      if (st === "cancel") return;
      active++;
      sales += Number(o.total) || 0;
      if (st === "new") neu++;
      else if (st === "prep") prep++;
      else if (st === "ship") ship++;
      else if (st === "delivered") delivered++;
      (o.items || []).forEach(function (it) {
        var k = it.sku || it.name || it.id || "?";
        if (!productSales[k]) productSales[k] = { name: it.name || it.nameAr || k, qty: 0, rev: 0 };
        productSales[k].qty += Number(it.qty) || 0;
        productSales[k].rev += Number(it.line != null ? it.line : (it.price || 0) * (it.qty || 0)) || 0;
      });
    });
    var lowList = [];
    A.products.forEach(function (p) {
      var m = A.merged(p);
      if (m.hidden) hidden++;
      if (m.stock !== "" && m.stock != null && Number(m.stock) <= 3) {
        lowStock++;
        lowList.push({ name: m.nameAr || m.nameEn, stock: Number(m.stock), sku: m.sku });
      }
    });
    lowList.sort(function (a, b) { return a.stock - b.stock; });
    var topProducts = Object.keys(productSales).map(function (k) { return productSales[k]; })
      .sort(function (a, b) { return b.qty - a.qty; }).slice(0, 5);
    var recent = A.orders.slice(0, 6).map(function (o) {
      var st = A.normalizeStatus(o.status);
      return '<div class="cust-row"><div><strong>' + A.esc(o.id) + '</strong><small>' + A.esc(o.name || "") + ' · ' + A.esc(A.statusLabel(st) || "") + ' · ' + A.esc(o.area || "") + '</small></div><strong>' + A.esc(o.total != null ? Number(o.total).toFixed(3) : "—") + '</strong></div>';
    }).join("") || '<p class="note">' + A.t("d_noRecent") + '</p>';
    var topHtml = topProducts.length
      ? topProducts.map(function (t) {
          return '<div class="cust-row"><div><strong>' + A.esc(t.name) + '</strong><small>×' + t.qty + ' ' + A.t("d_pcs") + '</small></div><strong>' + t.rev.toFixed(3) + '</strong></div>';
        }).join("")
      : '<p class="note">' + A.t("d_noTop") + '</p>';
    var lowHtml = lowList.length
      ? lowList.slice(0, 8).map(function (l) {
          return '<div class="cust-row"><div><strong>' + A.esc(l.name) + '</strong><small>SKU ' + A.esc(l.sku || "—") + '</small></div><strong>' + l.stock + ' ' + A.t("d_left") + '</strong></div>';
        }).join("")
      : '<p class="note">' + A.t("d_noLow") + '</p>';
    box.innerHTML =
      '<div class="stat-grid">'
      + '<div class="stat"><strong>' + sales.toFixed(3) + '</strong><span>' + A.t("d_sales") + '</span></div>'
      + '<div class="stat"><strong>' + active + '</strong><span>' + A.t("d_orders") + '</span></div>'
      + '<div class="stat"><strong>' + neu + '</strong><span>' + A.t("d_new") + '</span></div>'
      + '<div class="stat"><strong>' + prep + '</strong><span>' + A.t("d_prep") + '</span></div>'
      + '<div class="stat"><strong>' + ship + '</strong><span>' + A.t("d_ship") + '</span></div>'
      + '<div class="stat"><strong>' + delivered + '</strong><span>' + A.t("d_done") + '</span></div>'
      + '<div class="stat"><strong>' + lowStock + '</strong><span>' + A.t("d_low") + '</span></div>'
      + '<div class="stat"><strong>' + hidden + '</strong><span>' + A.t("d_hidden") + '</span></div>'
      + '</div>'
      + '<div class="panel"><h2>' + A.t("d_recent") + '</h2>' + recent + '</div>'
      + '<div class="panel"><h2>' + A.t("d_top") + '</h2>' + topHtml + '</div>'
      + '<div class="panel"><h2>' + A.t("d_lowTitle") + '</h2>' + lowHtml + '</div>'
      + '<p class="note">' + A.t("d_note") + '</p>';
  };
})(window);
