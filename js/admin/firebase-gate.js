(function (w) {
  "use strict";

  /**
   * Naqa Admin Auth Gate
   * Based on:
   * - Firebase Auth (email/password + Google) official web APIs
   * - Credential Management API (PasswordCredential / FederatedCredential)
   * - Google Web Fundamentals: save credentials after successful sign-in
   */

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

  /** kind: err | ok | info */
  function setMsg(text, kind) {
    var msg = $("pinMsg");
    if (!msg) return;
    msg.textContent = text || "";
    msg.classList.remove("is-ok", "is-err", "is-info");
    if (text) {
      msg.classList.add(kind === "ok" ? "is-ok" : kind === "info" ? "is-info" : "is-err");
    }
  }

  function setBusy(on, which) {
    _busy = !!on;
    ["fbGo", "fbGoogle", "fbReset", "fbCreate", "fbTogglePass"].forEach(function (id) {
      var el = $(id);
      if (el) el.disabled = !!on && id !== "fbTogglePass";
    });
    ["fbGo", "fbGoogle"].forEach(function (id) {
      var btn = $(id);
      if (!btn) return;
      var spin = btn.querySelector(".auth-btn-spin");
      var active = on && (!which || which === id);
      if (spin) spin.hidden = !active;
      btn.setAttribute("aria-busy", active ? "true" : "false");
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

  /** Always firebaseapp.com — always in Authorized domains (Firebase docs). */
  function adminContinueUrl() {
    return "https://naqa-om.firebaseapp.com";
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
      document.body.classList.remove("naqa-editing");
      document.documentElement.classList.remove("naqa-editing");
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
    if (eL) eL.textContent = t("fb_email", "البريد الإلكتروني");
    var pL = $("fbPassLabel");
    if (pL) pL.textContent = t("fb_pass", "كلمة المرور");
    var goL = $("fbGoLabel");
    if (goL) goL.textContent = t("fb_go", "تسجيل الدخول");
    else if ($("fbGo")) $("fbGo").textContent = t("fb_go", "تسجيل الدخول");
    var gL = $("fbGoogleLabel");
    if (gL) gL.textContent = t("fb_google", "المتابعة مع Google");
    else if ($("fbGoogle")) $("fbGoogle").textContent = t("fb_google", "المتابعة مع Google");
    if ($("fbReset")) $("fbReset").textContent = t("fb_forgot", "نسيت كلمة المرور؟");
    if ($("fbCreate")) $("fbCreate").textContent = t("fb_create", "إنشاء كلمة مرور جديدة");
    if ($("fbOr")) $("fbOr").textContent = t("fb_or", "أو");
    if ($("fbNoteSave")) $("fbNoteSave").textContent = t("fb_noteSave", "");
    if ($("fbNoteGoogle")) {
      $("fbNoteGoogle").innerHTML = t("fb_noteGoogleHtml",
        "الدخول عبر Google يفتح نافذة الحساب. إذا أُغلقت فوراً، اسمحي بالنوافذ المنبثقة. أبقي النطاق <strong>xmodyosef.github.io</strong> ضمن Authorized domains.");
    }
    if ($("fbNoteSession")) $("fbNoteSession").textContent = t("fb_noteSession", "");
    var boot = $("authBootText");
    if (boot) boot.textContent = t("fb_booting", "جاري فتح اللوحة…");
    var emailEl = $("fbEmail");
    if (emailEl) emailEl.placeholder = t("fb_emailPh", "name@email.com");
    if ($("fbPass")) $("fbPass").placeholder = t("fb_passPh", "••••••••");
    var tog = $("fbTogglePass");
    if (tog) tog.setAttribute("aria-label", t("fb_showPass", "إظهار كلمة المرور"));
  };

  function showFbOnly() {
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
    if (code === "auth/unauthorized-domain" || code === "auth/unauthorized-continue-uri" || code === "auth/invalid-continue-uri") {
      return t("fb_domain", "أضيفي xmodyosef.github.io في Firebase → Authentication → Settings → Authorized domains.");
    }
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
      return t("fb_createFail", "") + (code ? " (" + code.replace("auth/", "") + ")" : "");
    }
    return t("fb_bad", "") + (code ? " (" + code.replace("auth/", "") + ")" : "");
  }

  function needEmailPass() {
    var email = ($("fbEmail") && $("fbEmail").value || "").trim();
    var pass = ($("fbPass") && $("fbPass").value || "");
    if (!email || !pass) {
      setMsg(t("fb_need", ""), "err");
      return null;
    }
    if (pass.length < 6) {
      setMsg(t("fb_passShort", ""), "err");
      return null;
    }
    return { email: email, pass: pass };
  }

  /** Google Credential Management API — save password after successful auth */
  function offerPasswordSave(email, pass) {
    try {
      if (!email || !pass) return;
      if (w.PasswordCredential && navigator.credentials && navigator.credentials.store) {
        var cred = new w.PasswordCredential({
          id: email,
          password: pass,
          name: "نقاء · لوحة التحكم"
        });
        navigator.credentials.store(cred).catch(function () {});
      }
    } catch (e) {}
  }

  /** FederatedCredential after Google sign-in (Chrome/Android) */
  function offerGoogleSave(user) {
    try {
      if (!user || !user.email) return;
      if (w.FederatedCredential && navigator.credentials && navigator.credentials.store) {
        var cred = new w.FederatedCredential({
          id: user.email,
          name: user.displayName || user.email,
          provider: "https://accounts.google.com",
          iconURL: user.photoURL || undefined
        });
        navigator.credentials.store(cred).catch(function () {});
      }
    } catch (e) {}
  }

  function preventSilentReentry() {
    try {
      if (navigator.credentials && navigator.credentials.preventSilentAccess) {
        navigator.credentials.preventSilentAccess();
      }
    } catch (e) {}
  }

  function sendPasswordReset(email) {
    function once(withUrl) {
      if (withUrl) {
        return firebase.auth().sendPasswordResetEmail(email, {
          url: adminContinueUrl(),
          handleCodeInApp: false
        });
      }
      return firebase.auth().sendPasswordResetEmail(email);
    }
    /* Prefer no custom continue URL first (avoids unauthorized-continue-uri), then firebaseapp */
    return once(false).catch(function (err) {
      var c = (err && err.code) || "";
      if (c === "auth/unauthorized-continue-uri" || c === "auth/invalid-continue-uri" || c === "auth/missing-continue-uri") {
        return once(true);
      }
      throw err;
    });
  }

  function guideAfterLoginFail(email, err) {
    var base = mapAuthError(err, "login");
    if (!email || !firebase.auth().fetchSignInMethodsForEmail) {
      setMsg(base, "err");
      return;
    }
    firebase.auth().fetchSignInMethodsForEmail(email).then(function (methods) {
      methods = methods || [];
      if (methods.indexOf("google.com") >= 0 && methods.indexOf("password") < 0) {
        setMsg(t("fb_useGoogle", "هذا الحساب مربوط بـ Google. اضغطي «المتابعة مع Google»."), "info");
      } else if (methods.indexOf("password") >= 0) {
        setMsg(t("fb_badPassHint", "كلمة المرور غير صحيحة. جرّبي «نسيت كلمة المرور؟»."), "err");
      } else {
        setMsg(base, "err");
      }
    }).catch(function () {
      setMsg(base, "err");
    });
  }

  function doLogin() {
    if (_busy) return;
    var cred = needEmailPass();
    if (!cred) return;
    setBusy(true, "fbGo");
    setMsg(t("fb_wait", ""), "info");
    allowedEmail(cred.email).then(function (ok) {
      if (!ok) {
        setMsg(t("fb_notAllowed", ""), "err");
        setBusy(false);
        return;
      }
      return firebase.auth().signInWithEmailAndPassword(cred.email, cred.pass).then(function () {
        setMsg(t("fb_signedIn", "تم تسجيل الدخول."), "ok");
        offerPasswordSave(cred.email, cred.pass);
      }).catch(function (err) {
        guideAfterLoginFail(cred.email, err);
      }).finally(function () { setBusy(false); });
    });
  }

  function doCreate() {
    if (_busy) return;
    var cred = needEmailPass();
    if (!cred) return;
    setBusy(true, "fbGo");
    setMsg(t("fb_waitCreate", ""), "info");
    allowedEmail(cred.email).then(function (ok) {
      if (!ok) { setMsg(t("fb_notAllowed", ""), "err"); setBusy(false); return; }
      try { if ($("fbPass")) $("fbPass").setAttribute("autocomplete", "new-password"); } catch (e) {}
      firebase.auth().createUserWithEmailAndPassword(cred.email, cred.pass).then(function () {
        setMsg(t("fb_created", ""), "ok");
        offerPasswordSave(cred.email, cred.pass);
      }).catch(function (err) {
        var code = (err && err.code) || "";
        if (code === "auth/email-already-in-use") {
          setMsg(t("fb_existsSendReset", "الحساب موجود. نرسل رابط تعيين كلمة المرور…"), "info");
          return sendPasswordReset(cred.email).then(function () {
            setMsg(t("fb_resetSent", ""), "ok");
          }).catch(function (e2) {
            setMsg(mapAuthError(e2, "reset"), "err");
          });
        }
        setMsg(mapAuthError(err, "create"), "err");
      }).finally(function () {
        try { if ($("fbPass")) $("fbPass").setAttribute("autocomplete", "current-password"); } catch (e) {}
        setBusy(false);
      });
    });
  }

  function doGoogle() {
    if (_busy) return;
    setBusy(true, "fbGoogle");
    setMsg(t("fb_waitGoogle", ""), "info");
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    provider.addScope("email");
    provider.addScope("profile");
    /* Hosted on GitHub Pages, not Firebase Hosting.
       Official: https://firebase.google.com/docs/auth/web/redirect-best-practices
       Option 2 — signInWithPopup. Redirect needs a same-site /__/auth proxy,
       which Pages cannot provide, and it is what flashed the handler URL. */
    firebase.auth().signInWithPopup(provider).then(function (result) {
      offerGoogleSave((result && result.user) || firebase.auth().currentUser);
      setMsg("", "ok");
      setBusy(false);
    }).catch(function (err) {
      setMsg(mapAuthError(err, "google"), "err");
      setBusy(false);
    });
  }

  function doReset() {
    if (_busy) return;
    var email = ($("fbEmail") && $("fbEmail").value || "").trim();
    if (!email) { setMsg(t("fb_resetNeed", ""), "err"); return; }
    setBusy(true);
    setMsg(t("fb_waitReset", ""), "info");
    allowedEmail(email).then(function (ok) {
      if (!ok) { setMsg(t("fb_notAllowed", ""), "err"); setBusy(false); return; }
      /* If account is Google-only, password reset is not applicable */
      var chain = Promise.resolve(null);
      if (firebase.auth().fetchSignInMethodsForEmail) {
        chain = firebase.auth().fetchSignInMethodsForEmail(email).catch(function () { return null; });
      }
      return chain.then(function (methods) {
        if (methods && methods.indexOf("google.com") >= 0 && methods.indexOf("password") < 0) {
          setMsg(t("fb_useGoogle", "هذا الحساب مربوط بـ Google. اضغطي «المتابعة مع Google»."), "info");
          setBusy(false);
          return;
        }
        return sendPasswordReset(email).then(function () {
          setMsg(t("fb_resetSent", ""), "ok");
        }).catch(function (err) {
          setMsg(mapAuthError(err, "reset"), "err");
        }).finally(function () { setBusy(false); });
      });
    });
  }

  A.fbSignOut = function () {
    if (!w.firebase || !firebase.auth) return Promise.resolve();
    return firebase.auth().signOut().then(function () {
      A.fbUser = null;
      preventSilentReentry();
      lockUI();
      setPending(false);
      showFbOnly();
      setMsg(t("fb_signedOut", ""), "info");
    });
  };

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

  function bindTogglePass() {
    var tog = $("fbTogglePass");
    var pass = $("fbPass");
    if (!tog || !pass || tog._bound) return;
    tog._bound = true;
    tog.onclick = function () {
      var show = pass.type === "password";
      pass.type = show ? "text" : "password";
      tog.setAttribute("aria-label", show ? t("fb_hidePass", "إخفاء كلمة المرور") : t("fb_showPass", "إظهار كلمة المرور"));
      tog.textContent = show ? "🙈" : "👁";
    };
  }

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
      setMsg(t("fb_loadFail", ""), "err");
      return;
    }
    try {
      if (!firebase.apps.length) firebase.initializeApp(w.NAQA_FIREBASE);
    } catch (e) {
      setPending(false);
      showPinOnly();
      setMsg(t("fb_loadFail", ""), "err");
      return;
    }

    setPending(true);
    if ($("pin")) $("pin").hidden = true;
    applyAuthLang();

    try {
      /* LOCAL: stay signed in across tabs/reloads until explicit sign-out (Firebase docs) */
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    } catch (e) {}

    showFbOnly();
    naqaFixLoginFields();
    bindTogglePass();

    firebase.auth().getRedirectResult().then(function (result) {
      if (result && result.user) offerGoogleSave(result.user);
    }).catch(function (err) {
      setPending(false);
      lockUI();
      setMsg(mapAuthError(err, "google"), "err");
    });

    var form = $("fbForm");
    if (form && !form._bound) {
      form._bound = true;
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        doLogin();
      });
    }
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
      create.onclick = function () { doCreate(); };
    }

    var google = $("fbGoogle");
    if (google && !google._bound) {
      google._bound = true;
      google.onclick = function () { doGoogle(); };
    }

    var reset = $("fbReset");
    if (reset && !reset._bound) {
      reset._bound = true;
      reset.onclick = function () { doReset(); };
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
            preventSilentReentry();
            lockUI();
            setMsg(t("fb_notAllowed", ""), "err");
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
    document.addEventListener("DOMContentLoaded", function () {
      try { naqaFixLoginFields(); } catch (e) {}
      setTimeout(A.fbBoot, 20);
    });
  } else {
    try { naqaFixLoginFields(); } catch (e) {}
    setTimeout(A.fbBoot, 20);
  }
})(window);
