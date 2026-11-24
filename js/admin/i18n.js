(function (w) {
  var A = w.NaqaAdmin = w.NaqaAdmin || {};
  A.I18N = A.I18N || {};
  A.lang = "ar";
  try { if (localStorage.getItem("naqa_admin_lang") === "en") A.lang = "en"; } catch (e) {}
  /* One language file only. Must stay a blocking script so document.write runs while the page is parsing. */
  document.write('<script src="js/admin/i18n/dict-' + A.lang + '.js?v=20261124fix15"><\/script>');
  A.t = function (k) {
    var pack = A.I18N[A.lang] || A.I18N.ar;
    return pack[k] != null ? pack[k] : (A.I18N.ar[k] || k);
  };
  A.statusLabel = function (k) { return A.t("st_" + k); };
  A.payState = function (o) {
    if (!o) return "cod";
    if (o.paymentStatus === "confirmed") return "confirmed";
    if (o.payment === "transfer" || o.payment === "paid") return "pending";
    return "cod";
  };
  A.payText = function (o) {
    var s = A.payState(o);
    if (s === "confirmed") return A.t("payConfirmed");
    if (s === "pending") return A.t("payPending");
    return A.t("payCod");
  };
  A.confirmPayment = function (id) {
    A.orders.forEach(function (o) {
      if (String(o.id) !== String(id)) return;
      if (A.payState(o) !== "pending") return;
      var sub = Number(o.subtotal);
      if (!isFinite(sub)) sub = Number(o.total) || 0;
      o.payment = "transfer";
      o.paid = true;
      o.paymentStatus = "confirmed";
      o.delivery = 0;
      o.codFee = 0;
      o.shipping = 0;
      o.total = sub;
      o.vat = Math.round(sub * 0.05 / 1.05 * 1000) / 1000;
      o.paymentLabel = A.payText(o);
    });
    A.saveOrders();
  };
  /* —— stock (central via published overrides) —— */
  A.applyStockDelta = function (order, sign) {
    if (!order || !Array.isArray(order.items)) return;
    order.items.forEach(function (it) {
      var id = it.id;
      if (id == null) return;
      var p = A.products.find(function (x) { return String(x.id) === String(id); });
      if (!p) return;
      var m = A.merged(p);
      var base = m.stock;
      if (base === "" || base == null || isNaN(Number(base))) return;
      var next = Math.max(0, Number(base) + sign * (Number(it.qty) || 0));
      var o = A.overrides[id] || A.overrides[String(id)] || {};
      o = Object.assign({}, o, { stock: next });
      A.overrides[id] = o;
      A.overrides[String(id)] = o;
    });
    try { localStorage.setItem(A.KEY, JSON.stringify(A.overrides)); } catch (e) {}
  };
  A.deductStockForOrder = function (order) {
    if (!order || order.stockDeducted) return;
    A.applyStockDelta(order, -1);
    order.stockDeducted = true;
  };
  A.restoreStockForOrder = function (order) {
    if (!order || !order.stockDeducted) return;
    A.applyStockDelta(order, +1);
    order.stockDeducted = false;
  };
  /* —— auth —— */
  A.PIN_HASH = "naqa_admin_pin_hash";
  A.PIN_FAIL = "naqa_admin_pin_fail";
  A.SESSION = "naqa_admin_session";
  A.MAX_FAIL = 5;
  A.LOCK_MS = 15 * 60 * 1000;
  A.SESSION_MS = 30 * 60 * 1000;
  A.hashPin = function (pin) {
    if (w.crypto && w.crypto.subtle) {
      var data = new TextEncoder().encode("naqa-om|v1|" + String(pin));
      return w.crypto.subtle.digest("SHA-256", data).then(function (buf) {
        return Array.from(new Uint8Array(buf)).map(function (b) {
          return b.toString(16).padStart(2, "0");
        }).join("");
      });
    }
    /* fallback for very old webviews */
    var s = "naqa-om|v1|" + String(pin), h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Promise.resolve("x" + Math.abs(h).toString(16));
  };
  A.lockInfo = function () {
    try {
      var raw = JSON.parse(localStorage.getItem(A.PIN_FAIL) || "null");
      if (!raw) return { fails: 0, until: 0 };
      return { fails: Number(raw.fails) || 0, until: Number(raw.until) || 0 };
    } catch (e) { return { fails: 0, until: 0 }; }
  };
  A.setLockInfo = function (fails, until) {
    localStorage.setItem(A.PIN_FAIL, JSON.stringify({ fails: fails, until: until || 0 }));
  };
  A.isLocked = function () {
    var info = A.lockInfo();
    return info.until && Date.now() < info.until;
  };
  A.touchSession = function () {
    localStorage.setItem(A.SESSION, String(Date.now()));
  };
  A.sessionOk = function () {
    var t = Number(localStorage.getItem(A.SESSION) || 0);
    return t && (Date.now() - t) < A.SESSION_MS;
  };
  A.clearSession = function () {
    localStorage.removeItem(A.SESSION);
  };
  A.applyChrome = function () {
    var en = A.lang === "en";
    document.documentElement.lang = en ? "en" : "ar";
    document.documentElement.dir = en ? "ltr" : "rtl";
    document.title = A.t("title");
    var h1 = document.querySelector(".admin-top h1");
    if (h1) h1.textContent = A.t("title");
    document.querySelectorAll("#tabs button").forEach(function (b) {
      var k = b.getAttribute("data-tab");
      if (k) b.textContent = A.t("tab_" + k);
    });
    if (A.syncOrdersTab) A.syncOrdersTab();
    var pinFirst = !localStorage.getItem(A.PIN_HASH) && !localStorage.getItem(A.PIN);
    var lead = document.getElementById("pinLead");
    if (lead) lead.textContent = pinFirst ? A.t("pinFirstLead") : A.t("pinLead");
    var note = document.getElementById("pinNote");
    if (note) note.textContent = A.t("pinNote");
    var pinInput = document.getElementById("pinInput");
    if (pinInput) pinInput.placeholder = A.t("pinPh");
    var pinGo = document.getElementById("pinGo");
    if (pinGo) pinGo.textContent = pinFirst ? A.t("pinFirstBtn") : A.t("pinGo");
    var save = document.getElementById("saveLocal");
    if (save) save.textContent = A.t("saveLocal");
    var pub = document.getElementById("publish");
    if (pub) pub.textContent = A.t("publish");
    var langBtn = document.getElementById("adminLang");
    if (langBtn) langBtn.textContent = A.t("langBtn");
    var store = document.querySelector(".admin-top a.store");
    if (store) store.textContent = A.t("storeLink");
    var q = document.getElementById("q");
    if (q) q.placeholder = A.t("p_search");
    var vatBar = document.getElementById("vatAdminBar");
    if (vatBar) vatBar.textContent = A.t("vatBar");
    var pNote = document.getElementById("productsListNote");
    if (pNote) pNote.textContent = A.t("p_listNote");
    var oLead = document.getElementById("ordersLead");
    if (oLead) oLead.textContent = A.t("o_lead");
    var oWa = document.getElementById("waOrders");
    if (oWa) oWa.textContent = A.t("o_waOpen");
    var oTitle = document.querySelector("#ordersTab .wa-box strong");
    if (oTitle) oTitle.textContent = A.t("o_tab");
    // refresh order tool buttons if already built
    var ca = document.getElementById("copyAllOrders");
    if (ca) ca.textContent = A.t("o_copyAll");
    var cn = document.getElementById("copyNewOrders");
    if (cn) cn.textContent = A.t("o_copyNew");
    var ow = document.getElementById("waOrdersReport");
    if (ow) ow.textContent = A.t("o_waSum");
  };
  A.ensureLang = function (lang, done) {
    if (A.I18N && A.I18N[lang]) { done(); return; }
    var s = document.createElement("script");
    s.src = "js/admin/i18n/dict-" + lang + ".js?v=20261124fix15";
    s.onload = function () { done(); };
    s.onerror = function () { done(); };
    document.head.appendChild(s);
  };
  A.setLang = function (next) {
    A.lang = next === "en" ? "en" : "ar";
    localStorage.setItem("naqa_admin_lang", A.lang);
    A.ensureLang(A.lang, function () {
      A.applyChrome();
      if (document.getElementById("tools") && !document.getElementById("tools").hidden && A.setTab) {
        var on = document.querySelector("#tabs button.on");
        A.setTab(on ? on.getAttribute("data-tab") : "home");
      }
    });
  };
  /* token stays on this device so product save can publish */
})(window);
