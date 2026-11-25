/* Naqa · product overrides via Firebase Firestore (no GitHub token).
   Doc: naqa/overrides  { map: { "123": { price, stock, hidden, ... } }, updatedAt }
   Rules: public read; write only when signed in (admin). */
(function (w) {
  "use strict";

  var DOC_PATH = { col: "naqa", id: "overrides" };

  function fs() {
    try {
      if (!w.firebase || !firebase.apps || !firebase.apps.length) return null;
      if (!firebase.firestore) return null;
      return firebase.firestore();
    } catch (e) {
      return null;
    }
  }

  function ensureApp() {
    try {
      if (!w.NAQA_FIREBASE) return false;
      if (!w.firebase || !firebase.apps) return false;
      if (!firebase.apps.length) firebase.initializeApp(w.NAQA_FIREBASE);
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Load overrides map from cloud → Promise<object> */
  w.naqaLoadCloudOverrides = function () {
    if (!ensureApp()) return Promise.resolve(null);
    var db = fs();
    if (!db) return Promise.resolve(null);
    return db.collection(DOC_PATH.col).doc(DOC_PATH.id).get().then(function (snap) {
      if (!snap.exists) return {};
      var d = snap.data() || {};
      var map = d.map || d.data || d.overrides || {};
      return (map && typeof map === "object") ? map : {};
    }).catch(function () { return null; });
  };

  /** Save full overrides map (admin, must be signed in) */
  w.naqaSaveCloudOverrides = function (map) {
    if (!ensureApp()) return Promise.reject(new Error("no-firebase"));
    var db = fs();
    if (!db) return Promise.reject(new Error("no-firestore"));
    var user = null;
    try { user = firebase.auth && firebase.auth().currentUser; } catch (e) {}
    if (!user) return Promise.reject(new Error("not-signed-in"));
    var clean = map && typeof map === "object" ? map : {};
    return db.collection(DOC_PATH.col).doc(DOC_PATH.id).set({
      map: clean,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: user.uid || "" /* never store admin email in public docs */
    }, { merge: false });
  };

  /* —— Admin hooks —— */
  var A = w.NaqaAdmin = w.NaqaAdmin || {};

  A.loadOverridesCloud = function () {
    return w.naqaLoadCloudOverrides().then(function (map) {
      if (!map) return false;
      A.overrides = map;
      try { localStorage.setItem(A.KEY || "naqa_overrides", JSON.stringify(map)); } catch (e) {}
      return true;
    }).catch(function () { return false; });
  };

  A.syncOverridesCloud = function () {
    if (A.requireAuth && !A.requireAuth("status")) {
      return Promise.resolve(false);
    }
    var map = A.overrides || {};
    try { localStorage.setItem(A.KEY || "naqa_overrides", JSON.stringify(map)); } catch (e) {}
    return w.naqaSaveCloudOverrides(map).then(function () {
      if (A.setMsg) A.setMsg("status", A.lang === "en" ? "Saved to your account ✓" : "انحفظ على حسابك ✓");
      return true;
    }).catch(function (err) {
      var code = (err && err.message) || "";
      var ar = A.lang !== "en";
      if (code === "not-signed-in") {
        if (A.setMsg) A.setMsg("status", ar ? "ادخلي بحسابك أولاً." : "Sign in first.");
      } else if (code === "no-firestore" || code === "no-firebase") {
        if (A.setMsg) A.setMsg("status", ar ? "انحفظ على الجهاز. فعّلي Firestore لاحقاً للمزامنة." : "Saved on device. Enable Firestore for sync.");
      } else {
        if (A.setMsg) A.setMsg("status", ar ? "انحفظ على الجهاز (المزامنة السحابية فشلت)." : "Saved on device (cloud sync failed).");
      }
      return false;
    });
  };

  /* Replace GitHub publish with cloud save */
  A.publishLive = function () {
    return A.syncOverridesCloud();
  };
  A.publish = function () {
    if (A.editingId != null && document.getElementById("editView") && !document.getElementById("editView").hidden && A.saveEdit) {
      A.saveEdit({ skipPublish: true });
    }
    try { localStorage.setItem(A.KEY || "naqa_overrides", JSON.stringify(A.overrides || {})); } catch (e) {}
    if (A.saveOrders) A.saveOrders();
    return A.syncOverridesCloud().then(function (ok) {
      if (A.setMsg) {
        A.setMsg("settingsStatus", ok
          ? (A.lang === "en" ? "Synced to account ✓" : "تمت المزامنة مع الحساب ✓")
          : (A.lang === "en" ? "Saved on this device" : "انحفظ على هذا الجهاز"));
      }
    });
  };

  /* Storefront: apply cloud overrides after boot */
  w.naqaBootCloudOverridesForStore = function () {
    if (typeof mergeOverrides !== "function") return;
    w.naqaLoadCloudOverrides().then(function (map) {
      if (!map || !Object.keys(map).length) return;
      try {
        var local = {};
        try { local = JSON.parse(localStorage.getItem("naqa_overrides") || "{}") || {}; } catch (e) {}
        var out = Object.assign({}, map);
        /* local wins for same-device admin testing only if signed-in admin — skip merge from local for public store security */
        mergeOverrides(out);
        if (typeof render === "function") render();
      } catch (e) {}
    });
  };
})(window);
