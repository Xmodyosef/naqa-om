(function (w) {
  var A = w.NaqaAdmin;
  var TABS = ["home", "orders", "products", "reviews", "customers", "finance", "settings"];

  A.paintSection = function (tab) {
    var jobs = A._paints || {};
    var fn = jobs[tab];
    if (!fn) return;
    try { fn(); }
    catch (err) {
      try { console.error("naqa section", tab, err); } catch (e) {}
      var el = document.getElementById(tab + "Tab");
      if (!el) return;
      var note = el.querySelector(".section-error");
      if (!note) {
        note = document.createElement("p");
        note.className = "note section-error";
        el.insertBefore(note, el.firstChild);
      }
      note.textContent = A.lang === "en"
        ? "This section has an error. The other buttons still work."
        : "هذا القسم فيه خطأ. باقي الأزرار تشتغل.";
    }
  };


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

  /* STEP1 simple: parents ONLY in sidebar. Filters = thin chips in main content. */
  A.fillPageSubNav = function () {
    var bar = document.getElementById("pageSubNav");
    if (!bar) return;
    var tab = A.currentTab || "home";
    var chips = [];
    if (tab === "orders") {
      var scoped = (A.orders || []).filter(function (o) { return A.inDateRange(o.at); });
      function count(st) {
        if (st === "all") return scoped.length;
        var n = 0;
        scoped.forEach(function (o) {
          if (A.normalizeStatus(o.status) === st) n++;
        });
        return n;
      }
      [["all", "all"], ["new", "st_new"], ["prep", "st_prep"], ["ship", "st_ship"], ["delivered", "st_delivered"], ["cancel", "st_cancel"]].forEach(function (x) {
        var n = count(x[0]);
        chips.push({ id: x[0], label: (A.t(x[1]) || x[0]) + (n ? " · " + n : "") });
      });
    } else if (tab === "products") {
      [["all", "sub_all"], ["shown", "sub_shown"], ["hidden", "sub_hidden"]].forEach(function (x) {
        chips.push({ id: x[0], label: A.t(x[1]) || x[0] });
      });
    }
    if (!chips.length) {
      bar.innerHTML = "";
      bar.hidden = true;
      return;
    }
    var active = tab === "orders" ? (A.orderFilter || A.currentSub || "all") : (A.productView || A.currentSub || "all");
    bar.hidden = false;
    bar.innerHTML = chips.map(function (c) {
      return '<button type="button" class="page-chip' + (c.id === active ? " on" : "") + '" data-page-tab="' + tab + '" data-page-sub="' + c.id + '">' + A.esc(c.label) + "</button>";
    }).join("");
  };

  A.refreshSideSubs = function () { /* no sidebar children */ };


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
    document.querySelectorAll("#sideNav .side-main").forEach(function (b) {
      var bt = b.getAttribute("data-tab");
      var on = bt === tab;
      b.classList.toggle("on", on);
      if (on) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
      b.removeAttribute("aria-expanded");
    });
    document.querySelectorAll("#sideNav .side-group").forEach(function (g) {
      var gtab = g.getAttribute("data-group") || "";
      var child = (gtab === tab);
      g.classList.toggle("open", child);
      g.classList.toggle("has-active-child", child);
      var main = g.querySelector(".side-main");
      if (main) main.setAttribute("aria-expanded", child ? "true" : "false");
    });
    A.fillPageSubNav();
    if (A.updateOrdersBadge) A.updateOrdersBadge();
    var top = document.getElementById("topBar");
    if (top) top.hidden = !(tab === "products" || tab === "orders");
    var add = document.getElementById("addProductBtn");
    if (add) add.hidden = tab !== "products";
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
    if (TABS.indexOf(tab) < 0) return;
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
    A.paintSection(tab);
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
    /* P1: only open when Firebase has a current user (called after allowedEmail) */
    if (!A.isAuthed || !A.isAuthed()) {
      return;
    }
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
    /* Route/UI first so the shell feels instant */
    try { A.applyRoute((location.hash || "").replace(/^#\/?/, "")); } catch (e) {}
    /* Cloud + orders in background (do not block first paint) */
    try { if (A.pullOrdersCloud) A.pullOrdersCloud().then(function (ok) { if (ok && A.paintOrders && A.currentTab === "orders") A.paintOrders(); if (A.updateOrdersBadge) A.updateOrdersBadge(); }); } catch (e) {}
    var afterData = function () {
      try {
        if (A.currentTab === "products" && A.paintList) A.paintList("");
        if (A.currentTab === "home" && A.paintDashboard) A.paintDashboard();
      } catch (e) {}
    };
    if (A.loadOverridesCloud) {
      A.loadOverridesCloud().then(afterData).catch(afterData);
    }
    if (A.loadRemoteOrders) {
      setTimeout(function () {
        try { A.loadRemoteOrders(); } catch (e) {}
      }, 0);
    }
  };

  /* PIN login removed — Firebase only */

  A.addProduct = function () {
    A.go("products", A.productView || "all", { push: true });
    var list = document.getElementById("listView") || document.getElementById("productsTab");
    if (list) {
      try { list.scrollIntoView({ block: "nearest" }); } catch (e) {}
    }
  };

  A.runGlobalSearch = function () {
    /* Search is orders-only (product list search removed by request). */
    var input = document.getElementById("globalSearch");
    var q = input ? input.value.trim() : "";
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
    if (!(document.getElementById("tools") && !document.getElementById("tools").hidden)) return;
    if (A.sessionOk()) return;
    /* Firebase still signed in → keep panel open */
    var fbUser = null;
    try { fbUser = window.firebase && firebase.auth && firebase.auth().currentUser; } catch (e) {}
    if (fbUser) {
      A.touchSession();
      return;
    }
    A.clearSession && A.clearSession();
    document.getElementById("tools").hidden = true;
    try {
      document.body.classList.add("naqa-locked");
      document.body.classList.remove("naqa-open");
    } catch (e) {}
    var pinEl = document.getElementById("pin");
    if (pinEl) pinEl.hidden = false;
    var fbLogin = document.getElementById("fbLogin");
    var pinRow = document.getElementById("pinRow");
    var fbOn = false;
    try { fbOn = !!(window.naqaFirebaseEnabled && naqaFirebaseEnabled()); } catch (e2) {}
    if (fbLogin) fbLogin.hidden = false;
    if (pinRow) pinRow.hidden = true;
    var msg = document.getElementById("pinMsg");
    if (msg) msg.textContent = A.t("fb_signedOut") || A.t("pinLead");
  }, 60000);

})(window);
