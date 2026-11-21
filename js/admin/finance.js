(function (w) {
  var A = w.NaqaAdmin;
  A.paintFinance = function () {
    var box = document.getElementById("financeBox");
    if (!box) return;
    var sales = 0, count = 0, cancel = 0, delivered = 0, ship = 0, prep = 0, neu = 0;
    A.orders.forEach(function (o) {
      var st = A.normalizeStatus(o.status);
      if (st === "cancel") { cancel++; return; }
      count++;
      sales += Number(o.total) || 0;
      if (st === "delivered") delivered++;
      else if (st === "ship") ship++;
      else if (st === "prep") prep++;
      else neu++;
    });
    box.innerHTML =
      '<div class="stat-grid">'
      + '<div class="stat"><strong>' + sales.toFixed(3) + '</strong><span>إجمالي المبيعات ر.ع (بدون ملغي)</span></div>'
      + '<div class="stat"><strong>' + count + '</strong><span>طلبات فعّالة</span></div>'
      + '<div class="stat"><strong>' + delivered + '</strong><span>تم التوصيل</span></div>'
      + '<div class="stat"><strong>' + ship + '</strong><span>جاري التوصيل</span></div>'
      + '<div class="stat"><strong>' + prep + '</strong><span>جاري التجهيز</span></div>'
      + '<div class="stat"><strong>' + neu + '</strong><span>جديد</span></div>'
      + '<div class="stat"><strong>' + cancel + '</strong><span>ملغي</span></div>'
      + '<div class="stat"><strong>' + (count ? (sales / count).toFixed(3) : "0.000") + '</strong><span>متوسط قيمة الطلب</span></div>'
      + '</div><p class="note">مثل تحليلات زد/شوبيفاي — مبسّطة من سجل الطلبات المحلي.</p>';
  };
})(window);
