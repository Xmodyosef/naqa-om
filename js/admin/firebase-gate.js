(function (w) {
  var A = w.NaqaAdmin = w.NaqaAdmin || {};
  A.fbUser = null;

  function $(id) { return document.getElementById(id); }
  function t(key, fallback) {
    return A.t ? A.t(key) : (fallback || key);
  }
  function allowedEmail(userOrEmail) {
    var list = (w.NAQA_ADMIN_EMAILS || []).map(function (e) {
      return String(e || "").trim().toLowerCase();
    }).filter(Boolean);
    var email = typeof userOrEmail === "string"
      ? userOrEmail
      : String((userOrEmail && userOrEmail.email) || "");
    email = email.trim().toLowerCase();
    if (!list.length || !email) return false;
    return list.indexOf(email) >= 0;
  }
  function lockUI() {
    try { document.body.classList.add("naqa-locked"); } catch (e) {}
    if ($("tools")) $("tools").hidden = true;
    if ($("tabs")) $("tabs").hidden = true;
    if ($("savebar")) $("savebar").hidden = true;
    if ($("pin")) $("pin").hidden = false;
  }
  function unlockUI() {
    try { document.body.classList.remove("naqa-locked"); } catch (e) {}
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
    if (lead) lead.textContent = t("fb_lead", "ادخلي بحساب الإدارة فقط.");
    var note = $("pinNote");
    if (note) note.textContent = t("fb_note", "بعد الدخول تظهر التبويبات.");
    var g = $("fbGoogle");
    if (g) g.textContent = t("fb_google", "دخول بحساب Google");
    var r = $("fbReset");
    if (r) r.textContent = t("fb_forgot", "نسيت كلمة السر؟");
    var c = $("fbCreate");
    if (c) c.textContent = t("fb_create", "إنشاء كلمة سر جديدة");
    var go = $("fbGo");
    if (go) go.textContent = t("fb_go", "دخول");
    /* Prefill allowlisted email so password setup is clear */
    var emailEl = $("fbEmail");
    if (emailEl && !emailEl.value && (w.NAQA_ADMIN_EMAILS || [])[0]) {
      emailEl.value = w.NAQA_ADMIN_EMAILS[0];
    }
  }

  A.fbSignOut = function () {
    if (!w.firebase || !firebase.auth) return Promise.resolve();
    return firebase.auth().signOut().then(function () {
      A.fbUser = null;
      lockUI();
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
      if (msg) msg.textContent = t("fb_loadFail", "");
      return;
    }
    try {
      if (!firebase.apps.length) firebase.initializeApp(w.NAQA_FIREBASE);
    } catch (e) {
      showPinOnly();
      return;
    }
    showFbOnly();
    lockUI();

    function needEmailPass(msg) {
      var email = ($("fbEmail") && $("fbEmail").value || "").trim();
      var pass = ($("fbPass") && $("fbPass").value || "");
      if (!email || !pass) {
        if (msg) msg.textContent = t("fb_need", "");
        return null;
      }
      if (!allowedEmail(email)) {
        if (msg) msg.textContent = t("fb_notAllowed", "");
        return null;
      }
      if (pass.length < 6) {
        if (msg) msg.textContent = t("fb_passShort", "");
        return null;
      }
      return { email: email, pass: pass };
    }

    var go = $("fbGo");
    if (go && !go._bound) {
      go._bound = true;
      go.onclick = function () {
        var msg = $("pinMsg");
        var cred = needEmailPass(msg);
        if (!cred) return;
        if (msg) msg.textContent = t("fb_wait", "");
        firebase.auth().signInWithEmailAndPassword(cred.email, cred.pass).catch(function (err) {
          var code = (err && err.code) || "";
          if (code === "auth/user-not-found" || code === "auth/invalid-credential" || code === "auth/wrong-password") {
            if (msg) msg.textContent = t("fb_badOrCreate", "");
          } else {
            if (msg) msg.textContent = t("fb_bad", "");
          }
        });
      };
    }

    var create = $("fbCreate");
    if (create && !create._bound) {
      create._bound = true;
      create.onclick = function () {
        var msg = $("pinMsg");
        var cred = needEmailPass(msg);
        if (!cred) return;
        if (msg) msg.textContent = t("fb_wait", "");
        firebase.auth().createUserWithEmailAndPassword(cred.email, cred.pass).then(function () {
          if (msg) msg.textContent = t("fb_created", "");
        }).catch(function (err) {
          var code = (err && err.code) || "";
          if (code === "auth/email-already-in-use") {
            if (msg) msg.textContent = t("fb_exists", "");
          } else if (code === "auth/weak-password") {
            if (msg) msg.textContent = t("fb_passShort", "");
          } else {
            if (msg) msg.textContent = t("fb_createFail", "");
          }
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
        if (!allowedEmail(email)) { if (msg) msg.textContent = t("fb_notAllowed", ""); return; }
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
          lockUI();
          if (msg) msg.textContent = t("fb_notAllowed", "");
        });
        return;
      }
      A.fbUser = user || null;
      if (user) {
        unlockUI();
        if (A.touchSession) A.touchSession();
        if (A.openAdmin) A.openAdmin();
        var ok = $("pinMsg");
        if (ok) ok.textContent = "";
      } else {
        lockUI();
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(A.fbBoot, 30); });
  } else {
    setTimeout(A.fbBoot, 30);
  }
})(window);
