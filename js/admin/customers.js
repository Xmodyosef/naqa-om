(function (w) {
  var A = w.NaqaAdmin;
  A.paintCustomers = function () {
    var box = document.getElementById("customersList");
    if (!box) return;
    var map = {};
    A.orders.forEach(function (o) {
      if (A.normalizeStatus(o.status) === "cancel") return;
      var key = String(o.phone || o.name || o.id);
      if (!map[key]) map[key] = { name: o.name || "—", phone: o.phone || "—", area: o.area || "—", count: 0, total: 0, last: o.at || "" };
      map[key].count += 1;
      map[key].total += Number(o.total) || 0;
      if ((o.at || "") > map[key].last) {
        map[key].last = o.at || "";
        map[key].area = o.area || map[key].area;
        map[key].name = o.name || map[key].name;
      }
    });
    var list = Object.keys(map).map(function (k) { return map[k]; });
    list.sort(function (a, b) { return b.total - a.total; });
    if (!list.length) {
      box.innerHTML = '<p class="note">العملاء يظهرون تلقائي من الطلبات (مثل زد وسلّة).</p>';
      return;
    }
    box.innerHTML = list.map(function (c) {
      var phoneDigits = String(c.phone || "").replace(/\D/g, "").replace(/^968/, "");
      return '<div class="cust-row"><div><strong>' + A.esc(c.name) + '</strong><small>' + A.esc(c.phone) + ' · ' + A.esc(c.area) + '</small>'
        + '<small>' + c.count + ' طلب · ' + c.total.toFixed(3) + ' ر.ع</small></div>'
        + (phoneDigits ? ('<a class="mini" style="background:#25D366;color:#fff;text-decoration:none" href="https://wa.me/968' + A.esc(phoneDigits) + '" target="_blank" rel="noopener">واتساب</a>') : "")
        + "</div>";
    }).join("");
  };
})(window);
