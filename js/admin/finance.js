(function (w) {
  var A = w.NaqaAdmin;
  A.paintFinance = function () {
    var box = document.getElementById("financeBox");
    if (!box) return;
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
    A.orders.forEach(function (o) {
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
      var area = o.area || "—";
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
    var byDay = {};
    A.orders.forEach(function (o) {
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
    }).sort(function (a, b) { return b.rev - a.rev; }).slice(0, 8);
    var products = Object.keys(byProduct).map(function (k) { return byProduct[k]; })
      .sort(function (a, b) { return b.rev - a.rev; }).slice(0, 8);
    var areaHtml = areas.length
      ? areas.map(function (a) {
          return '<div class="cust-row"><div><strong>' + A.esc(a.name) + '</strong><small>' + a.n + ' ' + A.t("f_orderN") + '</small></div><strong>' + a.rev.toFixed(3) + '</strong></div>';
        }).join("")
      : '<p class="note">' + A.t("f_noAreas") + '</p>';
    var prodHtml = products.length
      ? products.map(function (p) {
          return '<div class="cust-row"><div><strong>' + A.esc(p.name) + '</strong><small>×' + p.qty + '</small></div><strong>' + p.rev.toFixed(3) + '</strong></div>';
        }).join("")
      : '<p class="note">' + A.t("f_noProds") + '</p>';
    box.innerHTML =
      A.dateFilterHtml("finDate")
      + '<div class="status-bar" style="margin:0 0 10px">'
      + '<button type="button" class="mini" id="copyFinance">' + A.t("f_copy") + '</button>'
      + '<button type="button" class="mini" id="waFinance" style="background:#25D366;color:#fff">' + A.t("f_wa") + '</button>'
      + '<button type="button" class="mini" id="exportFinanceCsv">' + A.t("exportCsv") + '</button>'
      + '</div>'
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
      + '<p class="note" id="financeStatus">' + A.t("f_note") + '</p>';
    A.bindDateFilter("finDate", function () { A.paintFinance(); });
    var cf = document.getElementById("copyFinance");
    if (cf) cf.onclick = function () { A.copyText(A.buildFinanceReport(), "financeStatus"); };
    var wf = document.getElementById("waFinance");
    if (wf) wf.onclick = function () { A.waShareText(A.buildFinanceReport()); };
    var ef = document.getElementById("exportFinanceCsv");
    if (ef) ef.onclick = function () {
      var rows = [["id", "at", "status", "name", "phone", "area", "total"]];
      (A.orders || []).forEach(function (o) {
        if (!A.inDateRange(o.at)) return;
        if (A.normalizeStatus(o.status) === "cancel") return;
        rows.push([o.id || "", o.at || "", A.normalizeStatus(o.status), o.name || "", o.phone || "", o.area || "", o.total != null ? o.total : ""]);
      });
      A.downloadCsv("naqa-finance.csv", rows);
      A.setMsg("financeStatus", A.t("exportOk"));
    };
  };
})(window);
