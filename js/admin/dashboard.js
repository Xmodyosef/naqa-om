(function (w) {
  var A = w.NaqaAdmin;
  A.paintDashboard = function () {
    var box = document.getElementById("dashBox");
    if (!box) return;
    var sales = 0, active = 0, lowStock = 0, hidden = 0;
    A.orders.forEach(function (o) {
      if (A.normalizeStatus(o.status) === "cancel") return;
      active++;
      sales += Number(o.total) || 0;
    });
    A.products.forEach(function (p) {
      var m = A.merged(p);
      if (m.hidden) hidden++;
      if (m.stock !== "" && m.stock != null && Number(m.stock) <= 3) lowStock++;
    });
    var recent = A.orders.slice(0, 5).map(function (o) {
      return '<div class="cust-row"><div><strong>' + A.esc(o.id) + '</strong><small>' + A.esc(o.name || "") + ' · ' + A.esc(A.STATUS[A.normalizeStatus(o.status)] || "") + '</small></div><strong>' + A.esc(o.total != null ? Number(o.total).toFixed(3) : "—") + '</strong></div>';
    }).join("") || '<p class="note">ما في طلبات حديثة.</p>';
    box.innerHTML =
      '<div class="stat-grid">'
      + '<div class="stat"><strong>' + sales.toFixed(3) + '</strong><span>مبيعات ر.ع</span></div>'
      + '<div class="stat"><strong>' + active + '</strong><span>طلبات</span></div>'
      + '<div class="stat"><strong>' + A.products.length + '</strong><span>منتجات الكتالوج</span></div>'
      + '<div class="stat"><strong>' + lowStock + '</strong><span>مخزون ≤ ٣</span></div>'
      + '</div>'
      + '<div class="panel"><h2>آخر الطلبات</h2>' + recent + '</div>'
      + '<p class="note">الصفحة الرئيسية مثل زد/شوبيفاي: نظرة سريعة ثم اذهبي للطلبات أو المنتجات.</p>';
  };
})(window);
