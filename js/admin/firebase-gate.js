(function (w) {
  "use strict";
  var A = w.NaqaAdmin = w.NaqaAdmin || {};
  A.fbUser = null;
  var _busy = false;

  function $(id) { return document.getElementById(id); }
  function t(key, fallback) {
    try {
      if (A.t) {
        var v = A.t(key);
        if (v && v !== key) return v;
      }
    } catch (e) {}
    return fallback != null ? fallback : key;
  }
  function setMsg(text) {
    var msg = $("pinMsg");
    if (msg) msg.textContent = text || "";
  }
  function setBusy(on) {
    _busy = !!on;
    ["fbGo", "fbGoogle", "fbReset", "fbCreate"].forEach(function (id) {
      var el = $(id);
      if (el) el.disabled = !!on;
    });
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
  function adminContinueUrl() {
    try {
      return location.origin + location.pathname.replace(/\/?$/, "/") + "admin.html";
    } catch (e) {
      return "https://xmodyosef.github.io/naqa-om/admin.html";
    }
  }
  function lockUI() {
    try {
      document.body.classList.add("naqa-locked");
      document.body.classList.remove("naqa-open");
    } catch (e) {}
    if ($("tools")) $("tools").hidden = true;
    if ($("tabs")) $("tabs").hidden = true;
    if ($("pin")) $("pin").hidden = false;
  }
  function unlockUI() {
    try {
      document.body.classList.remove("naqa-locked");
      document.body.classList.add("naqa-open");
    } catch (e) {}
  }
  function showPinOnly() {
    if ($("fbLogin")) $("fbLogin").hidden = true;
    if ($("pinRow")) $("pinRow").hidden = false;
  }
  function applyAuthLang() {
    try {
      if (w.firebase && firebase.auth) {
        firebase.auth().languageCode = (A.lang === "en") ? "en" : "ar";
      }
    } catch (e) {}
  }

  A.fbApplyLabels = function () {
    if (!w.naqaFirebaseEnabled || !naqaFirebaseEnabled()) return;
    if ($("fbLogin") && $("fbLogin").hidden) return;
    applyAuthLang();
    var lead = $("pinLead");
    if (lead) lead.textContent = t("fb_welcome", t("fb_lead", ""));
    var note = $("pinNote");
    if (note) note.textContent = t("fb_welcomeNote", t("fb_note", ""));
    var hint = $("fbPassHint");
    if (hint) hint.textContent = t("fb_passHint", "");
    var emailLab = $("fbEmailLab");
    if (emailLab) emailLab.firstChild && (emailLab.childNodes[0].textContent = t("fb_email", "الإيميل"));
    /* labels wrap text+input — set data via dedicated spans if present */
    var eL = $("fbEmailLabel");
    if (eL) eL.textContent = t("fb_email", "الإيميل");
    var pL = $("fbPassLabel");
    if (pL) pL.textContent = t("fb_pass", "كلمة السر");
    if ($("fbGo")) $("fbGo").textContent = t("fb_go", "دخول");
    if ($("fbGoogle")) $("fbGoogle").textContent = t("fb_google", "دخول بحساب Google");
    if ($("fbReset")) $("fbReset").textContent = t("fb_forgot", "نسيت كلمة السر؟");
    if ($("fbCreate")) $("fbCreate").textContent = t("fb_create", "إنشاء كلمة سر جديدة");
    var emailEl = $("fbEmail");
    if (emailEl && !emailEl.value && (w.NAQA_ADMIN_EMAILS || [])[0]) {
      emailEl.value = w.NAQA_ADMIN_EMAILS[0];
    }
    if (emailEl) emailEl.placeholder = t("fb_emailPh", "name@email.com");
    if ($("fbPass")) $("fbPass").placeholder = t("fb_passPh", "••••••••");
  };

  function showFbOnly() {
    if ($("fbLogin")) $("fbLogin").hidden = false;
    if ($("pinRow")) $("pinRow").hidden = true;
    A.fbApplyLabels();
  }

  function mapAuthError(err, context) {
    var code = (err && err.code) || "";
    if (code === "auth/popup-blocked") return t("fb_popup", "");
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return t("fb_popupClosed", "");
    if (code === "auth/operation-not-allowed") return t("fb_providerOff", "");
    if (code === "auth/unauthorized-domain") return t("fb_domain", "");
    if (code === "auth/user-not-found") {
      return context === "reset" ? t("fb_resetNoUser", "") : t("fb_badOrCreate", "");
    }
    if (code === "auth/wrong-password" || code === "auth/invalid-credential" || code === "auth/invalid-email") {
      return t("fb_badOrCreate", "");
    }
    if (code === "auth/email-already-in-use") return t("fb_exists", "");
    if (code === "auth/weak-password") return t("fb_passShort", "");
    if (code === "auth/too-many-requests") return t("fb_rate", "");
    if (code === "auth/network-request-failed") return t("fb_network", "");
    if (code === "auth/account-exists-with-different-credential") return t("fb_existsDiff", "");
    if (context === "google") return t("fb_googleOff", "");
    if (context === "reset") return t("fb_resetFail", "");
    if (context === "create") return t("fb_createFail", "");
    return t("fb_bad", "");
  }

  function needEmailPass() {
    var email = ($("fbEmail") && $("fbEmail").value || "").trim();
    var pass = ($("fbPass") && $("fbPass").value || "");
    if (!email || !pass) {
      setMsg(t("fb_need", ""));
      return null;
    }
    if (!allowedEmail(email)) {
      setMsg(t("fb_notAllowed", ""));
      return null;
    }
    if (pass.length < 6) {
      setMsg(t("fb_passShort", ""));
      return null;
    }
    return { email: email, pass: pass };
  }

  A.fbSignOut = function () {
    if (!w.firebase || !firebase.auth) return Promise.resolve();
    return firebase.auth().signOut().then(function () {
      A.fbUser = null;
      lockUI();
      setMsg(t("fb_signedOut", ""));
    });
  };

  A.fbBoot = function () {
    if (!w.naqaFirebaseEnabled || !naqaFirebaseEnabled()) {
      showPinOnly();
      return;
    }
    if (!w.firebase || !firebase.apps) {
      showPinOnly();
      setMsg(t("fb_loadFail", ""));
      return;
    }
    try {
      if (!firebase.apps.length) firebase.initializeApp(w.NAQA_FIREBASE);
    } catch (e) {
      showPinOnly();
      setMsg(t("fb_loadFail", ""));
      return;
    }

    showFbOnly();
    lockUI();
    applyAuthLang();

    /* Finish Google redirect if returning from Google */
    firebase.auth().getRedirectResult().then(function (result) {
      if (result && result.user) {
        setMsg("");
      }
    }).catch(function (err) {
      setMsg(mapAuthError(err, "google"));
    });

    var go = $("fbGo");
    if (go && !go._bound) {
      go._bound = true;
      go.onclick = function () {
        if (_busy) return;
        var cred = needEmailPass();
        if (!cred) return;
        setBusy(true);
        setMsg(t("fb_wait", ""));
        firebase.auth().signInWithEmailAndPassword(cred.email, cred.pass).then(function () {
          setMsg("");
        }).catch(function (err) {
          setMsg(mapAuthError(err, "login"));
        }).finally(function () { setBusy(false); });
      };
    }

    var create = $("fbCreate");
    if (create && !create._bound) {
      create._bound = true;
      create.onclick = function () {
        if (_busy) return;
        var cred = needEmailPass();
        if (!cred) return;
        setBusy(true);
        setMsg(t("fb_waitCreate", ""));
        firebase.auth().createUserWithEmailAndPassword(cred.email, cred.pass).then(function () {
          setMsg(t("fb_created", ""));
        }).catch(function (err) {
          setMsg(mapAuthError(err, "create"));
        }).finally(function () { setBusy(false); });
      };
    }

    var google = $("fbGoogle");
    if (google && !google._bound) {
      google._bound = true;
      google.onclick = function () {
        if (_busy) return;
        setBusy(true);
        setMsg(t("fb_waitGoogle", ""));
        var provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        provider.addScope("email");
        var useRedirect = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "");
        function failOrRedirect(err) {
          var code = (err && err.code) || "";
          if (useRedirect || code.indexOf("popup") >= 0 || code === "auth/cancelled-popup-request") {
            setMsg(t("fb_redirect", ""));
            return firebase.auth().signInWithRedirect(provider);
          }
          setMsg(mapAuthError(err, "google"));
          setBusy(false);
        }
        if (useRedirect) {
          firebase.auth().signInWithRedirect(provider).catch(function (err) {
            setMsg(mapAuthError(err, "google"));
            setBusy(false);
          });
          return;
        }
        firebase.auth().signInWithPopup(provider).then(function () {
          setMsg("");
          setBusy(false);
        }).catch(function (err) {
          failOrRedirect(err);
        });
      };
    }

    var reset = $("fbReset");
    if (reset && !reset._bound) {
      reset._bound = true;
      reset.onclick = function () {
        if (_busy) return;
        var email = ($("fbEmail") && $("fbEmail").value || "").trim();
        if (!email) { setMsg(t("fb_resetNeed", "")); return; }
        if (!allowedEmail(email)) { setMsg(t("fb_notAllowed", "")); return; }
        setBusy(true);
        setMsg(t("fb_waitReset", ""));
        var action = {
          url: adminContinueUrl(),
          handleCodeInApp: false
        };
        firebase.auth().sendPasswordResetEmail(email, action).then(function () {
          setMsg(t("fb_resetSent", ""));
        }).catch(function (err) {
          setMsg(mapAuthError(err, "reset"));
        }).finally(function () { setBusy(false); });
      };
    }

    /* Enter key on password submits login */
    var passEl = $("fbPass");
    if (passEl && !passEl._bound) {
      passEl._bound = true;
      passEl.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          if ($("fbGo")) $("fbGo").click();
        }
      });
    }

    firebase.auth().onAuthStateChanged(function (user) {
      if (user && !allowedEmail(user)) {
        A.fbUser = null;
        firebase.auth().signOut().then(function () {
          lockUI();
          setMsg(t("fb_notAllowed", ""));
          setBusy(false);
        });
        return;
      }
      A.fbUser = user || null;
      if (user) {
        unlockUI();
        if (A.touchSession) A.touchSession();
        if (A.openAdmin) A.openAdmin();
        setMsg("");
        setBusy(false);
      } else {
        lockUI();
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(A.fbBoot, 40); });
  } else {
    setTimeout(A.fbBoot, 40);
  }
})(window);
