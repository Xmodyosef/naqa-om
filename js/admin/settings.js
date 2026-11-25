(function (w) {
  var A = w.NaqaAdmin;
  var STORE_KEY = "naqa_store_cfg";

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

  function defaultStore() {
    return {
      wa: String(w.WA_NUMBER || "96879088349").replace(/\D/g, "") || "96879088349",
      bankName: String(w.BANK_NAME || "").trim(),
      bankIban: String(w.BANK_IBAN || "").trim()
    };
  }

  function loadStoreCfg() {
    var base = defaultStore();
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return base;
      var o = JSON.parse(raw);
      if (!o || typeof o !== "object") return base;
      if (o.wa) base.wa = String(o.wa).replace(/\D/g, "") || base.wa;
      if (o.bankName != null) base.bankName = String(o.bankName).trim();
      if (o.bankIban != null) base.bankIban = String(o.bankIban).trim().replace(/\s+/g, " ");
    } catch (e) {}
    return base;
  }

  function applyStoreCfg(cfg) {
    if (!cfg) return;
    var wa = String(cfg.wa || "").replace(/\D/g, "");
    if (wa) {
      try { w.WA_NUMBER = wa; } catch (e) {}
    }
    try { w.BANK_NAME = String(cfg.bankName || ""); } catch (e2) {}
    try { w.BANK_IBAN = String(cfg.bankIban || ""); } catch (e3) {}
    try {
      var a = document.getElementById("waAdmin");
      if (a && wa) a.href = "https://wa.me/" + wa;
    } catch (e4) {}
  }

  function saveStoreCfg(cfg) {
    var clean = {
      wa: String(cfg.wa || "").replace(/\D/g, ""),
      bankName: String(cfg.bankName || "").trim(),
      bankIban: String(cfg.bankIban || "").trim().replace(/\s+/g, " ")
    };
    try { localStorage.setItem(STORE_KEY, JSON.stringify(clean)); } catch (e) {}
    applyStoreCfg(clean);
    /* optional cloud public doc for store (if signed in) */
    try {
      if (w.firebase && firebase.apps && firebase.apps.length && firebase.firestore) {
        var u = firebase.auth && firebase.auth().currentUser;
        if (u) {
          firebase.firestore().collection("naqa").doc("store").set({
            wa: clean.wa,
            bankName: clean.bankName,
            bankIban: clean.bankIban,
            updatedAt: (firebase.firestore.FieldValue && firebase.firestore.FieldValue.serverTimestamp)
              ? firebase.firestore.FieldValue.serverTimestamp()
              : new Date().toISOString(),
            updatedBy: u.uid || ""
          }, { merge: true }).catch(function () {});
        }
      }
    } catch (eC) {}
    return clean;
  }

  /* apply saved cfg as soon as module loads */
  try { applyStoreCfg(loadStoreCfg()); } catch (e0) {}

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

    var cfg = loadStoreCfg();
    applyStoreCfg(cfg);
    var emailMasked = maskEmail(email);
    var signed = email
      ? (ar ? "مسجّل الدخول ✓" : "Signed in ✓")
      : (ar ? "غير مسجّل" : "Not signed in");
    var langLabel = A.lang === "en" ? "English" : "العربية";

    box.innerHTML =
      '<div class="settings-stack">'

      /* ① المتجر — قابل للتعديل */
      + '<section class="set-card" id="setStoreCard">'
      +   '<div class="set-card-head"><span class="set-card-ico" aria-hidden="true">◈</span><h2 class="set-card-title">' + (ar ? "المتجر" : "Store") + '</h2></div>'
      +   '<p class="set-card-note">' + (ar ? "بيانات واتساب والبنك تظهر للزبون. عدّل الحقول ثم احفظ." : "WhatsApp and bank details appear to customers. Edit the fields, then save.") + '</p>'
      +   '<div class="set-fields">'
      +     '<label class="set-field"><span class="set-field-lab">' + (ar ? "واتساب (مع مفتاح الدولة)" : "WhatsApp (with country code)") + '</span>'
      +       '<input type="tel" id="setWa" class="set-input" dir="ltr" inputmode="numeric" autocomplete="tel" placeholder="9687xxxxxxx" value="' + A.esc(cfg.wa) + '" /></label>'
      +     '<label class="set-field"><span class="set-field-lab">' + (ar ? "اسم البنك" : "Bank name") + '</span>'
      +       '<input type="text" id="setBankName" class="set-input" autocomplete="organization" placeholder="' + (ar ? "مثال: بنك مسقط" : "e.g. Bank Muscat") + '" value="' + A.esc(cfg.bankName) + '" /></label>'
      +     '<label class="set-field"><span class="set-field-lab">IBAN</span>'
      +       '<input type="text" id="setBankIban" class="set-input set-mono" dir="ltr" autocomplete="off" placeholder="OM…" value="' + A.esc(cfg.bankIban) + '" /></label>'
      +   '</div>'
      +   '<div class="set-actions set-actions-row">'
      +     '<button type="button" class="set-pill set-pill-solid" id="btnSaveStore">' + (ar ? "حفظ بيانات المتجر" : "Save store details") + '</button>'
      +   '</div>'
      +   '<p class="set-status" id="storeStatus" role="status" aria-live="polite"></p>'
      + '</section>'

      /* ② الحساب + لغة */
      + '<section class="set-card">'
      +   '<div class="set-card-head"><span class="set-card-ico" aria-hidden="true">☺</span><h2 class="set-card-title">' + (ar ? "الحساب" : "Account") + '</h2></div>'
      +   '<div class="set-list">'
      +     '<div class="set-row"><span class="set-k">' + (ar ? "الحالة" : "Status") + '</span><span class="set-v set-ok">' + A.esc(signed) + '</span></div>'
      +     (email
            ? ('<div class="set-row"><span class="set-k">' + (ar ? "البريد" : "Email") + '</span><span class="set-v set-mono" dir="ltr" id="emailRevealVal">' + A.esc(emailMasked) + '</span></div>')
            : ('<p class="set-card-note">' + (ar ? "لا جلسة نشطة — العودة إلى شاشة الدخول." : "No active session — return to the sign-in screen.") + '</p>'))
      +     '<div class="set-row"><span class="set-k">' + (ar ? "لغة اللوحة" : "Panel language") + '</span><span class="set-v" id="setLangVal">' + A.esc(langLabel) + '</span></div>'
      +   '</div>'
      +   '<div class="set-actions set-actions-row">'
      +     (email ? '<button type="button" class="set-pill set-pill-ghost" id="btnRevealEmail">' + (ar ? "إظهار / إخفاء البريد" : "Show / hide email") + '</button>' : '')
      +     '<button type="button" class="set-pill set-pill-solid" id="btnToggleLang">' + (ar ? "English" : "العربية") + '</button>'
      +   '</div>'
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
          ? "سحب الطلبات من السحابة إلى هذا الجهاز، أو رفع نسخة احتياطية."
          : "Pull orders from the cloud to this device, or push a backup.") + '</p>'
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

      /* ⑤ النشاط — زر ثم عرض */
      + '<section class="set-card" id="setActivityCard">'
      +   '<div class="set-card-head"><span class="set-card-ico" aria-hidden="true">☰</span><h2 class="set-card-title">' + (ar ? "سجل النشاط" : "Activity log") + '</h2></div>'
      +   '<p class="set-card-note">' + (ar
          ? "سجل موجز لعمليات اللوحة (حفظ، مزامنة، تعديل)."
          : "A brief log of panel actions (save, sync, edits).") + '</p>'
      +   '<div class="set-actions set-actions-row" id="activityClosedBar">'
      +     '<button type="button" class="set-pill set-pill-solid" id="btnOpenActivity">' + (ar ? "عرض سجل النشاط" : "View activity log") + '</button>'
      +   '</div>'
      +   '<div id="activityPanel" class="set-act-panel" hidden>'
      +     '<div class="set-actions set-actions-row" style="margin-top:0;margin-bottom:8px">'
      +       '<button type="button" class="set-pill set-pill-ghost" id="btnCloseActivity">' + (ar ? "إغلاق" : "Close") + '</button>'
      +       '<button type="button" class="set-pill set-pill-ghost" id="btnClearActivity">' + (ar ? "مسح السجل" : "Clear log") + '</button>'
      +     '</div>'
      +     '<div id="activityBox" class="set-activity"></div>'
      +   '</div>'
      + '</section>'

      + '</div>';

    try {
      if (A.activity && A.activity.render) A.activity.render(document.getElementById("activityBox"));
    } catch (eAct) {}

    var actPanel = document.getElementById("activityPanel");
    var actClosed = document.getElementById("activityClosedBar");
    var openAct = document.getElementById("btnOpenActivity");
    var closeAct = document.getElementById("btnCloseActivity");
    var clearAct = document.getElementById("btnClearActivity");
    function showActivity(on) {
      if (actPanel) actPanel.hidden = !on;
      if (actClosed) actClosed.hidden = !!on;
      if (on) {
        try {
          if (A.activity && A.activity.render) A.activity.render(document.getElementById("activityBox"));
        } catch (e) {}
      }
    }
    if (openAct) openAct.onclick = function () { showActivity(true); };
    if (closeAct) closeAct.onclick = function () { showActivity(false); };
    if (clearAct) {
      clearAct.onclick = function () {
        var ask = ar ? "مسح سجل النشاط؟" : "Clear the activity log?";
        if (!confirm(ask)) return;
        try {
          localStorage.removeItem("naqa_activity_log");
        } catch (e) {}
        try {
          if (A.activity && A.activity.render) A.activity.render(document.getElementById("activityBox"));
        } catch (e2) {}
        A.setMsg("settingsStatus", ar ? "تم مسح سجل النشاط." : "Activity log cleared.");
      };
    }

    /* حفظ المتجر */
    var saveBtn = document.getElementById("btnSaveStore");
    if (saveBtn) {
      saveBtn.onclick = function () {
        var waEl = document.getElementById("setWa");
        var bnEl = document.getElementById("setBankName");
        var biEl = document.getElementById("setBankIban");
        var wa = (waEl && waEl.value || "").replace(/\D/g, "");
        if (wa.length < 8) {
          A.setMsg("storeStatus", ar ? "رقم واتساب غير مكتمل." : "WhatsApp number looks incomplete.");
          return;
        }
        var saved = saveStoreCfg({
          wa: wa,
          bankName: bnEl ? bnEl.value : "",
          bankIban: biEl ? biEl.value : ""
        });
        if (waEl) waEl.value = saved.wa;
        if (biEl) biEl.value = saved.bankIban;
        A.setMsg("storeStatus", ar ? "تم حفظ بيانات المتجر ✓" : "Store details saved ✓");
        try {
          if (A.activity && A.activity.log) A.activity.log(ar ? "حفظ بيانات المتجر" : "Store details saved", "WhatsApp · Bank");
          if (A.activity && A.activity.render) A.activity.render(document.getElementById("activityBox"));
        } catch (eL) {}
      };
    }

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

    var langBtn = document.getElementById("btnToggleLang");
    if (langBtn) {
      langBtn.onclick = function () {
        var next = A.lang === "en" ? "ar" : "en";
        if (A.setLang) {
          A.setLang(next);
          /* repaint after dict load */
          setTimeout(function () {
            if (A.paintSettings) A.paintSettings();
          }, 80);
        } else {
          A.lang = next;
          try { localStorage.setItem("naqa_admin_lang", next); } catch (e) {}
          A.paintSettings();
        }
      };
    }

    var pullO = document.getElementById("btnPullOrders");
    if (pullO) {
      pullO.onclick = function () {
        if (!A.pullOrdersCloud) {
          A.setMsg("settingsStatus", ar ? "المزامنة غير مفعّلة حالياً." : "Sync is not available yet.");
          return;
        }
        A.setMsg("settingsStatus", ar ? "جاري السحب…" : "Pulling…");
        A.pullOrdersCloud().then(function (ok) {
          A.setMsg("settingsStatus", ok
            ? (ar ? "تم سحب الطلبات ✓" : "Orders pulled ✓")
            : (ar ? "لا طلبات سحابية أو تعذّر السحب." : "No cloud orders, or pull failed."));
          if (ok && A.paintOrders) A.paintOrders();
          try { if (A.activity && A.activity.log) A.activity.log(ar ? "سحب طلبات" : "Pull orders", ok ? "ok" : "fail"); } catch (e) {}
        }).catch(function () {
          A.setMsg("settingsStatus", ar ? "تعذّر السحب." : "Pull failed.");
        });
      };
    }
    var pushO = document.getElementById("btnPushOrders");
    if (pushO) {
      pushO.onclick = function () {
        if (!A.pushOrdersCloud) {
          A.setMsg("settingsStatus", ar ? "المزامنة غير مفعّلة حالياً." : "Sync is not available yet.");
          return;
        }
        A.setMsg("settingsStatus", ar ? "جاري الرفع…" : "Pushing…");
        A.pushOrdersCloud().then(function (ok) {
          A.setMsg("settingsStatus", ok
            ? (ar ? "تم رفع الطلبات ✓" : "Orders pushed ✓")
            : (ar ? "تعذّر الرفع — تحقق من تسجيل الدخول." : "Push failed — check sign-in."));
          try { if (A.activity && A.activity.log) A.activity.log(ar ? "رفع طلبات" : "Push orders", ok ? "ok" : "fail"); } catch (e) {}
        }).catch(function () {
          A.setMsg("settingsStatus", ar ? "تعذّر الرفع." : "Push failed.");
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
