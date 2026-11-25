/* Load heavy admin modules only after Firebase sign-in (faster gate). */
(function (w) {
  "use strict";
  var A = w.NaqaAdmin = w.NaqaAdmin || {};
  var V = "20261125pdf12";
  var loaded = false;
  var inflight = null;
  var SCRIPT_MS = 12000;

  var MODULES = [
    "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js",
    "data/products.admin.min.js?v=" + V,
    "js/admin/products.js?v=" + V,
    "js/admin/orders.js?v=" + V,
    "js/admin/cloud-orders.js?v=" + V,
    "js/admin/ux-extras.js?v=" + V,
    "js/admin/customers.js?v=" + V,
    "js/admin/finance.js?v=" + V,
    "js/admin/dashboard.js?v=" + V,
    "js/admin/settings.js?v=" + V,
    "js/cloud-overrides.js?v=" + V,
    "js/admin/reviews.js?v=" + V,
    "js/admin/buttons.bundle.js?v=" + V
  ];

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var s = document.createElement("script");
      s.src = src;
      s.async = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        try { console.warn("[naqa] script timeout", src); } catch (e) {}
        resolve(src); /* skip hung file — do not block panel forever */
      }, SCRIPT_MS);
      s.onload = function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(src);
      };
      s.onerror = function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try { console.warn("[naqa] script fail", src); } catch (e) {}
        resolve(src); /* continue chain */
      };
      document.head.appendChild(s);
    });
  }

  A.loadAdminModules = function () {
    if (loaded) return Promise.resolve(true);
    if (inflight) return inflight;
    /* Phase A: Firestore SDK + full catalog (order required).
       Phase B: remaining admin modules in parallel for faster open. */
    var phaseA = MODULES.slice(0, 2);
    var phaseB = MODULES.slice(2);
    inflight = phaseA.reduce(function (chain, src) {
      return chain.then(function () { return loadScript(src); });
    }, Promise.resolve()).then(function () {
      return Promise.all(phaseB.map(function (src) { return loadScript(src); }));
    }).then(function () {
      loaded = true;
      inflight = null;
      try {
        if (A.refreshProductsFromBundle) A.refreshProductsFromBundle();
        else if (w.NAQA_PRODUCTS) {
          A.products = (w.NAQA_PRODUCTS || []).map(function (p) { return Object.assign({ imgs: [] }, p); });
        }
      } catch (e) {}
      try { if (A.bindProductListClicks) A.bindProductListClicks(); } catch (e) {}
      try { if (A.settleOrderStock) A.settleOrderStock(); } catch (e) {}
      try {
        if (A.paintList) A.paintList("");
        if (A.paintDashboard) A.paintDashboard();
      } catch (e) {}
      return true;
    }).catch(function (err) {
      inflight = null;
      try { console.warn("[naqa] admin modules", err); } catch (e) {}
      return false;
    });
    return inflight;
  };
})(window);
