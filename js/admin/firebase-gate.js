(function (w) {
  var A = w.NaqaAdmin = w.NaqaAdmin || {};
  A.fbUser = null;

  function $(id) { return document.getElementById(id); }

  function showPinOnly() {
    var fb = $("fbLogin");
    var pinRow = $("pinRow");
    if (fb) fb.hidden = true;
    if (pinRow) pinRow.hidden = false;
  }

  function showFbOnly() {
    var fb = $("fbLogin");
    var pinRow = $("pinRow");
    if (fb) fb.hidden = false;
    if (pinRow) pinRow.hidden = true;
    var lead = $("pinLead");
    if (lead) lead.textContent = A.t ? A.t("fb_lead") : lead.textContent;
    var note = $("pinNote");
    if (note) note.textContent = A.t ? A.t("fb_note") : note.textContent;
  }

  A.fbSignOut = function () {
    if (!w.firebase || !firebase.auth) return Promise.resolve();
    return firebase.auth().signOut().then(function () {
      A.fbUser = null;
      try { if (A.touchSession) A.touchSession(); } catch (e) {}
      if ($("tools")) $("tools").hidden = true;
      if ($("tabs")) $("tabs").hidden = true;
      if ($("savebar")) $("savebar").hidden = true;
      if ($("pin")) $("pin").hidden = false;
      var msg = $("pinMsg");
      if (msg) msg.textContent = A.t ? A.t("fb_signedOut") : "";
    });
  };

  A.fbBoot = function () {
    if (!w.naqaFirebaseEnabled || !naqaFirebaseEnabled()) {
      showPinOnly();
      return;
    }
    if (!w.firebase || !firebase.apps) {
      showPinOnly();
      var msg = $("pinMsg");
      if (msg) msg.textContent = A.t ? A.t("fb_loadFail") : "Firebase failed to load";
      return;
    }
    try {
      if (!firebase.apps.length) firebase.initializeApp(w.NAQA_FIREBASE);
    } catch (e) {
      showPinOnly();
      return;
    }
    showFbOnly();
    var go = $("fbGo");
    if (go && !go._bound) {
      go._bound = true;
      go.onclick = function () {
        var email = ($("fbEmail") && $("fbEmail").value || "").trim();
        var pass = ($("fbPass") && $("fbPass").value || "");
        var msg = $("pinMsg");
        if (!email || !pass) {
          if (msg) msg.textContent = A.t("fb_need");
          return;
        }
        if (msg) msg.textContent = A.t("fb_wait");
        firebase.auth().signInWithEmailAndPassword(email, pass).then(function () {
          if (msg) msg.textContent = "";
        }).catch(function (err) {
          if (msg) msg.textContent = A.t("fb_bad");
        });
      };
    }
    firebase.auth().onAuthStateChanged(function (user) {
      A.fbUser = user || null;
      if (user) {
        if (A.touchSession) A.touchSession();
        if (A.openAdmin) A.openAdmin();
        var msg = $("pinMsg");
        if (msg) msg.textContent = "";
      } else {
        if ($("tools")) $("tools").hidden = true;
        if ($("tabs")) $("tabs").hidden = true;
        if ($("savebar")) $("savebar").hidden = true;
        if ($("pin")) $("pin").hidden = false;
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(A.fbBoot, 30); });
  } else {
    setTimeout(A.fbBoot, 30);
  }
})(window);
