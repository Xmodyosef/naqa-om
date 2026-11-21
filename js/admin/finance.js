(function (w) {
  var A = w.NaqaAdmin;
  A.paintFinance = function () {
    var box = document.getElementById("financeBox");
    if (!box) return;
    var sales = 0, count = 0, cancel = 0, delivered = 0, ship = 0, prep = 0, neu = 0;
    var byArea = {}, byProduct = {}, todaySales = 0, todayCount = 0;
    var today = new Date().toISOString().slice(0, 10);
    A.orders.forEach(function (o) {
      var st = A.normalizeStatus(o.status);
      var day = (o.at || "").slice(0, 10);
      if (st === "cancel") { cancel++; return; }
      count++;
      var tot = Number(o.total) || 0;
      sales += tot;
      if (day === today) { todaySales += tot; todayCount++; }
      if (st === "delivered") delivered++;
      else if (st === "ship") ship++;
      else if (st === "prep") prep++;
      else neu++;
      var area = o.area || "غير محدد";
      if (!byArea[area]) byArea[area] = { n: 0, rev: 0 };
      byArea[area].n++;
      byArea[area].rev += tot;
      (o.items || []).forEach(function (it) {
        var k = it.sku || it.name || "?";
        if (!byProduct[k]) byProduct[k] = { name: it.name || it.nameAr || k, qty: 0, rev: 0 };
        byProduct[k].qty += Number(it.qty) || 0;
        byProduct[k].rev += Number(it.line != null ? it.line : 0) || 0;
      });
    });
    var areas = Object.keys(byArea).map(function (k) {
      return { name: k, n: byArea[k].n, rev: byArea[k].rev };
    }).sort(function (a, b) { return b.rev - a.rev; }).slice(0, 8);
    var products = Object.keys(byProduct).map(function (k) { return byProduct[k]; })
      .sort(function (a, b) { return b.rev - a.rev; }).slice(0, 8);
    var areaHtml = areas.length
      ? areas.map(function (a) {
          return '<div class="cust-row"><div><strong>' + A.esc(a.name) + '</strong><small>' + a.n + ' طلب</small></div><strong>' + a.rev.toFixed(3) + '</strong></div>';
        }).join("")
      : '<p class="note">ما في بيانات مناطق بعد.</p>';
    var prodHtml = products.length
      ? products.map(function (p) {
          return '<div class="cust-row"><div><strong>' + A.esc(p.name) + '</strong><small>×' + p.qty + '</small></div><strong>' + p.rev.toFixed(3) + '</strong></div>';
        }).join("")
      : '<p class="note">ما في تفصيل منتجات في الطلبات بعد.</p>';
    box.innerHTML =
      '<div class="status-bar" style="margin:0 0 10px">'
      + '<button type="button" class="mini" id="copyFinance">نسخ التقرير</button>'
      + '<button type="button" class="mini" id="waFinance" style="background:#25D366;color:#fff">واتساب التقرير</button>'
      + '</div>'
      + '<div class="stat-grid">'
      + '<div class="stat"><strong>' + todaySales.toFixed(3) + '</strong><span>مبيعات اليوم ر.ع</span></div>'
      + '<div class="stat"><strong>' + todayCount + '</strong><span>طلبات اليوم</span></div>'
      + '<div class="stat"><strong>' + sales.toFixed(3) + '</strong><span>إجمالي المبيعات (بدون ملغي)</span></div>'
      + '<div class="stat"><strong>' + count + '</strong><span>طلبات فعّالة</span></div>'
      + '<div class="stat"><strong>' + (count ? (sales / count).toFixed(3) : "0.000") + '</strong><span>متوسط قيمة الطلب</span></div>'
      + '<div class="stat"><strong>' + delivered + '</strong><span>تم التوصيل</span></div>'
      + '<div class="stat"><strong>' + ship + '</strong><span>جاري التوصيل</span></div>'
      + '<div class="stat"><strong>' + prep + '</strong><span>جاري التجهيز</span></div>'
      + '<div class="stat"><strong>' + neu + '</strong><span>جديد</span></div>'
      + '<div class="stat"><strong>' + cancel + '</strong><span>ملغي</span></div>'
      + '</div>'
      + '<div class="panel"><h2>أعلى المناطق</h2>' + areaHtml + '</div>'
      + '<div class="panel"><h2>أعلى المنتجات إيراداً</h2>' + prodHtml + '</div>'
      + '<p class="note" id="financeStatus">الأرقام من سجل الطلبات على الجهاز (+ المنشور على جت هب إن وُجد).</p>';
    var cf = document.getElementById("copyFinance");
    if (cf) cf.onclick = function () { A.copyText(A.buildFinanceReport(), "financeStatus"); };
    var wf = document.getElementById("waFinance");
    if (wf) wf.onclick = function () { A.waShareText(A.buildFinanceReport()); };
  };
})(window);
