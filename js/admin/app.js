(function (w) {
  var A = w.NaqaAdmin;
  var TABS = ["home", "orders", "products", "reviews", "customers", "finance", "settings"];

  A.ORDER_SUBS = ["new", "prep", "ship", "delivered", "cancel"];
  A.currentTab = A.currentTab || "home";
  A.currentSub = A.currentSub || "";
  A.productView = A.productView || "all";
  A.productPage = A.productPage || 1;

  A.defaultSub = function (tab) {
    if (tab === "orders") return "all";
    if (tab === "products") return "all";
    if (tab === "settings") return "general";
    if (tab === "home") return "";
    return "all";
  };

  /* Page chips (Salla-style): options open in the page, not under the side button */
  A.fillPageSubNav = function () {
    var bar = document.getElementById("pageSubNav");
    if (!bar) return;
    var tab = A.currentTab || "home";
    var sub = A.currentSub || "";
    bar.innerHTML = "";
    bar.hidden = true;
    if (tab === "orders") {
      var scoped = (A.orders || []).filter(function (o) { return A.inDateRange(o.at); });
      var counts = { all: scoped.length };
      (A.STATUS_ORDER || A.ORDER_SUBS).forEach(function (k) { counts[k] = 0; });
      scoped.forEach(function (o) {
        var st = A.normalizeStatus(o.status);
        counts[st] = (counts[st] || 0) + 1;
      });
      var parts = [{ id: "all", label: A.t("all") }].concat((A.STATUS_ORDER || A.ORDER_SUBS).map(function (k) {
        return { id: k, label: A.statusLabel(k) };
      }));
      bar.innerHTML = parts.map(function (p) {
        var on = (A.orderFilter || sub || "all") === p.id;
        return '<button type="button" class="page-chip' + (on ? " on" : "") + '" data-page-tab="orders" data-page-sub="' + p.id + '" role="tab" aria-selected="' + (on ? "true" : "false") + '">'
          + '<span class="chip-dot" aria-hidden="true"></span>'
          + '<span>' + A.esc(p.label) + " (" + (counts[p.id] || 0) + ")</span></button>";
      }).join("");
      bar.hidden = false;
      return;
    }
    if (tab === "products" && A.editingId == null) {
      var chips = [
        { id: "all", label: A.t("sub_all") },
        { id: "shown", label: A.t("sub_shown") },
        { id: "hidden", label: A.t("sub_hidden") }
      ];
      bar.innerHTML = chips.map(function (p) {
        var on = (A.productView || sub || "all") === p.id;
        return '<button type="button" class="page-chip' + (on ? " on" : "") + '" data-page-tab="products" data-page-sub="' + p.id + '" role="tab" aria-selected="' + (on ? "true" : "false") + '">'
          + '<span class="chip-dot" aria-hidden="true"></span>'
          + '<span>' + A.esc(p.label) + "</span></button>";
      }).join("");
      bar.hidden = false;
      return;
    }
  };


  A.updateOrdersBadge = function () {
    var el = document.getElementById("ordersBadge");
    if (!el) return;
    var n = 0;
    try {
      (A.orders || []).forEach(function (o) {
        if (A.normalizeStatus(o.status) === "new") n++;
      });
    } catch (e) {}
    if (n > 0) {
      el.hidden = false;
      el.textContent = n > 99 ? "99+" : String(n);
    } else {
      el.hidden = true;
      el.textContent = "0";
    }
  };

  A.syncNav = function () {
    var tab = A.currentTab || "home";
    var sub = A.currentSub || "";
    document.querySelectorAll("#sideNav .side-main").forEach(function (b) {
      var bt = b.getAttribute("data-tab");
      var grouped = !!b.closest(".side-group");
      var on = bt === tab && !grouped;
      b.classList.toggle("on", on);
      if (on) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
      if (grouped) b.setAttribute("aria-expanded", bt === tab ? "true" : "false");
    });
    document.querySelectorAll("#sideNav .side-group").forEach(function (g) {
      var gt = g.getAttribute("data-group");
      var open = gt === tab;
      g.classList.toggle("open", open);
      g.querySelectorAll(".side-sub").forEach(function (s) {
        var on = open && s.getAttribute("data-sub") === (sub || A.defaultSub(gt));
        s.classList.toggle("on", on);
        if (on) s.setAttribute("aria-current", "page");
        else s.removeAttribute("aria-current");
      });
      g.classList.toggle("has-active-child", !!g.querySelector(".side-sub.on"));
    });
    A.fillPageSubNav();
    if (A.updateOrdersBadge) A.updateOrdersBadge();
  };

  A.sectionHash = function () {
    var tab = A.currentTab || "home";
    if (tab === "orders") return "#/orders/" + (A.currentSub || "all");
    if (tab === "products") {
      if (A.editingId != null) return "#/products/edit/" + A.editingId;
      return "#/products/" + (A.productView || "all") + "/" + (A.productPage || 1);
    }
    if (tab === "home") return "#/home";
    return "#/" + tab + "/" + (A.currentSub || A.defaultSub(tab));
  };

  A.setTab = function (tab, opts) {
    opts = opts || {};
    A.go(tab, opts.sub || A.currentSub || A.defaultSub(tab), opts);
  };

  A.go = function (tab, sub, opts) {
    opts = opts || {};
    if (TABS.indexOf(tab) < 0) tab = "home";
    if (tab === "orders") {
      if (sub !== "all" && A.ORDER_SUBS.indexOf(sub) < 0) sub = "all";
      A.orderFilter = sub;
    } else if (tab === "products") {
      if (sub !== "all" && sub !== "shown" && sub !== "hidden") sub = "all";
      if (A.productView !== sub && !opts.keepPage) A.productPage = opts.page || 1;
      A.productView = sub;
      if (opts.page) A.productPage = opts.page;
    } else if (tab === "home") {
      sub = "";
    } else if (!sub) {
      sub = A.defaultSub(tab);
    }
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
    A.currentTab = tab;
    A.currentSub = sub;
    A.syncNav();
    TABS.forEach(function (name) {
      var el = document.getElementById(name + "Tab");
      if (el) el.hidden = name !== tab;
    });
    if (tab === "home" && A.paintDashboard) A.paintDashboard();
    if (tab === "orders" && A.paintOrders) A.paintOrders();
    if (tab === "products" && A.paintList && A.editingId == null) {
      A.paintList(document.getElementById("q") ? document.getElementById("q").value.trim() : "");
    }
    if (tab === "reviews" && A.paintReviews) A.paintReviews();
    if (tab === "customers" && A.paintCustomers) A.paintCustomers();
    if (tab === "finance" && A.paintFinance) A.paintFinance();
    if (tab === "settings" && A.paintSettings) A.paintSettings();
    if (!opts.fromPop) {
      var hash = A.sectionHash();
      try {
        if (opts.push && location.hash !== hash) history.pushState({ naqa: "sec", tab: tab, sub: sub, page: A.productPage }, "", hash);
        else history.replaceState({ naqa: "sec", tab: tab, sub: sub, page: A.productPage }, "", hash);
      } catch (e) {}
    }
  };

  A.applyRoute = function (raw) {
    raw = String(raw || (location.hash || "").replace(/^#\/?/, "") || "");
    var editMatch = raw.match(/^products\/edit\/([^/]+)/);
    if (editMatch) {
      var id = editMatch[1];
      A.currentTab = "products";
      A.syncNav();
      TABS.forEach(function (name) {
        var el = document.getElementById(name + "Tab");
        if (el) el.hidden = name !== "products";
      });
      if (A.openEdit) A.openEdit(isNaN(+id) ? id : +id, { fromPop: true });
      return;
    }
    var parts = raw.split("/").filter(Boolean);
    var tab = parts[0] || "home";
    if (TABS.indexOf(tab) < 0) tab = "home";
    var sub = parts[1] || A.defaultSub(tab);
    var page = 1;
    if (tab === "products") {
      if (sub !== "all" && sub !== "shown" && sub !== "hidden") sub = "all";
      page = parseInt(parts[2], 10) || 1;
    }
    A.go(tab, sub, { fromPop: true, page: page, keepPage: true });
  };

  A.openAdmin = function () {
    A.touchSession();
    try {
      document.body.classList.remove("naqa-locked");
      document.body.classList.add("naqa-open");
    } catch (e) {}
    document.getElementById("pin").hidden = true;
    document.getElementById("tools").hidden = false;
    var tabs = document.getElementById("tabs");
    if (tabs) tabs.hidden = false;
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

  var sideNav = document.getElementById("sideNav");
  if (sideNav) sideNav.addEventListener("click", function (e) {
    var subBtn = e.target.closest(".side-sub[data-sub]");
    if (subBtn) {
      var tabS = subBtn.getAttribute("data-tab");
      var subS = subBtn.getAttribute("data-sub");
      if (tabS === "products" && A.editingId != null && A.closeEdit) A.closeEdit(true);
      var sameS = tabS === A.currentTab && subS === A.currentSub;
      if (tabS === "products" && subS !== A.productView) A.productPage = 1;
      A.go(tabS, subS, { push: !sameS, page: tabS === "products" ? A.productPage : undefined });
      return;
    }
    var b = e.target.closest(".side-main[data-tab]");
    if (!b) return;
    var tab = b.getAttribute("data-tab");
    var sub = A.defaultSub(tab);
    if (tab === "products" && A.editingId != null) {
      A.closeEdit(true);
    }
    var same = tab === A.currentTab;
    if (tab === "products") A.productPage = 1;
    A.go(tab, sub, { push: !same, page: 1 });
  });

  A.addProduct = function () {
    A.go("products", A.productView || "all", { push: true });
    var q = document.getElementById("q");
    if (q) {
      q.focus();
      try { q.scrollIntoView({ block: "nearest" }); } catch (e) {}
    }
  };

  A.runGlobalSearch = function () {
    var input = document.getElementById("globalSearch");
    var scope = document.getElementById("searchScope");
    var q = input ? input.value.trim() : "";
    var which = scope ? scope.value : "orders";
    if (which === "products") {
      A.orderQuery = "";
      var box = document.getElementById("q");
      if (box) box.value = q;
      A.productPage = 1;
      A.go("products", A.productView || "all", { push: true, page: 1 });
      if (A.paintList) A.paintList(q);
      return;
    }
    A.orderQuery = q;
    A.go("orders", A.orderFilter || A.currentSub || "all", { push: true });
    if (A.paintOrders) A.paintOrders();
  };

  var gBtn = document.getElementById("globalSearchBtn");
  var gInput = document.getElementById("globalSearch");
  var addBtn = document.getElementById("addProductBtn");
  if (gBtn) gBtn.addEventListener("click", function () { A.runGlobalSearch(); });
  if (gInput) gInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); A.runGlobalSearch(); }
  });
  if (addBtn) addBtn.addEventListener("click", function () { A.addProduct(); });


  var pageSub = document.getElementById("pageSubNav");
  if (pageSub) pageSub.addEventListener("click", function (e) {
    var b = e.target.closest("[data-page-sub]");
    if (!b) return;
    var tab = b.getAttribute("data-page-tab") || A.currentTab;
    var sub = b.getAttribute("data-page-sub");
    var same = tab === A.currentTab && sub === A.currentSub;
    if (tab === "products" && sub !== A.productView) A.productPage = 1;
    A.go(tab, sub, { push: !same, page: (tab === "products" && sub !== A.productView) ? 1 : A.productPage });
  });

  /* Browser back / edge-swipe: leave edit → list; else apply hash tab */
  window.addEventListener("popstate", function () {
    var editOpen = A.editingId != null || (document.getElementById("editView") && !document.getElementById("editView").hidden);
    var hash = (location.hash || "").replace(/^#\/?/, "");
    if (editOpen && hash.indexOf("products/edit/") !== 0) {
      A._editNavPushed = false;
      if (A.closeEdit) A.closeEdit(true);
    }
    A.applyRoute(hash);
  });

  var q = document.getElementById("q");
  if (q) q.addEventListener("input", function (e) {
    A.productPage = 1;
    A.paintList(e.target.value.trim());
    try { history.replaceState({ naqa: "sec", tab: "products", page: 1 }, "", A.sectionHash()); } catch (err) {}
    A.syncNav();
  });

  var list = document.getElementById("list");
  if (list) list.addEventListener("click", function (e) {
    var pg = e.target.closest("[data-page]");
    if (pg && !pg.disabled) {
      var n = parseInt(pg.getAttribute("data-page"), 10);
      if (!n || n < 1) return;
      A.productPage = n;
      A.paintList(document.getElementById("q") ? document.getElementById("q").value.trim() : "");
      try { history.pushState({ naqa: "sec", tab: "products", page: n }, "", A.sectionHash()); } catch (err) {}
      var box = document.getElementById("productsTab");
      if (box && box.scrollIntoView) box.scrollIntoView({ block: "start" });
      return;
    }
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
      var tabs = document.getElementById("tabs");
      if (tabs) tabs.hidden = true;
      document.getElementById("pin").hidden = false;
      try {
        document.body.classList.add("naqa-locked");
        document.body.classList.remove("naqa-open");
      } catch (e) {}
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
