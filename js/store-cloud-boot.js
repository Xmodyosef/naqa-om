/* After store scripts: pull live price/stock/hide + reviews from Firestore (public read). */
(function () {
  function ensureFb() {
    try {
      if (!window.NAQA_FIREBASE) return false;
      if (!window.firebase || !firebase.apps) return false;
      if (!firebase.apps.length) firebase.initializeApp(window.NAQA_FIREBASE);
      return true;
    } catch (e) { return false; }
  }
  function runOverrides() {
    if (typeof window.naqaBootCloudOverridesForStore === "function") {
      window.naqaBootCloudOverridesForStore();
    }
  }
  function pullReviews() {
    if (!ensureFb() || !firebase.firestore) return;
    firebase.firestore().collection("naqa").doc("reviews").get().then(function (snap) {
      if (!snap.exists) return;
      var d = snap.data() || {};
      var list = d.list || d.reviews || null;
      if (!Array.isArray(list) || !list.length) return;
      try { window.NAQA_REVIEWS = list; } catch (e) {}
      try {
        if (typeof openProductId !== "undefined" && openProductId && typeof openSheet === "function") {
          var mode = (typeof sheetMode !== "undefined") ? sheetMode : "full";
          if (mode !== "qv") openSheet(openProductId, mode, false);
        } else if (typeof render === "function") {
          render();
        }
      } catch (e) {}
    }).catch(function () {});
  }
  function tick() {
    runOverrides();
    pullReviews();
  }
  /* Immediate + short retries (Firebase SDK may still be initializing) */
  tick();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      tick();
      setTimeout(tick, 200);
      setTimeout(tick, 800);
    });
  } else {
    setTimeout(tick, 200);
    setTimeout(tick, 800);
  }
})();
