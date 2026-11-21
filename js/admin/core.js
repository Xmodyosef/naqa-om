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
