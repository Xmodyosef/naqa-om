(function (w) {

  /** Keep password managers mapping: email → username, pass → current-password */
  function naqaFixLoginFields() {
    var email = $("fbEmail");
    var pass = $("fbPass");
    if (email) {
      try {
        email.type = "email";
        email.name = "username";
        email.setAttribute("autocomplete", "username");
        email.setAttribute("inputmode", "email");
        email.setAttribute("autocapitalize", "off");
        email.setAttribute("autocorrect", "off");
        email.setAttribute("spellcheck", "false");
      } catch (e) {}
    }
    if (pass) {
      try {
        pass.type = "password";
        pass.name = "password";
        pass.setAttribute("autocomplete", "current-password");
        pass.setAttribute("autocapitalize", "off");
      } catch (e) {}
    }
  }

  "use strict";
  var A = w.NaqaAdmin = w.NaqaAdmin || {};
  A.fbUser = null;
  var _busy = false;
  var _authReady = false;

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
  function emailHashes() {
    return (w.NAQA_ADMIN_EMAIL_HASHES || []).map(function (e) {
      return String(e || "").trim().toLowerCase();
    }).filter(Boolean);
  }
  function hashEmail(email) {
    email = String(email || "").trim().toLowerCase();
    if (!email || !w.crypto || !crypto.subtle || !w.TextEncoder) return Promise.resolve("");
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(email)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ("0" + b.toString(16)).slice(-2);
      }).join("");
    });
  }
  function allowedEmail(userOrEmail) {
    var list = emailHashes();
    var email = typeof userOrEmail === "string"
      ? userOrEmail
      : String((userOrEmail && userOrEmail.email) || "");
    if (!list.length || !String(email).trim()) return Promise.resolve(false);
    return hashEmail(email).then(function (hex) {
      return !!(hex && list.indexOf(hex) >= 0);
    });
  }
  function adminContinueUrl() {
    try {
      return location.origin + (location.pathname || "/").replace(/[^/]+$/, "") + "admin.html";
    } catch (e) {
      return "https://xmodyosef.github.io/naqa-om/admin.html";
    }
  }
  function setPending(on) {
    try {
      if (on) document.body.classList.add("naqa-auth-pending");
      else document.body.classList.remove("naqa-auth-pending");
    } catch (e) {}
    var boot = $("authBoot");
    if (boot) {
      boot.hidden = !on;
      var tx = $("authBootText");
      if (tx) tx.textContent = t("fb_booting", "جاري فتح اللوحة…");
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
    if ($("authBoot")) $("authBoot").hidden = true;
  }
  function unlockUI() {
    try {
      document.body.classList.remove("naqa-locked");
      document.body.classList.add("naqa-open");
      document.body.classList.remove("naqa-auth-pending");
    } catch (e) {}
    if ($("pin")) $("pin").hidden = true;
    if ($("authBoot")) $("authBoot").hidden = true;
  }
  function showPinOnly() {
    /* Legacy path: Firebase unavailable — PIN is the only door */
    setPending(false);
    if ($("fbLogin")) $("fbLogin").hidden = true;
    if ($("pinRow")) $("pinRow").hidden = false;
    if ($("pin")) $("pin").hidden = false;
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
    applyAuthLang();
    var lead = $("pinLead");
    if (lead) lead.textContent = t("fb_welcome", t("fb_lead", ""));
    var note = $("pinNote");
    if (note) note.textContent = t("fb_welcomeNote", t("fb_note", ""));
    var hint = $("fbPassHint");
    if (hint) hint.textContent = t("fb_passHint", "");
    var eL = $("fbEmailLabel");
    if (eL) eL.textContent = t("fb_email", "الإيميل");
    var pL = $("fbPassLabel");
    if (pL) pL.textContent = t("fb_pass", "كلمة السر");
    if ($("fbGo")) $("fbGo").textContent = t("fb_go", "دخول");
    if ($("fbGoogle")) $("fbGoogle").textContent = t("fb_google", "دخول بحساب Google");
    if ($("fbReset")) $("fbReset").textContent = t("fb_forgot", "نسيت كلمة السر؟");
    if ($("fbCreate")) $("fbCreate").textContent = t("fb_create", "إنشاء كلمة سر جديدة");
    var boot = $("authBootText");
    if (boot) boot.textContent = t("fb_booting", "جاري فتح اللوحة…");
    var emailEl = $("fbEmail");
    if (emailEl) emailEl.placeholder = t("fb_emailPh", "name@email.com");
    if ($("fbPass")) $("fbPass").placeholder = t("fb_passPh", "••••••••");
  };

  function showFbOnly() {
    /* STEP2: primary login = Firebase; hide device PIN on this screen */
    if ($("fbLogin")) $("fbLogin").hidden = false;
    if ($("pinRow")) $("pinRow").hidden = true;
    if ($("pin")) $("pin").hidden = false;
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
    if (context === "google") return t("fb_googleOff", "") + (code ? " (" + code.replace("auth/", "") + ")" : "");
    if (context === "reset") return t("fb_resetFail", "") + (code ? " (" + code.replace("auth/", "") + ")" : "");
    if (context === "create") {
      if (code === "auth/operation-not-allowed") return t("fb_providerOff", "");
      return t("fb_createFail", "") + (code ? " (" + code.replace("auth/", "") + ")" : "");
    }
    return t("fb_bad", "") + (code ? " (" + code.replace("auth/", "") + ")" : "");
  }

  function needEmailPass() {
    var email = ($("fbEmail") && $("fbEmail").value || "").trim();
    var pass = ($("fbPass") && $("fbPass").value || "");
    if (!email || !pass) {
      setMsg(t("fb_need", ""));
      return null;
    }
    if (pass.length < 6) {
      setMsg(t("fb_passShort", ""));
      return null;
    }
    return { email: email, pass: pass };
  }


  function offerPasswordSave(email, pass) {
    try {
      if (w.PasswordCredential && navigator.credentials && navigator.credentials.store) {
        var cred = new w.PasswordCredential({ id: email, password: pass, name: email });
        navigator.credentials.store(cred).catch(function () {});
      }
    } catch (e) {}
  }

  function doLogin() {
    if (_busy) return;
    var cred = needEmailPass();
    if (!cred) return;
    setBusy(true);
    setMsg(t("fb_wait", ""));
    allowedEmail(cred.email).then(function (ok) {
      if (!ok) {
        setMsg(t("fb_notAllowed", ""));
        setBusy(false);
        return;
      }
      return firebase.auth().signInWithEmailAndPassword(cred.email, cred.pass).then(function () {
        setMsg("");
        offerPasswordSave(cred.email, cred.pass);
      }).catch(function (err) {
        setMsg(mapAuthError(err, "login"));
      }).finally(function () { setBusy(false); });
    });
  }

  A.fbSignOut = function () {
    if (!w.firebase || !firebase.auth) return Promise.resolve();
    return firebase.auth().signOut().then(function () {
      A.fbUser = null;
      lockUI();
      setPending(false);
      showFbOnly();
      setMsg(t("fb_signedOut", ""));
    });
  };

  A.fbBoot = function () {
    if (!w.naqaFirebaseEnabled || !naqaFirebaseEnabled()) {
      setPending(false);
      showPinOnly();
      if ($("pin")) $("pin").hidden = false;
      return;
    }
    if (!w.firebase || !firebase.apps) {
      setPending(false);
      showPinOnly();
      setMsg(t("fb_loadFail", ""));
      return;
    }
    try {
      if (!firebase.apps.length) firebase.initializeApp(w.NAQA_FIREBASE);
    } catch (e) {
      setPending(false);
      showPinOnly();
      setMsg(t("fb_loadFail", ""));
      return;
    }

    setPending(true);
    if ($("pin")) $("pin").hidden = true;
    applyAuthLang();

    try {
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    } catch (e) {}

    showFbOnly();

    firebase.auth().getRedirectResult().then(function () {}).catch(function (err) {
      setPending(false);
      lockUI();
      setMsg(mapAuthError(err, "google"));
    });

    var form = $("fbForm");
    if (form && !form._bound) {
      form._bound = true;
      form.addEventListener("submit", function (ev) {
        var cred = needEmailPass();
        if (!cred) {
          ev.preventDefault();
          return;
        }
        /* لا نمنع الإرسال: سفاري يطلب «حفظ كلمة السر» فقط إذا أُرسل النموذج فعلياً.
           الإرسال يروح لإطار مخفي (pw-saved.html) واللوحة ما تتحدث. */
        form.action = "pw-saved.html";
        form.target = "naqaSaveFrame";
        form.method = "post";
        doLogin();
      });
    }
    /* fallback if no form */
    var go = $("fbGo");
    if (go && !go._bound && (!form || go.type !== "submit")) {
      go._bound = true;
      go.onclick = function (ev) {
        if (ev) ev.preventDefault();
        doLogin();
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
        allowedEmail(cred.email).then(function (ok) {
        if (!ok) { setMsg(t("fb_notAllowed", "")); setBusy(false); return; }
        /* create uses new-password autocomplete hint */
        try { if ($("fbPass")) $("fbPass").autocomplete = "new-password"; } catch (e) {}
        firebase.auth().createUserWithEmailAndPassword(cred.email, cred.pass).then(function () {
          setMsg(t("fb_created", ""));
          offerPasswordSave(cred.email, cred.pass);
          try { if ($("fbPass")) $("fbPass").setAttribute("autocomplete", "current-password"); } catch (e) {}
        }).catch(function (err) {
          try { console.warn("naqa createUser", err && err.code, err && err.message); } catch (e) {}
          setMsg(mapAuthError(err, "create"));
          try { if ($("fbPass")) $("fbPass").autocomplete = "current-password"; } catch (e) {}
        }).finally(function () { setBusy(false); });
        });
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
        setBusy(true);
        setMsg(t("fb_waitReset", ""));
        allowedEmail(email).then(function (ok) {
        if (!ok) { setMsg(t("fb_notAllowed", "")); setBusy(false); return; }
        firebase.auth().sendPasswordResetEmail(email, {
          url: adminContinueUrl(),
          handleCodeInApp: false
        }).then(function () {
          setMsg(t("fb_resetSent", ""));
        }).catch(function (err) {
          setMsg(mapAuthError(err, "reset"));
        }).finally(function () { setBusy(false); });
        });
      };
    }

    firebase.auth().onAuthStateChanged(function (user) {
      _authReady = true;
      setPending(false);

      if (!user) {
        A.fbUser = null;
        lockUI();
        showFbOnly();
        return;
      }
      allowedEmail(user).then(function (ok) {
        if (!ok) {
          A.fbUser = null;
          firebase.auth().signOut().then(function () {
            lockUI();
            setMsg(t("fb_notAllowed", ""));
            setBusy(false);
          });
          return;
        }
        A.fbUser = user;
        unlockUI();
        if (A.touchSession) A.touchSession();
        if (A.openAdmin) A.openAdmin();
        setMsg("");
        setBusy(false);
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(A.fbBoot, 20); });
  } else {
    setTimeout(A.fbBoot, 20);
  }

  try {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { try { naqaFixLoginFields(); } catch (e) {} });
    } else {
      naqaFixLoginFields();
    }
  } catch (e) {}
  /* login-field-fix */
})(window);
