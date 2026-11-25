/* Shared state + helpers for Naqa admin modules */
(function (w) {
  var A = w.NaqaAdmin = w.NaqaAdmin || {};
  A.products = (w.NAQA_PRODUCTS || []).map(function (p) { return Object.assign({ imgs: [] }, p); });
  A.KEY = "naqa_overrides";
  A.PIN = "naqa_admin_pin";
  A.TOKEN = "naqa_gh_token"; /* legacy key name only — do not store secrets */

  /** P1: true only when Firebase session matches A.fbUser */
  A.isAuthed = function () {
    try {
      if (!A.fbUser) return false;
      if (!w.firebase || !firebase.auth) return false;
      var u = firebase.auth().currentUser;
      return !!(u && u.uid && A.fbUser.uid && u.uid === A.fbUser.uid);
    } catch (e) {
      return false;
    }
  };
  /** P1: block UI/write if not signed in */
  A.requireAuth = function (msgId) {
    if (A.isAuthed()) return true;
    try {
      document.body.classList.add("naqa-locked");
      document.body.classList.remove("naqa-open");
      var tools = document.getElementById("tools");
      if (tools) tools.hidden = true;
      var pin = document.getElementById("pin");
      if (pin) pin.hidden = false;
    } catch (e) {}
    if (msgId && A.setMsg) {
      A.setMsg(msgId, A.lang === "en" ? "Sign in required." : "يلزم تسجيل الدخول.");
    }
    return false;
  };
  /** P1/P3: GitHub token publish disabled — use Firestore only */
  A.setMsg = function (id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text || "";
  };
  A.copyText = function (text, msgId) {
    text = String(text || "");
    function ok() { A.setMsg(msgId || "orderStatus", A.t("copied")); }
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
      var st = A.statusLabel(A.normalizeStatus(o.status)) || o.status;
      lines.push((i + 1) + ") " + (o.id || "") + " · " + st);
      lines.push("   " + (o.name || "—") + " · " + (o.phone || "—") + " · " + (o.area || "—"));
      lines.push("   المجموع: " + (o.total != null ? Number(o.total).toFixed(3) : "—") + " ر.ع (شامل الضريبة ٥٪)");
      var vatN = o.vat != null ? Number(o.vat) : (o.total != null ? Number(o.total) * 0.05 / 1.05 : null);
      if (vatN != null && !isNaN(vatN)) lines.push("   منها ضريبة ٥٪: " + vatN.toFixed(3) + " ر.ع");
      lines.push("   " + A.t("payLine") + ": " + A.payText(o));
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
