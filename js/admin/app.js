(function (w) {
  var A = w.NaqaAdmin;
  var TABS = ["home", "orders", "products", "reviews", "customers", "finance", "settings"];

  A.paintSection = function (tab) {
    var jobs = A._paints || {};
    var fn = jobs[tab];
    var el = document.getElementById(tab + "Tab");
    if (el) {
      var old = el.querySelector(".section-error");
      if (old) try { old.remove(); } catch (e0) {}
    }
    if (!fn) {
      /* modules not loaded yet — try direct paints if present */
      try {
        if (tab === "products" && A.paintList) { A.paintList(""); return; }
        if (tab === "home" && A.paintDashboard) { A.paintDashboard(); return; }
        if (tab === "orders" && A.paintOrders) { A.paintOrders(); return; }
        if (tab === "customers" && A.paintCustomers) { A.paintCustomers(); return; }
        if (tab === "finance" && A.paintFinance) { A.paintFinance(); return; }
        if (tab === "settings" && A.paintSettings) { A.paintSettings(); return; }
        if (tab === "reviews" && A.paintReviews) { A.paintReviews(); return; }
      } catch (err0) {
        try { console.error("naqa section fallback", tab, err0); } catch (e1) {}
      }
      return;
    }
    try { fn(); }
    catch (err) {
      try { console.error("naqa section", tab, err); } catch (e) {}
      if (!el) return;
      var note = el.querySelector(".section-error");
      if (!note) {
        note = document.createElement("p");
        note.className = "note section-error";
        el.insertBefore(note, el.firstChild);
      }
      note.textContent = (A.lang === "en")
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

  /* Nav mode: pills-top — parents #sideNav, children #childNav */
  A.refreshChildNav = function () {
    var tab = A.currentTab || "home";
    var active = "all";
    if (tab === "orders") active = A.orderFilter || A.currentSub || "all";
    else if (tab === "products") active = A.productView || A.currentSub || "all";
    document.querySelectorAll("#childNav .side-sub, #sideNav .side-sub").forEach(function (b) {
      var bt = b.getAttribute("data-tab") || "";
      var bs = b.getAttribute("data-sub") || "";
      var on = bt === tab && bs === active;
      b.classList.toggle("on", on);
      if (on) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
  };

  A.syncNav = function () {
    try { document.body.classList.add("naqa-nav-pills"); } catch (e) {}
    var tab = A.currentTab || "home";
    document.querySelectorAll("#sideNav .side-main").forEach(function (b) {
      var bt = b.getAttribute("data-tab");
      var on = bt === tab;
      b.classList.toggle("on", on);
      if (on) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    /* Children: separate row — show set for orders/products only */
    var childNav = document.getElementById("childNav");
    var hasKids = (tab === "orders" || tab === "products");
    if (childNav) {
      childNav.hidden = !hasKids;
      if (hasKids) childNav.removeAttribute("hidden");
      childNav.classList.toggle("show", hasKids);
      childNav.querySelectorAll(".child-set").forEach(function (set) {
        var forTab = set.getAttribute("data-for") || "";
        var open = forTab === tab;
        set.hidden = !open;
        if (open) set.removeAttribute("hidden");
        set.classList.toggle("show", open);
      });
    }
    if (A.refreshChildNav) A.refreshChildNav();
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
    /* Accept gate-validated fbUser even if isAuthed races */
    var ok = false;
    try { ok = !!(A.fbUser && A.fbUser.uid); } catch (e) {}
    try { if (!ok && A.isAuthed) ok = !!A.isAuthed(); } catch (e) {}
    if (!ok) {
      try {
        if (window.firebase && firebase.auth && firebase.auth().currentUser) ok = true;
      } catch (e) {}
    }
    if (!ok) return;
    A.touchSession();
    try {
      document.body.classList.remove("naqa-locked");
      document.body.classList.add("naqa-open");
    } catch (e) {}
    var pin = document.getElementById("pin");
    if (pin) pin.hidden = true;
    var tools = document.getElementById("tools");
    if (tools) tools.hidden = false;
    var tabs = document.getElementById("tabs");
    if (tabs) tabs.hidden = false;
    try {
      document.body.classList.remove("naqa-locked", "naqa-auth-pending");
      document.body.classList.add("naqa-open");
    } catch (e) {}
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



  /* Child pills clicks */
  var childNav = document.getElementById("childNav");
  if (childNav && childNav.getAttribute("data-sub-bound") !== "1") {
    childNav.setAttribute("data-sub-bound", "1");
    childNav.addEventListener("click", function (e) {
      var subBtn = e.target.closest(".side-sub");
      if (!subBtn || !childNav.contains(subBtn)) return;
      e.preventDefault();
      e.stopPropagation();
      var tab = subBtn.getAttribute("data-tab") || A.currentTab;
      var sub = subBtn.getAttribute("data-sub") || A.defaultSub(tab);
      if (tab === "products" && sub !== A.productView) A.productPage = 1;
      var same = tab === A.currentTab && sub === A.currentSub;
      A.go(tab, sub, { push: !same, page: (tab === "products" && sub !== A.productView) ? 1 : A.productPage });
    });
  }


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
