/* Load heavy admin modules only after Firebase sign-in (faster gate). */
(function (w) {
  "use strict";
  var A = w.NaqaAdmin = w.NaqaAdmin || {};
  var V = "20261125def1";
  var loaded = false;
  var inflight = null;

  var MODULES = [
    "data/products.bundle.js?v=" + V,
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
      var s = document.createElement("script");
      s.src = src;
      s.async = false;
      s.onload = function () { resolve(src); };
      s.onerror = function () { reject(new Error("load-fail:" + src)); };
      document.head.appendChild(s);
    });
  }

  A.loadAdminModules = function () {
    if (loaded) return Promise.resolve(true);
    if (inflight) return inflight;
    inflight = MODULES.reduce(function (chain, src) {
      return chain.then(function () { return loadScript(src); });
    }, Promise.resolve()).then(function () {
      loaded = true;
      inflight = null;
      try {
        if (A.refreshProductsFromBundle) A.refreshProductsFromBundle();
        else if (w.NAQA_PRODUCTS) {
          A.products = (w.NAQA_PRODUCTS || []).map(function (p) { return Object.assign({ imgs: [] }, p); });
        }
      } catch (e) {}
      try { if (A.bindProductListClicks) A.bindProductListClicks(); } catch (e) {}
      return true;
    }).catch(function (err) {
      inflight = null;
      try { console.warn("[naqa] admin modules", err); } catch (e) {}
      return false;
    });
    return inflight;
  };
})(window);
