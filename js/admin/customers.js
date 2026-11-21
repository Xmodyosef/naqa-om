(function (w) {
  var A = w.NaqaAdmin;
  A._customerQuery = "";
  A.paintCustomers = function () {
    var box = document.getElementById("customersList");
    if (!box) return;
    var map = {};
    A.orders.forEach(function (o) {
      if (A.normalizeStatus(o.status) === "cancel") return;
      var key = String(o.phone || ("n:" + (o.name || o.id)));
      if (!map[key]) {
        map[key] = {
          name: o.name || "—", phone: o.phone || "—", area: o.area || "—",
          count: 0, total: 0, last: o.at || "", orders: []
        };
      }
      map[key].count += 1;
      map[key].total += Number(o.total) || 0;
      map[key].orders.push(o.id);
      if ((o.at || "") > map[key].last) {
        map[key].last = o.at || "";
        map[key].area = o.area || map[key].area;
        map[key].name = o.name || map[key].name;
      }
    });
    var list = Object.keys(map).map(function (k) { return map[k]; });
    list.sort(function (a, b) { return b.total - a.total; });
    var q = (A._customerQuery || "").toLowerCase().trim();
    if (q) {
      list = list.filter(function (c) {
        return [c.name, c.phone, c.area].join(" ").toLowerCase().indexOf(q) >= 0;
      });
    }
    var head =
      '<div class="panel"><h2>العملاء (' + Object.keys(map).length + ')</h2>'
      + '<p class="note">مجمّعين من الطلبات — بحث ونسخ وواتساب.</p>'
      + '<input id="custQ" type="search" placeholder="ابحثي عن زبونة…" value="' + A.esc(A._customerQuery || "") + '" style="width:100%;border:1px solid #efe4df;border-radius:12px;padding:12px;margin-top:8px" />'
      + '<div class="status-bar" style="margin-top:8px">'
      + '<button type="button" class="mini" id="copyCustomers">نسخ قائمة العملاء</button>'
      + '<button type="button" class="mini" id="waCustomers" style="background:#25D366;color:#fff">واتساب القائمة</button>'
      + '</div>'
      + '<p class="status" id="custStatus"></p>'
      + '</div>';
    if (!Object.keys(map).length) {
      box.innerHTML = head + '<p class="note">ما في عملاء بعد. أول طلب غير ملغي يظهر هنا.</p>';
      bindCust();
      return;
    }
    if (!list.length) {
      box.innerHTML = head + '<p class="note">ما في نتائج للبحث.</p>';
      bindCust();
      return;
    }
    box.innerHTML = head + list.map(function (c) {
      var phoneDigits = String(c.phone || "").replace(/\D/g, "").replace(/^968/, "");
      var when = c.last ? new Date(c.last).toLocaleDateString("ar-OM") : "—";
      return '<div class="cust-row"><div><strong>' + A.esc(c.name) + '</strong>'
        + '<small>' + A.esc(c.phone) + ' · ' + A.esc(c.area) + '</small>'
        + '<small>' + c.count + ' طلب · ' + c.total.toFixed(3) + ' ر.ع · آخر طلب ' + A.esc(when) + '</small>'
        + '<small style="color:#8a7f78">' + A.esc((c.orders || []).slice(0, 3).join(" · ")) + (c.orders.length > 3 ? "…" : "") + '</small></div>'
        + (phoneDigits ? ('<a class="mini" style="background:#25D366;color:#fff;text-decoration:none" href="https://wa.me/968' + A.esc(phoneDigits) + '" target="_blank" rel="noopener">واتساب</a>') : "")
        + "</div>";
    }).join("");
    bindCust();
  };
  function bindCust() {
    var el = document.getElementById("custQ");
    if (el && !el._bound) {
      el._bound = true;
      el.addEventListener("input", function () {
        A._customerQuery = el.value;
        A.paintCustomers();
        var again = document.getElementById("custQ");
        if (again) {
          again.focus();
          try { again.setSelectionRange(again.value.length, again.value.length); } catch (e) {}
        }
      });
    }
    var cc = document.getElementById("copyCustomers");
    if (cc && !cc._bound) {
      cc._bound = true;
      cc.onclick = function () { A.copyText(A.buildCustomersReport(), "custStatus"); };
    }
    var wc = document.getElementById("waCustomers");
    if (wc && !wc._bound) {
      wc._bound = true;
      wc.onclick = function () { A.waShareText(A.buildCustomersReport()); };
    }
  }
})(window);
