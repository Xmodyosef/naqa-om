(function (w) {
  var A = w.NaqaAdmin;

  function scrubLegacyTokens() {
    try {
      if (A.TOKEN) {
        sessionStorage.removeItem(A.TOKEN);
        localStorage.removeItem(A.TOKEN);
      }
      sessionStorage.removeItem("naqa_gh_token");
      localStorage.removeItem("naqa_gh_token");
    } catch (e) {}
    var el = document.getElementById("token");
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  A.paintSettings = function () {
    var box = document.getElementById("settingsBox");
    if (!box) return;
    scrubLegacyTokens();

    var email = "";
    try { email = (A.fbUser && A.fbUser.email) || ""; } catch (e) {}
    try {
      if (!email && w.firebase && firebase.auth) {
        var u = firebase.auth().currentUser;
        if (u && u.email) email = u.email;
      }
    } catch (e2) {}
    /* show full email only in admin account card (never on store) */
    function maskEmail(em) {
      em = String(em || "");
      var at = em.indexOf("@");
      if (at < 1) return em ? "••••" : "";
      var local = em.slice(0, at);
      var domain = em.slice(at + 1);
      var show = local.length <= 2 ? local[0] + "•" : local.slice(0, 2) + "•••";
      return show + "@" + domain;
    }
    var emailShow = email ? (A.lang === "en" ? "Signed in ✓" : "مسجّلة دخول ✓") : "";
    var emailMasked = maskEmail(email);
    var adminUid = "";
    try {
      if (w.firebase && firebase.auth && firebase.auth().currentUser) {
        adminUid = firebase.auth().currentUser.uid || "";
      } else if (A.fbUser && A.fbUser.uid) {
        adminUid = A.fbUser.uid;
      }
    } catch (e3) {}
    var wa = String(w.WA_NUMBER || "96879088349");
    var bankName = (w.BANK_NAME || "").trim();
    var bankIban = (w.BANK_IBAN || "").trim();
    var ar = A.lang !== "en";

    box.innerHTML =
      '<div class="settings-stack">'

      + '<section class="panel settings-sec">'
      +   '<h2>' + (ar ? "المتجر" : "Store") + '</h2>'
      +   '<p class="note">' + (ar ? "بيانات تظهر للزبائن في المتجر." : "Details customers see in the store.") + '</p>'
      +   '<div class="set-row"><span class="set-k">' + (ar ? "واتساب" : "WhatsApp") + '</span><span class="set-v" dir="ltr">+' + A.esc(wa) + '</span></div>'
      +   '<div class="set-row"><span class="set-k">' + (ar ? "البنك" : "Bank") + '</span><span class="set-v">' + A.esc(bankName || (ar ? "غير مضاف" : "Not set")) + '</span></div>'
      +   '<div class="set-row"><span class="set-k">IBAN</span><span class="set-v" dir="ltr">' + A.esc(bankIban || (ar ? "غير مضاف" : "Not set")) + '</span></div>'
      + '</section>'

      + '<section class="panel settings-sec">'
      +   '<h2>' + (ar ? "الحساب" : "Account") + '</h2>'
      +   (email
          ? ('<div class="set-row"><span class="set-k">' + (ar ? "الحساب" : "Account") + '</span><span class="set-v">' + A.esc(emailShow) + '</span></div>'
            + '<button type="button" class="mini" id="btnRevealEmail" style="margin-top:6px">' + (ar ? "إظهار البريد المقنّع" : "Show masked email") + '</button>'
            + '<div class="set-row" id="emailRevealRow" hidden><span class="set-k">Email</span><span class="set-v" dir="ltr" id="emailRevealVal">' + A.esc(emailMasked) + '</span></div>')
          : ('<p class="note">' + (ar ? "ما في جلسة ظاهرة — ارجعي لشاشة الدخول." : "No session — return to sign-in.") + '</p>'))
      +   '<p class="note">' + (ar
          ? "كلمة السر تُدار من شاشة الدخول (نسيت كلمة السر؟). الحفظ بعد الدخول يزامن المنتجات مع حسابك تلقائياً — بدون رموز إضافية."
          : "Password is managed on the login screen (Forgot password?). After sign-in, product saves sync to your account automatically — no extra tokens.") + '</p>'
      +   '<button type="button" class="mini" id="btnThemeToggle" style="width:100%;margin-top:8px">' + (ar ? "تبديل الوضع الليلي" : "Toggle dark mode") + '</button>'
      +   '<button type="button" class="mini" id="btnCmdPalette" style="width:100%;margin-top:6px">' + (ar ? "لوحة أوامر (Ctrl+K)" : "Command palette (Ctrl+K)") + '</button>'
      +   '<button type="button" class="logout" id="btnLogout" style="width:100%;margin-top:10px;border:0;border-radius:12px;padding:14px;font-weight:800">'
      +     (ar ? "خروج من اللوحة" : "Sign out") + '</button>'
      +   '<p class="note" id="settingsStatus" role="status" style="margin-top:8px"></p>'
      + '</section>'

      + '<section class="panel settings-sec">'
      +   '<h2>' + (ar ? "الخصوصية والحماية" : "Privacy & security") + '</h2>'
      +   '<p class="note">' + A.t("setSecure") + '</p>'
      +   '<ul class="set-bullets" style="margin:8px 0 0;padding-inline-start:1.2em;font-size:.82rem;line-height:1.55;color:var(--muted)">'
      +     '<li>' + (ar ? "الدخول: إيميل + كلمة سر (Firebase) فقط." : "Sign-in: email + password (Firebase) only.") + '</li>'
      +     '<li>' + (ar ? "أسعار/كمية/إخفاء: تُحفظ على حسابك بعد الدخول." : "Price/stock/hide: saved to your account after sign-in.") + '</li>'
      +     '<li>' + (ar ? "الطلبات وأسماء العملاء: على هذا الجهاز (ما تُرفع للمتجر العام)." : "Orders & customer names: on this device (not public on the store).") + '</li>'
      +     '<li>' + (ar ? "Firestore: قراءة عامة للتعديلات المنشورة فقط؛ الكتابة بعد الدخول." : "Firestore: public read for published overrides only; write after sign-in.") + '</li>'
      +     (adminUid
            ? ('<li>' + (ar ? "معرّف الجهاز للحماية (UID) — للتشديد في قواعد Firestore:" : "Admin UID for Firestore rules:")
              + ' <code dir="ltr" style="font-size:.75rem;user-select:all">' + A.esc(adminUid) + '</code></li>')
            : '')
      +     '<li>' + (ar ? "الدخول فقط بحساب Firebase (إيميل/كلمة سر)." : "Sign-in is Firebase only (email/password).") + '</li>'
      +   '</ul>'
      +   '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">'
      +     '<button type="button" class="mini" id="btnPullOrders">' + (ar ? "سحب الطلبات من الحساب" : "Pull orders from account") + '</button>'
      +     '<button type="button" class="mini" id="btnPushOrders">' + (ar ? "رفع الطلبات للحساب" : "Push orders to account") + '</button>'
      +   '</div>'
      +   '<p class="note">' + (ar
          ? "الطلبات خاصة بحسابك فقط (مو عامة على المتجر). بعد نشر قواعد Firestore للـ orders_private."
          : "Orders stay private to your admin account (not public on the store). Requires Firestore rules for orders_private.") + '</p>'
      + '</section>'

      + '<section class="panel settings-sec">'
      +   '<h2>' + (ar ? "سجل النشاط" : "Activity") + '</h2>'
      +   '<div id="activityBox"></div>'
      + '</section>'

      + '</div>';

    try { if (A.activity && A.activity.render) A.activity.render(document.getElementById("activityBox")); } catch (eAct) {}
    var pullO = document.getElementById("btnPullOrders");
    if (pullO) pullO.onclick = function () {
      if (!A.pullOrdersCloud) return;
      A.setMsg("settingsStatus", ar ? "جاري السحب…" : "Pulling…");
      A.pullOrdersCloud().then(function (ok) {
        A.setMsg("settingsStatus", ok ? (ar ? "تم سحب الطلبات ✓" : "Orders pulled ✓") : (ar ? "ما في طلبات سحابية أو فشل السحب." : "No cloud orders or pull failed."));
        if (ok && A.paintOrders) A.paintOrders();
      });
    };
    var pushO = document.getElementById("btnPushOrders");
    if (pushO) pushO.onclick = function () {
      if (!A.pushOrdersCloud) return;
      A.setMsg("settingsStatus", ar ? "جاري الرفع…" : "Pushing…");
      A.pushOrdersCloud().then(function (ok) {
        A.setMsg("settingsStatus", ok ? (ar ? "تم رفع الطلبات ✓" : "Orders pushed ✓") : (ar ? "فشل الرفع — راجعي القواعد وتسجيل الدخول." : "Push failed — check rules + sign-in."));
      });
    };
    var th = document.getElementById("btnThemeToggle");
    if (th) th.onclick = function () { if (A.toggleAdminTheme) A.toggleAdminTheme(); };
    var cmd = document.getElementById("btnCmdPalette");
    if (cmd) cmd.onclick = function () { if (A.openCommandPalette) A.openCommandPalette(); };
    var logout = document.getElementById("btnLogout");
    if (logout) logout.onclick = function () {
      var ask = A.t("setOutAsk") || (ar ? "خروج من لوحة التحكم؟" : "Leave the admin?");
      if (!confirm(ask)) return;
      scrubLegacyTokens();
      function hidePanel() {
        var tools = document.getElementById("tools");
        var tabs = document.getElementById("tabs");
        var save = document.getElementById("savebar");
        var pin = document.getElementById("pin");
        if (tools) tools.hidden = true;
        if (tabs) tabs.hidden = true;
        if (save) save.hidden = true;
        if (pin) pin.hidden = false;
        try {
          document.body.classList.add("naqa-locked");
          document.body.classList.remove("naqa-open");
        } catch (e) {}
        if (A.clearSession) A.clearSession();
        if (A.forgetToken) A.forgetToken();
        scrubLegacyTokens();
        var fbLogin = document.getElementById("fbLogin");
        if (fbLogin) fbLogin.hidden = false;
        if (A.setMsg) A.setMsg("pinMsg", A.t("fb_signedOut") || (ar ? "تم الخروج." : "Signed out."));
      }
      if (A.fbSignOut) A.fbSignOut().then(hidePanel, hidePanel);
      else hidePanel();
    };
  };

  A.saveLocal = function () {
    if (A.editingId != null && document.getElementById("editView") && !document.getElementById("editView").hidden && A.saveEdit) A.saveEdit();
    try { localStorage.setItem(A.KEY, JSON.stringify(A.overrides)); } catch (e) {}
    A.saveOrders();
    A.setMsg("status", A.t("savedDev"));
    A.setMsg("orderStatus", A.t("savedOrders"));
    A.setMsg("settingsStatus", A.t("saved"));
  };

  A.readToken = function () { return ""; };
  A.keepToken = function () {};
  A.forgetToken = function () {
    try {
      if (A.TOKEN) {
        sessionStorage.removeItem(A.TOKEN);
        localStorage.removeItem(A.TOKEN);
      }
      sessionStorage.removeItem("naqa_gh_token");
      localStorage.removeItem("naqa_gh_token");
    } catch (e) {}
    var el = document.getElementById("token");
    if (el) el.value = "";
  };

  A.publishLive = function () {
    if (A.requireAuth && !A.requireAuth("settingsStatus")) return Promise.resolve(false);
    if (A.syncOverridesCloud) return A.syncOverridesCloud();
    try { localStorage.setItem(A.KEY, JSON.stringify(A.overrides || {})); } catch (e) {}
    if (A.setMsg) A.setMsg("status", A.lang === "en" ? "Saved on this device" : "انحفظ على الجهاز");
  };

  A.publish = function () {
    if (A.requireAuth && !A.requireAuth("settingsStatus")) return Promise.resolve(false);
    if (A.editingId != null && document.getElementById("editView") && !document.getElementById("editView").hidden && A.saveEdit) {
      A.saveEdit({ skipPublish: true });
    }
    try { localStorage.setItem(A.KEY, JSON.stringify(A.overrides || {})); } catch (e) {}
    if (A.saveOrders) A.saveOrders();
    if (A.syncOverridesCloud) return A.syncOverridesCloud();
    if (A.setMsg) A.setMsg("settingsStatus", A.lang === "en" ? "Saved on this device" : "انحفظ على الجهاز");
  };
})(window);
