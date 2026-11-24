(function (w) {
  var A = w.NaqaAdmin = w.NaqaAdmin || {};
  A.fbUser = null;

  function $(id) { return document.getElementById(id); }
  function t(key, fallback) {
    return A.t ? A.t(key) : fallback;
  }
  function allowedEmail(user) {
    var list = (w.NAQA_ADMIN_EMAILS || []).map(function (e) {
      return String(e || "").trim().toLowerCase();
    }).filter(Boolean);
    var email = String((user && user.email) || "").trim().toLowerCase();
    if (!list.length || !email) return false;
    return list.indexOf(email) >= 0;
  }
  function lockOut() {
    if ($("tools")) $("tools").hidden = true;
    if ($("tabs")) $("tabs").hidden = true;
    if ($("savebar")) $("savebar").hidden = true;
    if ($("pin")) $("pin").hidden = false;
  }
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
    if (lead) lead.textContent = t("fb_lead", lead.textContent);
    var note = $("pinNote");
    if (note) note.textContent = t("fb_note", note.textContent);
    var g = $("fbGoogle");
    if (g) g.textContent = t("fb_google", "دخول بحساب Google");
    var r = $("fbReset");
    if (r) r.textContent = t("fb_forgot", "نسيت كلمة السر؟");
    var go = $("fbGo");
    if (go) go.textContent = t("fb_go", "دخول");
  }

  A.fbSignOut = function () {
    if (!w.firebase || !firebase.auth) return Promise.resolve();
    return firebase.auth().signOut().then(function () {
      A.fbUser = null;
      lockOut();
      var msg = $("pinMsg");
      if (msg) msg.textContent = t("fb_signedOut", "");
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
      if (msg) msg.textContent = t("fb_loadFail", "Firebase failed to load");
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
        if (!email || !pass) { if (msg) msg.textContent = t("fb_need", ""); return; }
        if (msg) msg.textContent = t("fb_wait", "");
        firebase.auth().signInWithEmailAndPassword(email, pass).catch(function () {
          if (msg) msg.textContent = t("fb_bad", "");
        });
      };
    }

    var google = $("fbGoogle");
    if (google && !google._bound) {
      google._bound = true;
      google.onclick = function () {
        var msg = $("pinMsg");
        if (msg) msg.textContent = t("fb_wait", "");
        var provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        firebase.auth().signInWithPopup(provider).catch(function (err) {
          var code = err && err.code ? err.code : "";
          if (msg) msg.textContent = code.indexOf("popup") >= 0 ? t("fb_popup", "") : t("fb_googleOff", "");
        });
      };
    }

    var reset = $("fbReset");
    if (reset && !reset._bound) {
      reset._bound = true;
      reset.onclick = function () {
        var email = ($("fbEmail") && $("fbEmail").value || "").trim();
        var msg = $("pinMsg");
        if (!email) { if (msg) msg.textContent = t("fb_resetNeed", ""); return; }
        firebase.auth().sendPasswordResetEmail(email).then(function () {
          if (msg) msg.textContent = t("fb_resetSent", "");
        }).catch(function () {
          if (msg) msg.textContent = t("fb_resetFail", "");
        });
      };
    }

    firebase.auth().onAuthStateChanged(function (user) {
      if (user && !allowedEmail(user)) {
        A.fbUser = null;
        var msg = $("pinMsg");
        firebase.auth().signOut().then(function () {
          lockOut();
          if (msg) msg.textContent = t("fb_notAllowed", "");
        });
        return;
      }
      A.fbUser = user || null;
      if (user) {
        if (A.touchSession) A.touchSession();
        if (A.openAdmin) A.openAdmin();
        var ok = $("pinMsg");
        if (ok) ok.textContent = "";
      } else {
        lockOut();
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(A.fbBoot, 30); });
  } else {
    setTimeout(A.fbBoot, 30);
  }
})(window);
