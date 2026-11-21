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
      return '<div class="cust-row"><div><strong>' + A.esc(o.id) + '</strong><small>' + A.esc(o.name || "") + ' · ' + A.esc(A.STATUS[st] || "") + ' · ' + A.esc(o.area || "") + '</small></div><strong>' + A.esc(o.total != null ? Number(o.total).toFixed(3) : "—") + '</strong></div>';
    }).join("") || '<p class="note">ما في طلبات حديثة. اطلبي من المتجر على نفس الجهاز.</p>';
    var topHtml = topProducts.length
      ? topProducts.map(function (t) {
          return '<div class="cust-row"><div><strong>' + A.esc(t.name) + '</strong><small>×' + t.qty + ' قطعة</small></div><strong>' + t.rev.toFixed(3) + '</strong></div>';
        }).join("")
      : '<p class="note">لما توصل طلبات بمنتجات، يظهر هنا الأكثر مبيعاً.</p>';
    var lowHtml = lowList.length
      ? lowList.slice(0, 8).map(function (x) {
          return '<div class="cust-row"><div><strong>' + A.esc(x.name) + '</strong><small>SKU ' + A.esc(x.sku || "—") + '</small></div><strong style="color:#b05c6e">' + x.stock + '</strong></div>';
        }).join("")
      : '<p class="note">ما في منتجات بمخزون منخفض (≤٣) أو المخزون غير محدد.</p>';
    box.innerHTML =
      '<div class="stat-grid">'
      + '<div class="stat"><strong>' + sales.toFixed(3) + '</strong><span>مبيعات ر.ع</span></div>'
      + '<div class="stat"><strong>' + active + '</strong><span>طلبات فعّالة</span></div>'
      + '<div class="stat"><strong>' + neu + '</strong><span>جديد يحتاج متابعة</span></div>'
      + '<div class="stat"><strong>' + lowStock + '</strong><span>مخزون ≤ ٣</span></div>'
      + '</div>'
      + '<div class="panel"><h2>حالات الطلبات</h2>'
      + '<div class="status-bar" style="margin:0">'
      + '<button type="button" data-go="orders">جديد ' + neu + '</button>'
      + '<button type="button" data-go="orders">تجهيز ' + prep + '</button>'
      + '<button type="button" data-go="orders">توصيل ' + ship + '</button>'
      + '<button type="button" data-go="orders">تم ' + delivered + '</button>'
      + '</div></div>'
      + '<div class="panel"><h2>اختصارات</h2>'
      + '<div class="status-bar" style="margin:0">'
      + '<button type="button" data-go="orders">الطلبات</button>'
      + '<button type="button" data-go="products">المنتجات</button>'
      + '<button type="button" data-go="customers">العملاء</button>'
      + '<button type="button" data-go="finance">المالية</button>'
      + '</div></div>'
      + '<div class="panel"><h2>آخر الطلبات</h2>' + recent + '</div>'
      + '<div class="panel"><h2>الأكثر مبيعاً (من الطلبات)</h2>' + topHtml + '</div>'
      + '<div class="panel"><h2>تنبيه مخزون</h2>' + lowHtml + '</div>'
      + '<p class="note">مخفي من المتجر: ' + hidden + ' · كتالوج: ' + A.products.length + ' منتج</p>';
  };
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-go]");
    if (!b || !document.getElementById("dashBox") || !document.getElementById("dashBox").contains(b)) return;
    if (A.setTab) A.setTab(b.getAttribute("data-go"));
  });
})(window);
