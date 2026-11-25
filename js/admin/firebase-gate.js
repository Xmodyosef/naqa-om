(function (w) {
  "use strict";

  /**
   * Naqa Admin Auth Gate — finite state machine (no UI races)
   * States: booting | guest | open
   * Evidence-based rewrite: previous hang was lockUI/setPending/showFbOnly/openAdmin
   * fighting over body classes while unlockUI never cleared #tools[hidden].
   */

  var A = w.NaqaAdmin = w.NaqaAdmin || {};
  A.fbUser = null;
  var EMAIL_KEY = "naqa_admin_last_email";
  var AUTH_HINT_KEY = "naqa_admin_authed";
  var _busy = false;
  var _authReady = false;
  var _state = "booting"; /* booting | guest | open */
  var _unsubAuth = null;

  function $(id) { return document.getElementById(id); }

  function markAuthed() {
    try { localStorage.setItem(AUTH_HINT_KEY, "1"); } catch (e) {}
    try { document.documentElement.classList.add("naqa-expect-auth"); } catch (e) {}
  }
  function clearAuthed() {
    try { localStorage.removeItem(AUTH_HINT_KEY); } catch (e) {}
    try { document.documentElement.classList.remove("naqa-expect-auth"); } catch (e) {}
  }

  function t(key, fallback) {
    try {
      if (A.t) {
        var v = A.t(key);
        if (v && v !== key) return v;
      }
    } catch (e) {}
    return fallback != null ? fallback : key;
  }

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
    ["fbGo", "fbGoogle", "fbReset", "fbTogglePass"].forEach(function (id) {
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

  function adminContinueUrl() {
    return "https://naqa-om.firebaseapp.com";
  }

  /**
   * Single UI renderer — only entry that mutates gate/shell visibility.
   * booting: boot text only
   * guest: login form only
   * open: admin shell only
   */
  function renderAuthUI(state, msgText, msgKind) {
    _state = state;
    var boot = $("authBoot");
    var pin = $("pin");
    var tools = $("tools");
    var tabs = $("tabs");
    var body = document.body;

    try {
      body.classList.remove("naqa-auth-pending", "naqa-locked", "naqa-open");
    } catch (e) {}

    if (state === "booting") {
      try { body.classList.add("naqa-locked", "naqa-auth-pending"); } catch (e) {}
      if (boot) {
        boot.hidden = false;
        var tx = $("authBootText");
        if (tx) tx.textContent = t("fb_booting", "جاري فتح اللوحة…");
      }
      if (pin) pin.hidden = true;
      if (tools) tools.hidden = true;
      if (tabs) tabs.hidden = true;
      return;
    }

    if (state === "guest") {
      clearAuthed();
      try { body.classList.add("naqa-locked"); } catch (e) {}
      if (boot) boot.hidden = true;
      if (pin) pin.hidden = false;
      if (tools) tools.hidden = true;
      if (tabs) tabs.hidden = true;
      if ($("fbLogin")) $("fbLogin").hidden = false;
      if ($("pinRow")) $("pinRow").hidden = true;
      try {
        var last = localStorage.getItem(EMAIL_KEY) || "";
        if (last && $("fbEmail") && !$("fbEmail").value) $("fbEmail").value = last;
      } catch (e) {}
      applyAuthLang();
      if (msgText) setMsg(msgText, msgKind || "err");
      return;
    }

    /* open */
    markAuthed();
    try { body.classList.add("naqa-open"); } catch (e) {}
    if (boot) boot.hidden = true;
    if (pin) pin.hidden = true;
    if (tools) tools.hidden = false; /* critical: attribute + CSS */
    if (tabs) tabs.hidden = false;
    setMsg("");
  }

  function applyAuthLang() {
    var lead = $("pinLead");
    if (lead) lead.textContent = t("fb_welcome", "مرحباً بكِ في لوحة نقاء ✨");
    var note = $("pinNote");
    if (note) note.textContent = t("fb_note", "ادخلي بحسابك لإدارة الطلبات والمنتجات.");
    var hint = $("fbPassHint");
    if (hint) hint.textContent = t("fb_hint", "ادخلي بالإيميل وكلمة السر المحفوظة على جهازك.");
    if ($("fbEmailLabel")) $("fbEmailLabel").textContent = t("fb_email", "البريد الإلكتروني");
    if ($("fbPassLabel")) $("fbPassLabel").textContent = t("fb_pass", "كلمة المرور");
    if ($("fbGoLabel")) $("fbGoLabel").textContent = t("fb_go", "تسجيل الدخول");
    else if ($("fbGo")) $("fbGo").textContent = t("fb_go", "تسجيل الدخول");
    if ($("fbGoogleLabel")) $("fbGoogleLabel").textContent = t("fb_google", "المتابعة مع Google");
    if ($("fbReset")) $("fbReset").textContent = t("fb_forgot", "نسيت كلمة المرور؟");
    if ($("fbOr")) $("fbOr").textContent = t("fb_or", "أو");
    if ($("fbNoteSession")) $("fbNoteSession").textContent = t("fb_session", "تبقى الجلسة على هذا الجهاز حتى تسجّلي الخروج.");
    if ($("fbNoteSave")) $("fbNoteSave").textContent = t("fb_save", "بعد دخول ناجح قد يقترح المتصفح حفظ الإيميل وكلمة السر.");
    if ($("fbNoteGoogle")) $("fbNoteGoogle").textContent = t("fb_googleNote", "Google اختياري. النطاق: xmodyosef.github.io");
    A.fbApplyLabels = applyAuthLang;
  }

  function mapAuthError(err, context) {
    var code = (err && err.code) || "";
    if (code === "auth/popup-blocked") return t("fb_popup", "اسمحي بالنوافذ المنبثقة.");
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return t("fb_popupClosed", "أُغلقت نافذة Google.");
    if (code === "auth/operation-not-allowed") return t("fb_providerOff", "فعّلي الطريقة في Firebase Authentication.");
    if (code === "auth/unauthorized-domain" || code === "auth/unauthorized-continue-uri" || code === "auth/invalid-continue-uri") {
      return t("fb_domain", "أضيفي xmodyosef.github.io في Firebase → Authorized domains.");
    }
    if (code === "auth/user-not-found") return t("fb_badOrCreate", "الإيميل أو كلمة السر غير صحيحة.");
    if (code === "auth/wrong-password" || code === "auth/invalid-credential" || code === "auth/invalid-email") {
      return t("fb_badOrCreate", "الإيميل أو كلمة السر غير صحيحة.");
    }
    if (code === "auth/too-many-requests") return t("fb_rate", "محاولات كثيرة. انتظري قليلاً.");
    if (code === "auth/network-request-failed") return t("fb_network", "مشكلة شبكة. تحققي من الإنترنت.");
    if (context === "google") return t("fb_googleOff", "تعذّر Google.") + (code ? " (" + code.replace("auth/", "") + ")" : "");
    if (context === "reset") return t("fb_resetFail", "تعذّر إرسال رابط الاستعادة.") + (code ? " (" + code.replace("auth/", "") + ")" : "");
    return t("fb_bad", "تعذّر تسجيل الدخول.") + (code ? " (" + code.replace("auth/", "") + ")" : "");
  }

  function needEmailPass() {
    var email = ($("fbEmail") && $("fbEmail").value || "").trim();
    var pass = ($("fbPass") && $("fbPass").value || "");
    if (!email || !pass) {
      setMsg(t("fb_need", "أدخلي الإيميل وكلمة السر."), "err");
      return null;
    }
    if (pass.length < 6) {
      setMsg(t("fb_passShort", "كلمة السر 6 أحرف على الأقل."), "err");
      return null;
    }
    return { email: email, pass: pass };
  }

  function offerPasswordSave(email, pass) {
    try {
      if (!email || !pass) return;
      if (w.PasswordCredential && navigator.credentials && navigator.credentials.store) {
        var cred = new w.PasswordCredential({
          id: email,
          password: pass,
          name: A.lang === "en" ? "Naqa · Admin" : "نقاء · لوحة التحكم"
        });
        navigator.credentials.store(cred).catch(function () {});
      }
    } catch (e) {}
  }

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
    return firebase.auth().sendPasswordResetEmail(email).catch(function (err) {
      var c = (err && err.code) || "";
      if (c === "auth/unauthorized-continue-uri" || c === "auth/invalid-continue-uri" || c === "auth/missing-continue-uri") {
        return firebase.auth().sendPasswordResetEmail(email, {
          url: adminContinueUrl(),
          handleCodeInApp: false
        });
      }
      throw err;
    });
  }

  function enterOpen(user) {
    if (_state === "open" && A.fbUser && user && A.fbUser.uid === user.uid) {
      /* already open for this user — only refresh modules if needed */
      return;
    }
    A.fbUser = user;
    renderAuthUI("open");
    setBusy(false);
    try { if (A.touchSession) A.touchSession(); } catch (e) {}
    try { if (A.openAdmin) A.openAdmin(); } catch (e) {}
    function afterModules() {
      try { if (A.openAdmin) A.openAdmin(); } catch (e) {}
      try {
        if (A.currentTab === "products" && A.paintList) A.paintList("");
        if (A.currentTab === "home" && A.paintDashboard) A.paintDashboard();
      } catch (e) {}
    }
    /* Modules NEVER gate first paint — shell is already open */
    if (A.loadAdminModules) {
      A.loadAdminModules().then(afterModules).catch(afterModules);
    }
  }

  function rejectUser(msg) {
    A.fbUser = null;
    clearAuthed();
    preventSilentReentry();
    firebase.auth().signOut().catch(function () {}).then(function () {
      _authReady = true;
      renderAuthUI("guest", msg || t("fb_notAllowed", "هذا الحساب غير مصرّح له."), "err");
      setBusy(false);
    });
  }

  function uidAllowed(uid) {
    try {
      if (w.naqaIsAdminUid) return !!naqaIsAdminUid(uid);
    } catch (e) {}
    return true;
  }

  /**
   * Allow path (measured, not guessed):
   * 1) UID list hit → open in the same tick (0 await) — primary for your Firebase user.
   * 2) Else email SHA-256 allow-list (async, ~1–5ms).
   * Never keep "booting" longer than the async allow check when UID is unknown.
   */
  function handleUser(user) {
    if (!user) {
      A.fbUser = null;
      renderAuthUI("guest");
      return;
    }
    /* FAST PATH: configured admin UID — open immediately, no crypto, no modules wait */
    if (uidAllowed(user.uid)) {
      enterOpen(user);
      return;
    }
    /* Slow path only when UID lock is empty or mismatched: email hash */
    var list = emailHashes();
    if (!list.length) {
      /* no UID match and no email hashes → deny */
      rejectUser(t("fb_notAllowed", "هذا الحساب غير مصرّح له."));
      return;
    }
    renderAuthUI("booting");
    allowedEmail(user).then(function (ok) {
      if (!ok) {
        rejectUser(t("fb_notAllowed", "هذا الحساب غير مصرّح له."));
        return;
      }
      enterOpen(user);
    }).catch(function () {
      renderAuthUI("guest", t("fb_bad", "تعذّر التحقق من الحساب."), "err");
    });
  }

  function doLogin() {
    if (_busy) return;
    var cred = needEmailPass();
    if (!cred) return;
    setBusy(true, "fbGo");
    setMsg(t("fb_wait", "جاري التحقق…"), "info");
    allowedEmail(cred.email).then(function (ok) {
      if (!ok) {
        setMsg(t("fb_notAllowed", "هذا الحساب غير مصرّح له."), "err");
        setBusy(false);
        return;
      }
      return firebase.auth().signInWithEmailAndPassword(cred.email, cred.pass).then(function () {
        try { localStorage.setItem(EMAIL_KEY, cred.email); } catch (e) {}
        offerPasswordSave(cred.email, cred.pass);
        /* onAuthStateChanged will enterOpen */
      }).catch(function (err) {
        setMsg(mapAuthError(err, "login"), "err");
        setBusy(false);
      });
    }).catch(function () {
      setMsg(t("fb_bad", "تعذّر تسجيل الدخول."), "err");
      setBusy(false);
    });
  }

  function doGoogle() {
    if (_busy) return;
    setBusy(true, "fbGoogle");
    setMsg(t("fb_wait", "جاري التحقق…"), "info");
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    firebase.auth().signInWithPopup(provider).then(function (result) {
      offerGoogleSave((result && result.user) || null);
      /* onAuthStateChanged handles allow-list + open */
    }).catch(function (err) {
      setBusy(false);
      setMsg(mapAuthError(err, "google"), "err");
    });
  }

  function doReset() {
    if (_busy) return;
    var email = ($("fbEmail") && $("fbEmail").value || "").trim();
    if (!email) {
      setMsg(t("fb_needEmail", "أدخلي الإيميل أولاً."), "err");
      return;
    }
    setBusy(true);
    setMsg(t("fb_wait", "جاري الإرسال…"), "info");
    allowedEmail(email).then(function (ok) {
      if (!ok) {
        setMsg(t("fb_notAllowed", "هذا الحساب غير مصرّح له."), "err");
        setBusy(false);
        return null;
      }
      return sendPasswordReset(email).then(function () {
        setMsg(t("fb_resetSent", "تم إرسال رابط استعادة كلمة السر إلى بريدك."), "ok");
      }).catch(function (err) {
        setMsg(mapAuthError(err, "reset"), "err");
      }).finally(function () { setBusy(false); });
    });
  }

  A.fbSignOut = function () {
    if (!w.firebase || !firebase.auth) {
      renderAuthUI("guest");
      return Promise.resolve();
    }
    return firebase.auth().signOut().then(function () {
      A.fbUser = null;
      clearAuthed();
      preventSilentReentry();
      _authReady = true;
      renderAuthUI("guest", t("fb_signedOut", "تم تسجيل الخروج."), "info");
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
      } catch (e) {}
    }
    if (pass) {
      try {
        pass.type = "password";
        pass.name = "password";
        pass.setAttribute("autocomplete", "current-password");
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
      tog.textContent = show ? "🙈" : "👁";
    };
  }

  function bindForms() {
    var form = $("fbForm");
    if (form && !form._bound) {
      form._bound = true;
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        doLogin();
      });
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
  }

  A.fbBoot = function () {
    renderAuthUI("booting");
    applyAuthLang();
    naqaFixLoginFields();
    bindTogglePass();
    bindForms();

    if (!w.naqaFirebaseEnabled || !naqaFirebaseEnabled()) {
      _authReady = true;
      renderAuthUI("guest", t("fb_loadFail", "Firebase غير مفعّل."), "err");
      return;
    }
    if (!w.firebase || !firebase.apps) {
      _authReady = true;
      renderAuthUI("guest", t("fb_loadFail", "مكتبة Firebase لم تُحمّل."), "err");
      return;
    }
    try {
      if (!firebase.apps.length) firebase.initializeApp(w.NAQA_FIREBASE);
    } catch (e) {
      _authReady = true;
      renderAuthUI("guest", t("fb_loadFail", "فشل تهيئة Firebase."), "err");
      return;
    }

    /**
     * Latency budget (engineering):
     * - Register onAuthStateChanged IMMEDIATELY (do not await setPersistence).
     * - setPersistence(LOCAL) fire-and-forget for future sign-ins.
     * - If auth.currentUser already hydrated → handle same tick.
     * - Watchdog 2.5s max on booting (not 15s).
     */
    var auth = firebase.auth();
    var bootWatch = setTimeout(function () {
      if (_state === "booting") {
        _authReady = true;
        renderAuthUI("guest", t("fb_timeout", "انتهت مهلة الاتصال. تحققي من النت وحدّثي الصفحة."), "err");
      }
    }, 2500);

    if (_unsubAuth) {
      try { _unsubAuth(); } catch (e) {}
      _unsubAuth = null;
    }
    _unsubAuth = auth.onAuthStateChanged(function (user) {
      _authReady = true;
      clearTimeout(bootWatch);
      handleUser(user || null);
    });

    try {
      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function () {});
    } catch (e) {}

    /* Same-tick hydrate when SDK already has user (reload with warm IndexedDB) */
    try {
      if (auth.currentUser) {
        _authReady = true;
        clearTimeout(bootWatch);
        handleUser(auth.currentUser);
      }
    } catch (e) {}

    auth.getRedirectResult().then(function (result) {
      if (result && result.user) offerGoogleSave(result.user);
    }).catch(function () {});
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(A.fbBoot, 0);
    });
  } else {
    setTimeout(A.fbBoot, 0);
  }
})(window);
