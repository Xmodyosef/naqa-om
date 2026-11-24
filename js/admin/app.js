(function (w) {
  var A = w.NaqaAdmin;
  var TABS = ["home", "orders", "products", "reviews", "customers", "finance", "settings"];

  A.setTab = function (tab, opts) {
    opts = opts || {};
    if (TABS.indexOf(tab) < 0) tab = "home";
    /* Leaving a nested edit: drop it without fighting browser history */
    if (A.editingId != null && tab !== "products") {
      A._editNavPushed = false;
      A.editingId = null;
      A._editImgs = [];
      var ev = document.getElementById("editView");
      var lv = document.getElementById("listView");
      if (ev) { ev.hidden = true; ev.innerHTML = ""; }
      if (lv) lv.hidden = false;
      document.body.classList.remove("naqa-editing");
      if (window.naqaScrollLock) try { naqaScrollLock.unlock(); } catch (e) {}
    }
    document.querySelectorAll("#tabs button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-tab") === tab);
    });
    TABS.forEach(function (t) {
      var el = document.getElementById(t + "Tab");
      if (el) el.hidden = t !== tab;
    });
    if (tab === "home" && A.paintDashboard) A.paintDashboard();
    if (tab === "orders" && A.paintOrders) A.paintOrders();
    if (tab === "products" && A.paintList) A.paintList(document.getElementById("q") ? document.getElementById("q").value.trim() : "");
    if (tab === "reviews" && A.paintReviews) A.paintReviews();
    if (tab === "customers" && A.paintCustomers) A.paintCustomers();
    if (tab === "finance" && A.paintFinance) A.paintFinance();
    if (tab === "settings" && A.paintSettings) A.paintSettings();
    if (!opts.fromPop && !opts.skipHash) {
      try { history.replaceState({ naqa: "tab", tab: tab }, "", "#/" + tab); } catch (e) {}
    }
  };

  A.applyRoute = function (raw) {
    raw = String(raw || (location.hash || "").replace(/^#\/?/, "") || "");
    /* products/edit/123 */
    var editMatch = raw.match(/^products\/edit\/([^/]+)/);
    if (editMatch) {
      var id = editMatch[1];
      if (TABS.indexOf("products") >= 0) {
        /* show products tab chrome without wiping edit via paintList */
        document.querySelectorAll("#tabs button").forEach(function (b) {
          b.classList.toggle("on", b.getAttribute("data-tab") === "products");
        });
        TABS.forEach(function (t) {
          var el = document.getElementById(t + "Tab");
          if (el) el.hidden = t !== "products";
        });
        if (A.openEdit) A.openEdit(isNaN(+id) ? id : +id, { fromPop: true });
        return;
      }
    }
    var tab = raw.split("/")[0];
    if (TABS.indexOf(tab) < 0) tab = "home";
    A.setTab(tab, { fromPop: true, skipHash: true });
  };

  A.openAdmin = function () {
    A.touchSession();
    document.getElementById("pin").hidden = true;
    document.getElementById("tools").hidden = false;
    document.getElementById("tabs").hidden = false;
    document.getElementById("savebar").hidden = false;
    var wa = document.getElementById("waOrders");
    if (wa) wa.href = "https://wa.me/" + (w.WA_NUMBER || "96879088349");
    A.loadRemoteOrders();
    A.applyRoute((location.hash || "").replace(/^#\/?/, ""));
  };

  document.getElementById("pinGo").onclick = function () {
    var typed = document.getElementById("pinInput").value.trim();
    var msg = document.getElementById("pinMsg");
    if (!typed || typed.length < 4) { msg.textContent = A.t("pinShort"); return; }
    if (A.isLocked && A.isLocked()) { msg.textContent = A.t("pinLocked"); return; }
    var plain = localStorage.getItem(A.PIN);
    var hashHave = localStorage.getItem(A.PIN_HASH);
    function ok() {
      A.setLockInfo(0, 0);
      A.touchSession();
      A.openAdmin();
    }
    function fail() {
      var info = A.lockInfo();
      var fails = (info.fails || 0) + 1;
      var until = 0;
      if (fails >= A.MAX_FAIL) {
        until = Date.now() + A.LOCK_MS;
        fails = 0;
        msg.textContent = A.t("pinLocked");
      } else {
        msg.textContent = A.t("pinBad") + " · " + (A.MAX_FAIL - fails) + " " + A.t("pinLeft");
      }
      A.setLockInfo(fails, until);
    }
    if (!hashHave && !plain) {
      if (!confirm(A.t("pinFirst"))) { msg.textContent = A.t("pinFirstNo"); return; }
      A.hashPin(typed).then(function (h) {
        localStorage.setItem(A.PIN_HASH, h);
        localStorage.removeItem(A.PIN);
        ok();
      });
      return;
    }
    A.hashPin(typed).then(function (h) {
      if (hashHave && h === hashHave) { ok(); return; }
      if (!hashHave && plain && typed === plain) {
        localStorage.setItem(A.PIN_HASH, h);
        localStorage.removeItem(A.PIN);
        ok();
        return;
      }
      fail();
    });
  };

  document.getElementById("tabs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-tab]");
    if (!b) return;
    var tab = b.getAttribute("data-tab");
    if (tab === "products" && A.editingId != null) {
      A.closeEdit(false);
      return;
    }
    A.setTab(tab);
  });

  /* Browser back / edge-swipe: leave edit → list; else apply hash tab */
  window.addEventListener("popstate", function () {
    if (A.editingId != null || (document.getElementById("editView") && !document.getElementById("editView").hidden)) {
      A._editNavPushed = false;
      if (A.closeEdit) A.closeEdit(true);
      else if (A.paintList) A.paintList(document.getElementById("q") ? document.getElementById("q").value.trim() : "");
      try { history.replaceState({ naqa: "tab", tab: "products" }, "", "#/products"); } catch (e) {}
      return;
    }
    A.applyRoute((location.hash || "").replace(/^#\/?/, ""));
  });

  var q = document.getElementById("q");
  if (q) q.addEventListener("input", function (e) { A.paintList(e.target.value.trim()); });

  var list = document.getElementById("list");
  if (list) list.addEventListener("click", function (e) {
    var hide = e.target.closest("[data-hide]");
    if (hide) {
      e.preventDefault();
      e.stopPropagation();
      if (A.toggleHide) A.toggleHide(hide.getAttribute("data-hide"));
      return;
    }
    var btn = e.target.closest("[data-open]");
    if (!btn) return;
    A.openEdit(+btn.getAttribute("data-open"));
  });

  var ordersList = document.getElementById("ordersList");
  if (ordersList) ordersList.addEventListener("click", function (e) {
    var payBtn = e.target.closest("[data-pay]");
    if (payBtn) {
      A.confirmPayment(payBtn.getAttribute("data-pay"));
      A.paintOrders();
      A.setMsg("orderStatus", A.t("confirmedMsg"));
      return;
    }
    var st = e.target.closest("[data-st]");
    if (st) {
      var id = st.getAttribute("data-oid");
      var next = st.getAttribute("data-st");
      if (next === "cancel") {
        if (!confirm(A.t("cancelConfirm") + "\n" + id)) return;
      }
      A.orders.forEach(function (o) {
        if (String(o.id) !== String(id)) return;
        var prev = A.normalizeStatus(o.status);
        o.status = next;
        if (next === "cancel" && prev !== "cancel") A.restoreStockForOrder(o);
        else if (next !== "cancel" && prev === "cancel") A.deductStockForOrder(o);
        else if (next !== "cancel" && !o.stockDeducted && (next === "prep" || next === "ship" || next === "delivered" || next === "new")) {
          if (next === "prep" || next === "ship" || next === "delivered") A.deductStockForOrder(o);
        }
      });
      A.saveOrders();
      A.paintOrders();
      A.setMsg("orderStatus", A.t("statusTo") + " " + id + " → " + (A.statusLabel(next) || next));
    }
  });

  var statusBarEl = document.getElementById("statusBar");
  if (statusBarEl) statusBarEl.addEventListener("click", function (e) {
    var f = e.target.closest("[data-filter]");
    if (!f) return;
    A.orderFilter = f.getAttribute("data-filter") || "all";
    A.paintOrders();
  });

  document.getElementById("saveLocal").onclick = function () { A.saveLocal(); };
  document.getElementById("publish").onclick = function () { A.publish(); };
  var langBtn = document.getElementById("adminLang");
  if (langBtn) langBtn.onclick = function () { A.setLang(A.lang === "en" ? "ar" : "en"); };
  if (A.applyChrome) A.applyChrome();
  /* session heartbeat + idle lock */
  ["click", "keydown", "touchstart"].forEach(function (ev) {
    document.addEventListener(ev, function () {
      if (document.getElementById("tools") && !document.getElementById("tools").hidden) A.touchSession();
    }, { passive: true });
  });
  setInterval(function () {
    if (document.getElementById("tools") && !document.getElementById("tools").hidden && !A.sessionOk()) {
      /* Firebase session still valid → refresh local idle timer */
      if (A.fbUser && window.firebase && firebase.auth && firebase.auth().currentUser) {
        A.touchSession();
        return;
      }
      A.clearSession();
      document.getElementById("tools").hidden = true;
      document.getElementById("tabs").hidden = true;
      document.getElementById("savebar").hidden = true;
      document.getElementById("pin").hidden = false;
      var msg = document.getElementById("pinMsg");
      if (msg) msg.textContent = A.t("pinLead");
    }
  }, 60000);
  /* auto-open if session still valid */
  if (A.sessionOk() && localStorage.getItem(A.PIN_HASH || "naqa_admin_pin_hash") || localStorage.getItem(A.PIN)) {
    /* only auto if not locked */
    if (!A.isLocked()) {
      /* require hash or pin exists */
      if (localStorage.getItem(A.PIN_HASH) || localStorage.getItem(A.PIN)) {
        /* stay on pin for safety on shared devices — do not auto-open */
      }
    }
  }
})(window);
