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
  function customerKey(o) {
    var ph = phoneDigits(o && o.phone);
    if (ph) return "p:" + ph;
    return "n:" + String((o && (o.name || o.id)) || "");
  }
  /** All non-cancelled orders grouped by customer phone (or name). */
  function buildMap() {
    var map = {};
    (A.liveOrders ? A.liveOrders() : (A.orders || [])).forEach(function (o) {
      if (!o) return;
      var st = A.normalizeStatus ? A.normalizeStatus(o.status) : String(o.status || "");
      if (st === "cancel") return;
      var key = customerKey(o);
      if (!map[key]) {
        map[key] = {
          key: key,
          name: o.name || "—",
          phone: o.phone || "—",
          area: o.area || o.city || "—",
          count: 0,
          total: 0,
          last: o.at || "",
          orderList: []
        };
      }
      var c = map[key];
      c.count += 1;
      c.total += Number(o.total) || 0;
      c.orderList.push(o);
      if ((o.at || "") > (c.last || "")) {
        c.last = o.at || "";
        c.area = o.area || o.city || c.area;
        c.name = o.name || c.name;
        c.phone = o.phone || c.phone;
      }
    });
    Object.keys(map).forEach(function (k) {
      map[k].orderList.sort(function (a, b) {
        return String(b.at || "").localeCompare(String(a.at || ""));
      });
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
  function statusText(st) {
    st = A.normalizeStatus ? A.normalizeStatus(st) : st;
    if (A.statusLabel) return A.statusLabel(st) || st || "—";
    var ar = A.lang !== "en";
    var map = {
      new: ar ? "جديد" : "New",
      prep: ar ? "تجهيز" : "Preparing",
      ship: ar ? "توصيل" : "Shipping",
      delivered: ar ? "تم" : "Delivered",
      cancel: ar ? "ملغي" : "Cancelled"
    };
    return map[st] || st || "—";
  }
  function whenOf(o) {
    if (!o || !o.at) return "—";
    if (A.fmtDateTimeNum) return A.fmtDateTimeNum(o.at);
    if (A.fmtDateNum) return A.fmtDateNum(o.at);
    return String(o.at);
  }

  A.exportCustomersCsv = function () {
    var ar = A.lang !== "en";
    var head = ar
      ? ["الجوال", "الاسم", "المنطقة", "رقم الطلب", "التاريخ", "الحالة", "الإجمالي"]
      : ["phone", "name", "area", "order", "date", "status", "total"];
    var rows = [head];
    var map = buildMap();
    customersList(map).forEach(function (c) {
      (c.orderList || []).forEach(function (o) {
        rows.push([
          c.phone || "",
          c.name || "",
          c.area || "",
          o.id || "",
          whenOf(o),
          statusText(o.status),
          (Number(o.total) || 0).toFixed(3)
        ]);
      });
    });
    A.downloadCsv("naqa-customers.csv", rows);
    if (A.setMsg) A.setMsg("custStatus", A.t("exportOk") || (ar ? "تم التصدير" : "Exported"));
  };

  A.paintCustomers = function () {
    try { if (A.syncSearchPlaceholder) A.syncSearchPlaceholder(); } catch (e0) {}
    var box = document.getElementById("customersList");
    if (!box) return;
    var ar = A.lang !== "en";
    var map = buildMap();
    var allN = Object.keys(map).length;
    var openKey = A.customerOpen || "";
    var opened = openKey ? map[openKey] : null;
    if (openKey && !opened) {
      A.customerOpen = "";
      openKey = "";
    }

    /* —— Detail: one customer + all their orders —— */
    if (opened) {
      var labName = ar ? "الاسم" : "Name";
      var labArea = ar ? "المنطقة" : "Area";
      var labPhone = ar ? "رقم الجوال" : "Mobile";
      var labOrder = ar ? "الطلب" : "Order";
      var labDate = ar ? "التاريخ" : "Date";
      var labSt = ar ? "الحالة" : "Status";
      var labTot = ar ? "الإجمالي" : "Total";
      var back = ar ? "رجوع" : "Back";
      var cards = (opened.orderList || []).map(function (o) {
        var oid = o.id || "—";
        return '<article class="rv-card cust-order-card">'
          + '<p class="rv-meta"><span>' + labOrder + '</span> '
          + '<button type="button" class="rv-link rv-order" data-cust-order="' + A.esc(String(oid)) + '">' + A.esc(String(oid)) + '</button></p>'
          + '<p class="rv-meta"><span>' + labDate + '</span> ' + A.esc(whenOf(o)) + '</p>'
          + '<p class="rv-meta"><span>' + labSt + '</span> ' + A.esc(statusText(o.status)) + '</p>'
          + '<p class="rv-meta"><span>' + labTot + '</span> ' + (Number(o.total) || 0).toFixed(3) + ' ' + (A.t("omr") || "OMR") + '</p>'
          + (o.area || o.city ? ('<p class="rv-meta"><span>' + labArea + '</span> ' + A.esc(o.area || o.city || "") + '</p>') : "")
          + '</article>';
      }).join("");
      if (!cards) {
        cards = '<p class="note">' + (ar ? "ما في طلبات." : "No orders.") + '</p>';
      }
      box.innerHTML = '<div class="panel">'
        + '<button type="button" class="mini" id="custBack">' + A.esc(back) + '</button>'
        + '<h2>' + A.esc(opened.name || "—") + '</h2>'
        + '<div class="cust-detail-grid">'
        + '<p class="rv-meta"><span>' + labName + '</span> ' + A.esc(opened.name || "—") + '</p>'
        + '<p class="rv-meta"><span>' + labPhone + '</span> <strong class="cust-phone">' + A.esc(opened.phone || "—") + '</strong></p>'
        + '<p class="rv-meta"><span>' + labArea + '</span> ' + A.esc(opened.area || "—") + '</p>'
        + '<p class="rv-meta"><span>' + (ar ? "عدد الطلبات" : "Orders") + '</span> ' + (opened.count || 0)
        + ' · ' + (Number(opened.total) || 0).toFixed(3) + ' ' + (A.t("omr") || "OMR") + '</p>'
        + '</div>'
        + '<h3 class="cust-orders-h">' + (ar ? "كل الطلبات" : "All orders") + '</h3>'
        + cards
        + '</div>';
      var backBtn = document.getElementById("custBack");
      if (backBtn) {
        backBtn.onclick = function () {
          A.customerOpen = "";
          A.paintCustomers();
        };
      }
      box.querySelectorAll("[data-cust-order]").forEach(function (b) {
        b.onclick = function () {
          var id = b.getAttribute("data-cust-order") || "";
          A.orderQuery = id;
          if (A.go) A.go("orders", "all", { push: true });
          else if (A.paintOrders) A.paintOrders();
        };
      });
      return;
    }

    /* —— List —— */
    var list = customersList(map);
    var q = A.customerQuery || "";
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
      return '<button type="button" class="row rv-hit cust-hit" data-cust-open="' + A.esc(c.key) + '">'
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

    box.querySelectorAll("[data-cust-open]").forEach(function (b) {
      b.onclick = function () {
        A.customerOpen = b.getAttribute("data-cust-open") || "";
        A.paintCustomers();
      };
    });
  };
})(window);
