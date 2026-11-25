(function (w) {
  var A = w.NaqaAdmin;

  function phoneDigits(s) {
    return String(s || "").replace(/\D/g, "");
  }
  function matchPhone(c, q) {
    q = String(q || "").trim();
    if (!q) return true;
    var d = phoneDigits(q);
    var p = phoneDigits(c && c.phone);
    if (d) return p.indexOf(d) >= 0;
    return String((c && c.phone) || "").indexOf(q) >= 0;
  }
  function buildMap() {
    var map = {};
    (A.orders || []).forEach(function (o) {
      if (A.normalizeStatus && A.normalizeStatus(o.status) === "cancel") return;
      if (String(o.status || "") === "cancel") return;
      var key = String(o.phone || ("n:" + (o.name || o.id)));
      if (!map[key]) {
        map[key] = {
          name: o.name || "—",
          phone: o.phone || "—",
          area: o.area || "—",
          count: 0,
          total: 0,
          last: o.at || "",
          orders: []
        };
      }
      map[key].count += 1;
      map[key].total += Number(o.total) || 0;
      map[key].orders.push(o.id);
      if ((o.at || "") > map[key].last) {
        map[key].last = o.at || "";
        map[key].area = o.area || map[key].area;
        map[key].name = o.name || map[key].name;
        map[key].phone = o.phone || map[key].phone;
      }
    });
    return map;
  }
  function customersList(map) {
    var list = Object.keys(map || {}).map(function (k) { return map[k]; });
    list.sort(function (a, b) { return b.total - a.total; });
    var q = A.customerQuery || "";
    if (q) list = list.filter(function (c) { return matchPhone(c, q); });
    return list;
  }

  A.exportCustomersCsv = function () {
    var ar = A.lang !== "en";
    var head = ar
      ? ["الجوال", "الاسم", "المنطقة", "الطلبات", "الإجمالي"]
      : ["phone", "name", "area", "orders", "total"];
    var rows = [head];
    var map = buildMap();
    customersList(map).forEach(function (c) {
      rows.push([
        c.phone || "",
        c.name || "",
        c.area || "",
        c.count || 0,
        (Number(c.total) || 0).toFixed(3)
      ]);
    });
    A.downloadCsv("naqa-customers.csv", rows);
    if (A.setMsg) A.setMsg("custStatus", A.t("exportOk") || (ar ? "تم التصدير" : "Exported"));
  };

  A.paintCustomers = function () {
    var box = document.getElementById("customersList");
    if (!box) return;
    var map = buildMap();
    var allN = Object.keys(map).length;
    var list = customersList(map);
    var q = A.customerQuery || "";
    var ar = A.lang !== "en";

    var emptyMsg = allN
      ? (q
        ? (A.t("c_phoneEmpty") || (ar ? "ما في عميل لهذا الرقم" : "No customer for this number"))
        : (A.t("c_noRes") || (ar ? "ما في نتائج." : "No results.")))
      : (A.t("c_empty") || (ar ? "ما في عملاء بعد." : "No customers yet."));

    var rows = list.map(function (c) {
      var when = c.last && A.fmtDateNum ? A.fmtDateNum(c.last) : (c.last || "—");
      var phone = c.phone && c.phone !== "—" ? A.esc(c.phone) : "—";
      var meta = (c.count || 0) + " " + (A.t("c_orders") || (ar ? "طلب" : "orders"))
        + " · " + (Number(c.total) || 0).toFixed(3) + " " + (A.t("omr") || "OMR")
        + (c.area && c.area !== "—" ? (" · " + A.esc(c.area)) : "")
        + (when && when !== "—" ? (" · " + A.esc(when)) : "");
      return '<button type="button" class="row rv-hit cust-hit" data-cust-phone="' + A.esc(String(c.phone || "")) + '">'
        + '<div><strong>' + A.esc(c.name || "—") + '</strong>'
        + '<small class="cust-phone">' + phone + '</small>'
        + '<small>' + meta + '</small></div></button>';
    }).join("");

    if (!rows) {
      rows = '<p class="note">' + A.esc(emptyMsg) + '</p>';
    }

    box.innerHTML = '<div class="panel"><h2>' + (A.t("c_title") || (ar ? "العملاء" : "Customers"))
      + (allN ? (' <span class="sub-count-inline">(' + allN + ')</span>') : '')
      + '</h2>'
      + '<div id="custStatus" class="msg"></div>'
      + rows
      + '</div>';

    /* Optional: tap customer → filter that phone in search */
    box.querySelectorAll("[data-cust-phone]").forEach(function (b) {
      b.onclick = function () {
        var ph = b.getAttribute("data-cust-phone") || "";
        A.customerQuery = ph === "—" ? "" : ph;
        var input = document.getElementById("globalSearch");
        if (input) input.value = A.customerQuery;
        A.paintCustomers();
      };
    });
  };
})(window);
