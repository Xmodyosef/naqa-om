/* Shared state + helpers for Naqa admin (Zid/Salla/Shopify-style modules) */
(function (w) {
  var A = w.NaqaAdmin = w.NaqaAdmin || {};
  A.products = (w.NAQA_PRODUCTS || []).map(function (p) { return Object.assign({ imgs: [] }, p); });
  A.KEY = "naqa_overrides";
  A.PIN = "naqa_admin_pin";
  A.TOKEN = "naqa_gh_token";
  A.ORDERS_KEY = "naqa_orders";
  A.overrides = {};
  A.orders = [];
  A.editingId = null;
  A.orderFilter = "all";
  A.CATS = ["عناية", "وجه", "عيون", "حواجب", "شفاه", "عطور", "أدوات", "شعر"];
  A.STATUS = {
    new: "جديد",
    prep: "جاري التجهيز",
    ship: "جاري التوصيل",
    delivered: "تم التوصيل",
    cancel: "ملغي"
  };
  A.STATUS_ORDER = ["new", "prep", "ship", "delivered", "cancel"];

  try { A.overrides = JSON.parse(localStorage.getItem(A.KEY) || "{}"); } catch (e) { A.overrides = {}; }
  try {
    A.orders = JSON.parse(localStorage.getItem(A.ORDERS_KEY) || "[]");
    if (!Array.isArray(A.orders)) A.orders = [];
  } catch (e) { A.orders = []; }

  A.esc = function (v) {
    return String(v == null ? "" : v).split("&").join("&" + "amp;").split("<").join("&" + "lt;").split('"').join("&" + "quot;");
  };
  A.val = function (id) {
    var el = document.getElementById(id);
    return el ? el.value : "";
  };
  A.normalizeStatus = function (st) {
    if (st === "done") return "ship";
    if (A.STATUS[st]) return st;
    return "new";
  };
  A.saveOrders = function () {
    localStorage.setItem(A.ORDERS_KEY, JSON.stringify(A.orders.slice(0, 100)));
  };
  A.merged = function (p) {
    var o = A.overrides[p.id] || A.overrides[String(p.id)] || {};
    var m = Object.assign({}, p, o);
    if (o.imgs && o.imgs.length) m.imgs = o.imgs;
    if (m.stock == null || m.stock === "") m.stock = "";
    if (m.was == null) m.was = "";
    return m;
  };
  A.utf8b64 = function (text) {
    return btoa(unescape(encodeURIComponent(text)));
  };
  A.ghPut = function (path, content, token, message) {
    var api = "https://api.github.com/repos/Xmodyosef/naqa-om/contents/" + path;
    var headers = { Authorization: "Bearer " + token, Accept: "application/vnd.github+json" };
    return fetch(api, { headers: headers }).then(function (res) { return res.ok ? res.json() : {}; }).then(function (cur) {
      return fetch(api, {
        method: "PUT",
        headers: Object.assign({ "Content-Type": "application/json" }, headers),
        body: JSON.stringify({ message: message, content: A.utf8b64(content), sha: cur.sha })
      });
    });
  };
  A.setMsg = function (id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text || "";
  };
  A.copyText = function (text, msgId) {
    text = String(text || "");
    function ok() { A.setMsg(msgId || "orderStatus", "تم النسخ ✓"); }
    function fail() {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        ok();
      } catch (e) {
        A.setMsg(msgId || "orderStatus", "ما قدرنا ننسخ — حدّدي النص يدوياً");
        prompt("انسخي من هنا:", text.slice(0, 1500));
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok).catch(fail);
    } else fail();
  };
  A.buildOrdersReport = function (filter) {
    var lines = ["نقاء — تقرير الطلبات", "—"];
    var list = A.orders.filter(function (o) {
      if (!filter || filter === "all") return true;
      if (filter === "new") return A.normalizeStatus(o.status) === "new";
      return A.normalizeStatus(o.status) === filter;
    });
    if (!list.length) return "ما في طلبات.";
    list.forEach(function (o, i) {
      var st = A.STATUS[A.normalizeStatus(o.status)] || o.status;
      lines.push((i + 1) + ") " + (o.id || "") + " · " + st);
      lines.push("   " + (o.name || "—") + " · " + (o.phone || "—") + " · " + (o.area || "—"));
      lines.push("   المجموع: " + (o.total != null ? Number(o.total).toFixed(3) : "—") + " ر.ع");
      lines.push("   الدفع: " + (o.paymentLabel || (o.paid ? "مدفوع" : (o.payment === "cod" ? "دفع عند الاستلام" : "—"))));
      if (o.delivery != null || o.codFee != null || o.shipping != null) {
        lines.push("   رسوم: توصيل " + Number(o.delivery != null ? o.delivery : 0).toFixed(3)
          + " · استلام " + Number(o.codFee != null ? o.codFee : 0).toFixed(3)
          + " · صافي رسوم " + Number(o.shipping != null ? o.shipping : 0).toFixed(3) + " ر.ع");
      }
      if (Array.isArray(o.items) && o.items.length) {
        o.items.forEach(function (it) {
          lines.push("   - " + (it.name || it.nameAr || "") + " ×" + (it.qty || 1) + " (" + (it.sku || "") + ")");
        });
      } else if (o.itemsText) lines.push("   " + o.itemsText);
      lines.push("");
    });
    lines.push("الإجمالي المسجّل: " + list.length + " طلب");
    return lines.join("\n");
  };
  A.buildCustomersReport = function () {
    var map = {};
    A.orders.forEach(function (o) {
      if (A.normalizeStatus(o.status) === "cancel") return;
      var key = String(o.phone || ("n:" + (o.name || o.id)));
      if (!map[key]) map[key] = { name: o.name || "—", phone: o.phone || "—", area: o.area || "—", count: 0, total: 0 };
      map[key].count++;
      map[key].total += Number(o.total) || 0;
    });
    var list = Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.total - a.total; });
    var lines = ["نقاء — قائمة العملاء", "—"];
    if (!list.length) return "ما في عملاء.";
    list.forEach(function (c, i) {
      lines.push((i + 1) + ") " + c.name + " · " + c.phone + " · " + c.area);
      lines.push("   " + c.count + " طلب · " + c.total.toFixed(3) + " ر.ع");
    });
    lines.push("");
    lines.push("العدد: " + list.length);
    return lines.join("\n");
  };
  A.buildFinanceReport = function () {
    var sales = 0, count = 0, cancel = 0;
    var bySt = { new: 0, prep: 0, ship: 0, delivered: 0 };
    A.orders.forEach(function (o) {
      var st = A.normalizeStatus(o.status);
      if (st === "cancel") { cancel++; return; }
      count++;
      sales += Number(o.total) || 0;
      if (bySt[st] != null) bySt[st]++;
    });
    return [
      "نقاء — تقرير مالية",
      "—",
      "مبيعات (بدون ملغي): " + sales.toFixed(3) + " ر.ع",
      "طلبات فعّالة: " + count,
      "متوسط الطلب: " + (count ? (sales / count).toFixed(3) : "0.000") + " ر.ع",
      "جديد: " + bySt.new + " · تجهيز: " + bySt.prep + " · توصيل: " + bySt.ship + " · تم: " + bySt.delivered,
      "ملغي: " + cancel,
      "تاريخ التقرير: " + new Date().toLocaleString("ar-OM")
    ].join("\n");
  };
  A.waShareText = function (text) {
    var url = "https://wa.me/" + (w.WA_NUMBER || "96879088349") + "?text=" + encodeURIComponent(text);
    w.open(url, "_blank");
  };
  A.loadRemoteOrders = function () {
    return fetch("data/orders.json?v=" + Date.now()).then(function (r) { return r.ok ? r.json() : []; }).then(function (remote) {
      if (!Array.isArray(remote)) return;
      var by = {};
      A.orders.forEach(function (o) { if (o && o.id) by[o.id] = o; });
      remote.forEach(function (o) {
        if (!o || !o.id) return;
        by[o.id] = Object.assign({}, by[o.id] || {}, o);
      });
      A.orders = Object.keys(by).map(function (k) { return by[k]; });
      A.orders.sort(function (a, b) { return (b.at || "").localeCompare(a.at || ""); });
      A.orders.forEach(function (o) { o.status = A.normalizeStatus(o.status); });
      A.saveOrders();
      if (A.paintOrders) A.paintOrders();
      if (A.paintDashboard) A.paintDashboard();
      if (A.paintCustomers) A.paintCustomers();
      if (A.paintFinance) A.paintFinance();
    }).catch(function () {});
  };
})(window);
