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

  function maskEmail(em) {
    em = String(em || "");
    var at = em.indexOf("@");
    if (at < 1) return em ? "••••" : "";
    var local = em.slice(0, at);
    var domain = em.slice(at + 1);
    var show = local.length <= 2 ? local[0] + "•" : local.slice(0, 2) + "•••";
    return show + "@" + domain;
  }

  A.paintSettings = function () {
    var box = document.getElementById("settingsBox");
    if (!box) return;
    scrubLegacyTokens();

    var ar = A.lang !== "en";
    var email = "";
    try { email = (A.fbUser && A.fbUser.email) || ""; } catch (e) {}
    try {
      if (!email && w.firebase && firebase.auth) {
        var u = firebase.auth().currentUser;
        if (u && u.email) email = u.email;
      }
    } catch (e2) {}

    var wa = String(w.WA_NUMBER || "96879088349");
    var bankName = (w.BANK_NAME || "").trim();
    var bankIban = (w.BANK_IBAN || "").trim();
    var emailMasked = maskEmail(email);
    var signed = email
      ? (ar ? "مسجّلة دخول ✓" : "Signed in ✓")
      : (ar ? "غير مسجّلة" : "Not signed in");

    box.innerHTML =
      '<div class="settings-stack">'

      /* ① المتجر */
      + '<section class="set-card">'
      +   '<div class="set-card-head"><span class="set-card-ico" aria-hidden="true">◈</span><h2 class="set-card-title">' + (ar ? "المتجر" : "Store") + '</h2></div>'
      +   '<p class="set-card-note">' + (ar ? "بيانات تظهر للزبائن في المتجر." : "Details customers see on the store.") + '</p>'
      +   '<div class="set-list">'
      +     '<div class="set-row"><span class="set-k">' + (ar ? "واتساب" : "WhatsApp") + '</span><span class="set-v" dir="ltr">+' + A.esc(wa) + '</span></div>'
      +     '<div class="set-row"><span class="set-k">' + (ar ? "البنك" : "Bank") + '</span><span class="set-v">' + A.esc(bankName || (ar ? "غير مضاف" : "Not set")) + '</span></div>'
      +     '<div class="set-row"><span class="set-k">IBAN</span><span class="set-v set-mono" dir="ltr">' + A.esc(bankIban || (ar ? "غير مضاف" : "Not set")) + '</span></div>'
      +   '</div>'
      +   '<p class="set-card-hint">' + (ar ? "التعديل من الملف لاحقاً — بدون رموز تقنية." : "Editable later — no technical tokens.") + '</p>'
      + '</section>'

      /* ② الحساب */
      + '<section class="set-card">'
      +   '<div class="set-card-head"><span class="set-card-ico" aria-hidden="true">☺</span><h2 class="set-card-title">' + (ar ? "الحساب" : "Account") + '</h2></div>'
      +   '<div class="set-list">'
      +     '<div class="set-row"><span class="set-k">' + (ar ? "الحالة" : "Status") + '</span><span class="set-v set-ok">' + A.esc(signed) + '</span></div>'
      +     (email
            ? ('<div class="set-row" id="emailRevealRow"><span class="set-k">' + (ar ? "البريد" : "Email") + '</span><span class="set-v set-mono" dir="ltr" id="emailRevealVal">' + A.esc(emailMasked) + '</span></div>')
            : ('<p class="set-card-note">' + (ar ? "ما في جلسة — ارجعي لشاشة الدخول." : "No session — return to sign-in.") + '</p>'))
      +   '</div>'
      +   (email
          ? ('<div class="set-actions">'
            + '<button type="button" class="set-pill set-pill-ghost" id="btnRevealEmail">' + (ar ? "إظهار / إخفاء البريد" : "Show / hide email") + '</button>'
            + '</div>')
          : "")
      +   '<p class="set-card-hint">' + (ar
          ? "كلمة السر من شاشة الدخول فقط. بعد الدخول الحفظ يزامن تلقائياً."
          : "Password only on the login screen. After sign-in, saves sync automatically.") + '</p>'
      +   '<div class="set-actions set-actions-end">'
      +     '<button type="button" class="set-pill set-pill-danger" id="btnLogout">' + (ar ? "خروج من اللوحة" : "Sign out") + '</button>'
      +   '</div>'
      + '</section>'

      /* ③ المزامنة */
      + '<section class="set-card">'
      +   '<div class="set-card-head"><span class="set-card-ico" aria-hidden="true">⇄</span><h2 class="set-card-title">' + (ar ? "المزامنة" : "Sync") + '</h2></div>'
      +   '<p class="set-card-note">' + (ar
          ? "الطلبات على هذا الجهاز. اسحبي من السحابة أو ارفعي نسخة."
          : "Orders stay on this device. Pull from cloud or push a copy.") + '</p>'
      +   '<div class="set-actions set-actions-row">'
      +     '<button type="button" class="set-pill set-pill-solid" id="btnPullOrders">' + (ar ? "سحب الطلبات" : "Pull orders") + '</button>'
      +     '<button type="button" class="set-pill set-pill-solid" id="btnPushOrders">' + (ar ? "رفع الطلبات" : "Push orders") + '</button>'
      +   '</div>'
      +   '<p class="set-status" id="settingsStatus" role="status" aria-live="polite"></p>'
      + '</section>'

      /* ④ المظهر */
      + '<section class="set-card">'
      +   '<div class="set-card-head"><span class="set-card-ico" aria-hidden="true">◐</span><h2 class="set-card-title">' + (ar ? "المظهر" : "Appearance") + '</h2></div>'
      +   '<div class="set-actions set-actions-row">'
      +     '<button type="button" class="set-pill set-pill-solid" id="btnThemeToggle">' + (ar ? "الوضع الليلي / النهاري" : "Dark / light mode") + '</button>'
      +   '</div>'
      + '</section>'

      /* ⑤ النشاط */
      + '<section class="set-card">'
      +   '<div class="set-card-head"><span class="set-card-ico" aria-hidden="true">☰</span><h2 class="set-card-title">' + (ar ? "سجل النشاط" : "Activity") + '</h2></div>'
      +   '<div id="activityBox" class="set-activity"></div>'
      + '</section>'

      + '</div>';

    try {
      if (A.activity && A.activity.render) A.activity.render(document.getElementById("activityBox"));
    } catch (eAct) {}

    var revealed = false;
    var rev = document.getElementById("btnRevealEmail");
    if (rev) {
      rev.onclick = function () {
        var val = document.getElementById("emailRevealVal");
        if (!val || !email) return;
        revealed = !revealed;
        val.textContent = revealed ? email : emailMasked;
      };
    }

    var pullO = document.getElementById("btnPullOrders");
    if (pullO) {
      pullO.onclick = function () {
        if (!A.pullOrdersCloud) {
          A.setMsg("settingsStatus", ar ? "المزامنة غير مفعّلة بعد." : "Sync not available yet.");
          return;
        }
        A.setMsg("settingsStatus", ar ? "جاري السحب…" : "Pulling…");
        A.pullOrdersCloud().then(function (ok) {
          A.setMsg("settingsStatus", ok
            ? (ar ? "تم سحب الطلبات ✓" : "Orders pulled ✓")
            : (ar ? "ما في طلبات سحابية أو فشل السحب." : "No cloud orders or pull failed."));
          if (ok && A.paintOrders) A.paintOrders();
        });
      };
    }
    var pushO = document.getElementById("btnPushOrders");
    if (pushO) {
      pushO.onclick = function () {
        if (!A.pushOrdersCloud) {
          A.setMsg("settingsStatus", ar ? "المزامنة غير مفعّلة بعد." : "Sync not available yet.");
          return;
        }
        A.setMsg("settingsStatus", ar ? "جاري الرفع…" : "Pushing…");
        A.pushOrdersCloud().then(function (ok) {
          A.setMsg("settingsStatus", ok
            ? (ar ? "تم رفع الطلبات ✓" : "Orders pushed ✓")
            : (ar ? "فشل الرفع — راجعي الدخول والقواعد." : "Push failed — check sign-in and rules."));
        });
      };
    }

    var th = document.getElementById("btnThemeToggle");
    if (th) th.onclick = function () { if (A.toggleAdminTheme) A.toggleAdminTheme(); };

    var logout = document.getElementById("btnLogout");
    if (logout) {
      logout.onclick = function () {
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
    }
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
