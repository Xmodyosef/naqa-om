(function (w) {
  var A = w.NaqaAdmin;
  var TABS = ["home", "orders", "products", "reviews", "customers", "finance", "settings"];

  A.setTab = function (tab) {
    if (TABS.indexOf(tab) < 0) tab = "home";
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
    try { history.replaceState(null, "", "#/" + tab); } catch (e) {}
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
    var hash = (location.hash || "").replace(/^#\/?/, "");
    var start = TABS.indexOf(hash) >= 0 ? hash : "home";
    A.setTab(start);
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
    A.setTab(b.getAttribute("data-tab"));
  });

  var q = document.getElementById("q");
  if (q) q.addEventListener("input", function (e) { A.paintList(e.target.value.trim()); });

  var list = document.getElementById("list");
  if (list) list.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-open]");
    if (!btn) return;
    A.openEdit(+btn.getAttribute("data-open"));
  });

  var ordersList = document.getElementById("ordersList");
  if (ordersList) ordersList.addEventListener("click", function (e) {
    var del = e.target.closest("[data-del]");
    if (del) {
      var idDel = del.getAttribute("data-del");
      A.orders = A.orders.filter(function (o) { return String(o.id) !== String(idDel); });
      A.saveOrders();
      A.paintOrders();
      A.setMsg("orderStatus", A.t("deleted") + " " + idDel);
      return;
    }
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
