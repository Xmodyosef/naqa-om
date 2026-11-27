/* After store scripts: pull live price/stock/hide + reviews from Firestore (public read). */
(function () {
  var ran = 0;
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
        /* Only refresh open product sheet — never full home re-render (FOUC) */
        if (typeof openProductId !== "undefined" && openProductId && typeof openSheet === "function") {
          var mode = (typeof sheetMode !== "undefined") ? sheetMode : "full";
          var sh = document.getElementById("sheet");
          if (sh && sh.classList.contains("show") && mode !== "qv") openSheet(openProductId, mode, false);
        }
      } catch (e) {}
    }).catch(function () {});
  }

  function applyStoreContact(d) {
    if (!d) return;
    var wa = String(d.wa || "").replace(/\D/g, "");
    var bn = String(d.bankName || "").trim();
    var bi = String(d.bankIban || "").trim();
    if (wa) {
      try { window.NAQA_WA = wa; window.WA_NUMBER = wa; } catch (e) {}
      ["waFloat", "waHero", "waFooter", "dockWa"].forEach(function (id) {
        var a = document.getElementById(id);
        if (a) a.href = "https://wa.me/" + wa;
      });
      document.querySelectorAll('a[data-naqa-wa="store"]').forEach(function (a) {
        a.href = "https://wa.me/" + wa;
      });
    }
    try { window.NAQA_BANK_NAME = bn; window.BANK_NAME = bn; } catch (e2) {}
    try { window.NAQA_BANK_IBAN = bi; window.BANK_IBAN = bi; } catch (e3) {}
  }
  function pullStoreContact() {
    if (!ensureFb() || !firebase.firestore) return;
    firebase.firestore().collection("naqa").doc("store").get().then(function (snap) {
      if (!snap.exists) return;
      applyStoreContact(snap.data() || {});
    }).catch(function () {});
  }
  function tick() {
    if (ran > 2) return;
    ran++;
    runOverrides();
    pullReviews();
    pullStoreContact();
  }
  /* One immediate + one retry only (was 3+ ticks → FOUC thrash) */
  tick();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(tick, 350);
    });
  } else {
    setTimeout(tick, 350);
  }
})();
