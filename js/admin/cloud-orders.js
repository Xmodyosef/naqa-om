/* Private order bag: Firestore naqa/orders_private (admin read/write only). */
(function (w) {
  "use strict";
  var A = w.NaqaAdmin = w.NaqaAdmin || {};
  var DOC = { col: "naqa", id: "orders_private" };
  var MAX = 2000;

  function db() {
    try {
      if (!w.firebase || !firebase.apps || !firebase.apps.length) return null;
      if (!firebase.firestore) return null;
      return firebase.firestore();
    } catch (e) { return null; }
  }
  function uid() {
    try {
      var u = firebase.auth && firebase.auth().currentUser;
      return u && u.uid ? u.uid : "";
    } catch (e) { return ""; }
  }

  A.pullOrdersCloud = function () {
    var database = db();
    if (!database || !uid()) return Promise.resolve(false);
    return database.collection(DOC.col).doc(DOC.id).get().then(function (snap) {
      if (!snap.exists) return false;
      var d = snap.data() || {};
      var list = d.list;
      if (!Array.isArray(list)) return false;
      var by = {};
      (A.orders || []).forEach(function (o) { if (o && o.id) by[o.id] = o; });
      list.forEach(function (o) {
        if (!o || !o.id) return;
        var cur = by[o.id];
        if (!cur) by[o.id] = o;
        else {
          var a = String(cur.updatedAt || cur.at || "");
          var b = String(o.updatedAt || o.at || "");
          var merged = b >= a ? Object.assign({}, cur, o) : Object.assign({}, o, cur);
          if (cur.stockDeducted || o.stockDeducted) merged.stockDeducted = true;
          by[o.id] = merged;
        }
      });
      A.orders = Object.keys(by).map(function (k) { return by[k]; });
      A.orders.sort(function (a, b) { return String(b.at || "").localeCompare(String(a.at || "")); });
      A.orders.forEach(function (o) { o.status = A.normalizeStatus(o.status); });
      A._ordersFromCloud = true;
      A._ordersTotalCount = A.orders.length;
      if (A.settleOrderStock) A.settleOrderStock();
      if (A.saveOrders) A.saveOrders();
      if (A.updateOrdersBadge) A.updateOrdersBadge();
      return true;
    }).catch(function () { return false; });
  };

  A.pushOrdersCloud = function () {
    var database = db();
    var id = uid();
    if (!database || !id) return Promise.resolve(false);
    if (w.naqaIsAdminUid && !naqaIsAdminUid(id)) return Promise.resolve(false);
    var list = (A.orders || []).filter(function (o) {
      return o && o.id && !(o.source === "demo" || o.demo === true);
    }).slice(0, MAX).map(function (o) {
      return {
        id: String(o.id || ""),
        at: o.at || "",
        status: A.normalizeStatus(o.status),
        name: o.name || "",
        phone: o.phone || "",
        area: o.area || "",
        note: o.note || o.t || "",
        total: o.total != null ? Number(o.total) : null,
        payment: o.payment || o.pay || "",
        itemsText: o.itemsText || "",
        items: Array.isArray(o.items) ? o.items.slice(0, 40) : [],
        subtotal: o.subtotal != null ? Number(o.subtotal) : null,
        delivery: o.delivery != null ? Number(o.delivery) : null,
        codFee: o.codFee != null ? Number(o.codFee) : null,
        shipping: o.shipping != null ? Number(o.shipping) : null,
        vat: o.vat != null ? Number(o.vat) : null,
        vatRate: o.vatRate != null ? Number(o.vatRate) : null,
        stockDeducted: !!o.stockDeducted,
        paymentStatus: o.paymentStatus || "",
        updatedAt: o.updatedAt || o.at || new Date().toISOString()
      };
    }).filter(function (o) { return o.id; });
    return database.collection(DOC.col).doc(DOC.id).set({
      list: list,
      updatedAt: Date.now(),
      updatedBy: id
    }, { merge: true }).then(function () { return true; }).catch(function () { return false; });
  };

  var _save = A.saveOrders;
  A.saveOrders = function () {
    if (_save) _save.apply(A, arguments);
    else {
      try {
        localStorage.setItem(A.ORDERS_KEY || "naqa_orders", JSON.stringify((A.orders || []).slice(0, MAX)));
      } catch (e) {}
    }
    /* debounce cloud push */
    clearTimeout(A._ordersCloudT);
    A._ordersCloudT = setTimeout(function () {
      A.pushOrdersCloud();
    }, 900);
  };

  A.importWhatsAppOrdersText = function (raw) {
    raw = String(raw || "").trim();
    if (!raw) return 0;
    var blocks = raw.split(/\n{2,}|──────+|══════+/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (blocks.length <= 1 && raw.indexOf("\n") >= 0) {
      /* single long paste — treat whole as one if looks like order */
      blocks = [raw];
    }
    var added = 0;
    var by = {};
    (A.orders || []).forEach(function (o) { if (o && o.id) by[o.id] = o; });
    blocks.forEach(function (block, i) {
      var name = "", phone = "", area = "", total = null, itemsText = block.slice(0, 800);
      var m;
      m = block.match(/(?:الاسم|اسم|name)\s*[:：\-]\s*(.+)/i);
      if (m) name = m[1].trim().split(/\n/)[0].slice(0, 80);
      m = block.match(/(?:جوال|هاتف|phone|واتساب|wa)\s*[:：\-]\s*([+\d][\d\s\-]{6,})/i);
      if (m) phone = m[1].replace(/\s+/g, "").slice(0, 20);
      if (!phone) {
        m = block.match(/(?:\+?968)?[79]\d{7,8}/);
        if (m) phone = m[0].replace(/\s+/g, "");
      }
      m = block.match(/(?:المنطقة|منطقة|area|الولاية)\s*[:：\-]\s*(.+)/i);
      if (m) area = m[1].trim().split(/\n/)[0].slice(0, 80);
      m = block.match(/(?:الإجمالي|المجموع|total)\s*[:：\-]\s*([\d.]+)/i);
      if (m) total = Number(m[1]);
      if (!name && !phone) return;
      var id = "WA-" + Date.now().toString(36) + "-" + i + "-" + Math.random().toString(36).slice(2, 6);
      by[id] = {
        id: id,
        at: new Date().toISOString(),
        status: "new",
        name: name || (A.lang === "en" ? "WhatsApp customer" : "عميل واتساب"),
        phone: phone,
        area: area,
        total: total,
        itemsText: itemsText,
        items: [],
        source: "whatsapp-paste"
      };
      added++;
    });
    if (!added) return 0;
    A.orders = Object.keys(by).map(function (k) { return by[k]; });
    A.orders.sort(function (a, b) { return String(b.at || "").localeCompare(String(a.at || "")); });
    if (A.saveOrders) A.saveOrders();
    return added;
  };
})(window);
