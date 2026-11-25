(function (w) {
  var A = w.NaqaAdmin = w.NaqaAdmin || {};
  A.I18N = A.I18N || {};
  A.lang = "ar";
  try { if (localStorage.getItem("naqa_admin_lang") === "en") A.lang = "en"; } catch (e) {}
  /* Dictionaries: dict-ar.js + dict-en.js loaded as defer scripts in admin.html (before this file). */
  A.t = function (k) {
    try {
      var packs = A.I18N || {};
      var pack = packs[A.lang] || packs.ar || {};
      if (pack && pack[k] != null) return pack[k];
      if (packs.ar && packs.ar[k] != null) return packs.ar[k];
    } catch (e) {}
    return k;
  };
  A.statusLabel = function (k) { return A.t("st_" + k); };
  A.payState = function (o) {
    if (!o) return "cod";
    if (o.paymentStatus === "confirmed") return "confirmed";
    if (o.payment === "transfer" || o.payment === "paid") return "pending";
    return "cod";
  };
  A.isOrderPaid = function (o) {
    if (!o) return false;
    if (o.paymentStatus === "confirmed" || o.paid === true) return true;
    return false;
  };
  A.paidLabel = function (o) {
    return A.isOrderPaid(o) ? (A.t("paidYes") || "مدفوع") : (A.t("paidNo") || "غير مدفوع");
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
    if (!A.products || !A.products.length) return;
    A.applyStockDelta(order, -1);
    order.stockDeducted = true;
  };
  A.settleOrderStock = function () {
    if (!A.products || !A.products.length) return;
    var changed = false;
    (A.orders || []).forEach(function (o) {
      var st = A.normalizeStatus(o.status);
      if (!o.stockDeducted && (st === "prep" || st === "ship" || st === "delivered")) {
        A.deductStockForOrder(o);
        if (o.stockDeducted) changed = true;
      }
    });
    if (changed) {
      if (A.saveOrders) A.saveOrders();
      try { if (A.syncOverridesCloud) A.syncOverridesCloud(); } catch (e) {}
      if (A.paintList && A.currentTab === "products") A.paintList("");
      if (A.paintDashboard && A.currentTab === "home") A.paintDashboard();
      if (A.updateOrdersBadge) A.updateOrdersBadge();
    }
  };
  A.restoreStockForOrder = function (order) {
    if (!order || !order.stockDeducted) return;
    A.applyStockDelta(order, +1);
    order.stockDeducted = false;
  };
  /* —— session (Firebase login) —— */
  A.SESSION = "naqa_admin_session";
  A.SESSION_MS = 30 * 60 * 1000;
  A.touchSession = function () {
    try { localStorage.setItem(A.SESSION, String(Date.now())); } catch (e) {}
  };
  A.sessionOk = function () {
    var t = Number(localStorage.getItem(A.SESSION) || 0);
    return t && (Date.now() - t) < A.SESSION_MS;
  };
  A.clearSession = function () {
    try { localStorage.removeItem(A.SESSION); } catch (e) {}
    try {
      sessionStorage.removeItem("naqa_gh_token");
      localStorage.removeItem("naqa_gh_token");
      if (A.TOKEN) {
        sessionStorage.removeItem(A.TOKEN);
        localStorage.removeItem(A.TOKEN);
      }
    } catch (e) {}
  };
  A.applyChrome = function () {
    var en = A.lang === "en";
    document.documentElement.lang = en ? "en" : "ar";
    document.documentElement.dir = en ? "ltr" : "rtl";
    document.title = A.t("title");
    var h1 = document.querySelector(".admin-top h1");
    if (h1) h1.textContent = A.t("title");
    document.querySelectorAll("[data-i18n]").forEach(function (b) {
      var k = b.getAttribute("data-i18n");
      if (k) b.textContent = A.t(k);
    });
    if (A.syncOrdersTab) A.syncOrdersTab();
    var lead = document.getElementById("pinLead");
    var note = document.getElementById("pinNote");
    if (lead) lead.textContent = A.t("fb_welcome");
    if (note) note.textContent = A.t("fb_welcomeNote");
    var langBtn = document.getElementById("adminLang");
    if (langBtn) langBtn.textContent = A.t("langBtn");
    var store = document.querySelector(".admin-top a.store");
    if (store) store.textContent = A.t("storeLink");
    if (A.fbApplyLabels) A.fbApplyLabels();
    /* product search removed */
    var gBtn = document.getElementById("globalSearchBtn");
    if (gBtn) { gBtn.textContent = "⌕"; gBtn.setAttribute("aria-label", A.lang === "en" ? "Search" : "بحث"); }
    if (A.syncSearchPlaceholder) A.syncSearchPlaceholder();

    var oLead = document.getElementById("ordersLead");
    if (oLead) {
      var lead = A.t("o_lead") || "";
      oLead.textContent = lead;
      oLead.hidden = !lead;
    }
    var oWa = document.getElementById("waOrders");
    if (oWa) {
      var waTxt = A.t("o_waOpen") || "";
      oWa.textContent = waTxt;
      oWa.hidden = !waTxt;
    }
    var pNote = document.getElementById("productsListNote");
    if (pNote) {
      var pn = A.t("p_listNote") || "";
      pNote.textContent = pn;
      pNote.hidden = !pn;
    }
    var addBtn = document.getElementById("addProductBtn");
    if (addBtn) addBtn.textContent = A.t("p_add");

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
    s.src = "js/admin/i18n/dict-" + lang + ".js?v=20261125rv6";
    s.onload = function () { done(); };
    s.onerror = function () { done(); };
    document.head.appendChild(s);
  };
  A.setLang = function (next) {
    A.lang = next === "en" ? "en" : "ar";
    localStorage.setItem("naqa_admin_lang", A.lang);
    A.ensureLang(A.lang, function () {
      A.applyChrome();
      var editingId = A.editingId;
      if (document.getElementById("tools") && !document.getElementById("tools").hidden && A.setTab) {
        if (A.go) A.go(A.currentTab || "home", A.currentSub || (A.defaultSub ? A.defaultSub(A.currentTab || "home") : ""), { fromPop: true, keepPage: true, page: A.productPage });
        else if (A.setTab) A.setTab(A.currentTab || "home");
      }
      /* re-open product edit so image/save UI is fully AR or EN */
      if (editingId != null && A.openEdit) {
        try { A.openEdit(editingId, { fromPop: true }); } catch (e) {}
      }
    });
  };
  /* token stays on this device so product save can publish */
})(window);
