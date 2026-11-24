(function (w) {
  var A = w.NaqaAdmin;

  A.paintSettings = function () {
    var box = document.getElementById("settingsBox");
    if (!box) return;

    var email = "";
    try { email = (A.fbUser && A.fbUser.email) || ""; } catch (e) {}
    var hasTok = false;
    try { hasTok = !!(A.readToken && A.readToken()); } catch (e) {}
    var wa = String(w.WA_NUMBER || "96879088349");
    var bankName = (w.BANK_NAME || "").trim();
    var bankIban = (w.BANK_IBAN || "").trim();
    var ar = A.lang !== "en";

    box.innerHTML =
      '<div class="settings-stack">'

      /* 1) Store */
      + '<section class="panel settings-sec">'
      +   '<h2>' + (ar ? "المتجر" : "Store") + '</h2>'
      +   '<p class="note">' + (ar ? "بيانات تظهر للزبائن (من الإعدادات الثابتة)." : "Public store details (from config).") + '</p>'
      +   '<div class="set-row"><span class="set-k">' + (ar ? "واتساب" : "WhatsApp") + '</span><span class="set-v" dir="ltr">+' + A.esc(wa) + '</span></div>'
      +   '<div class="set-row"><span class="set-k">' + (ar ? "البنك" : "Bank") + '</span><span class="set-v">' + A.esc(bankName || (ar ? "غير مضاف" : "Not set")) + '</span></div>'
      +   '<div class="set-row"><span class="set-k">IBAN</span><span class="set-v" dir="ltr">' + A.esc(bankIban || (ar ? "غير مضاف — js/config.js" : "Not set — js/config.js")) + '</span></div>'
      + '</section>'

      /* 2) Publish */
      + '<section class="panel settings-sec">'
      +   '<h2>' + (ar ? "النشر على الموقع" : "Publish to site") + '</h2>'
      +   '<p class="note">' + (ar
          ? "رمز GitHub ينشر تعديلات المنتجات (سعر، كمية، إخفاء). ينحفظ في هذه الجلسة فقط."
          : "GitHub token publishes product edits (price, stock, hide). Stored for this session only.") + '</p>'
      +   '<label class="set-lab">' + (ar ? "رمز GitHub (contents:write)" : "GitHub token (contents:write)")
      +     '<input id="token" type="password" value="" autocomplete="off" placeholder="ghp_..."></label>'
      +   (hasTok
          ? ('<p class="note set-ok">' + (ar ? "✓ الرمز محفوظ في هذه الجلسة" : "✓ Token saved for this session") + '</p>'
             + '<button type="button" class="mini" id="btnForgetTok">' + (ar ? "نسيان الرمز" : "Forget token") + '</button>')
          : ('<button type="button" class="primary" id="btnSaveTok" style="width:100%;margin-top:8px">' + (ar ? "حفظ الرمز" : "Save token") + '</button>'))
      + '</section>'

      /* 3) Account — Firebase only */
      + '<section class="panel settings-sec">'
      +   '<h2>' + (ar ? "الحساب" : "Account") + '</h2>'
      +   (email
          ? ('<div class="set-row"><span class="set-k">' + (ar ? "مسجّلة كـ" : "Signed in as") + '</span><span class="set-v" dir="ltr">' + A.esc(email) + '</span></div>')
          : ('<p class="note">' + (ar ? "ما في جلسة Firebase ظاهرة." : "No Firebase session visible.") + '</p>'))
      +   '<p class="note">' + (ar
          ? "تغيير كلمة السر يتم من «نسيت كلمة السر؟» في شاشة الدخول، أو من بريد Firebase."
          : "Change password via “Forgot password?” on the login screen or Firebase email.") + '</p>'
      +   '<button type="button" class="logout" id="btnLogout" style="width:100%;margin-top:8px;border:0;border-radius:12px;padding:12px;font-weight:800">'
      +     (ar ? "خروج" : "Log out") + '</button>'
      + '</section>'

      /* 4) Privacy note */
      + '<section class="panel settings-sec">'
      +   '<h2>' + (ar ? "الخصوصية" : "Privacy") + '</h2>'
      +   '<p class="note">' + A.t("setSecure") + '</p>'
      + '</section>'

      + '</div>';

    var saveTok = document.getElementById("btnSaveTok");
    if (saveTok) saveTok.onclick = function () {
      var v = (document.getElementById("token") && document.getElementById("token").value || "").trim();
      if (v.length < 8) { A.setMsg("settingsStatus", A.t("needTok2")); return; }
      A.keepToken(v);
      if (document.getElementById("token")) document.getElementById("token").value = "";
      A.setMsg("settingsStatus", A.t("tokSaved"));
      A.paintSettings();
    };
    var forgetTok = document.getElementById("btnForgetTok");
    if (forgetTok) forgetTok.onclick = function () {
      A.forgetToken();
      A.setMsg("settingsStatus", A.t("needTok2"));
      A.paintSettings();
    };
    var logout = document.getElementById("btnLogout");
    if (logout) logout.onclick = function () {
      if (!confirm(A.t("setOutAsk"))) return;
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
        var fbLogin = document.getElementById("fbLogin");
        var pinRow = document.getElementById("pinRow");
        if (fbLogin) fbLogin.hidden = false;
        if (pinRow) pinRow.hidden = true;
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

  A.readToken = function () {
    var el = document.getElementById("token");
    var typed = el && el.value ? el.value.trim() : "";
    if (typed) return typed;
    try {
      var sess = (sessionStorage.getItem(A.TOKEN) || "").trim();
      if (sess) return sess;
      var oldTok = (localStorage.getItem(A.TOKEN) || "").trim();
      if (oldTok) {
        sessionStorage.setItem(A.TOKEN, oldTok);
        localStorage.removeItem(A.TOKEN);
        return oldTok;
      }
    } catch (e) {}
    return "";
  };

  A.keepToken = function (token) {
    try { sessionStorage.setItem(A.TOKEN, token); } catch (e) {}
  };

  A.forgetToken = function () {
    try { sessionStorage.removeItem(A.TOKEN); } catch (e) {}
    try { localStorage.removeItem(A.TOKEN); } catch (e) {}
    var el = document.getElementById("token");
    if (el) el.value = "";
  };

  A.publishLive = function () {
    if (A._publishing) { A._publishAgain = true; return; }
    var typedEl = document.getElementById("token");
    var typed = typedEl && typedEl.value ? typedEl.value.trim() : "";
    var token = typed || A.readToken();
    if (!token) {
      A.setMsg("status", A.t("needTok"));
      return;
    }
    if (typed) A.keepToken(typed);
    A._publishing = true;
    A.setMsg("status", A.t("publishing"));
    var chain = A.materializeProductImages ? A.materializeProductImages(token) : Promise.resolve();
    chain.then(function () {
      try { localStorage.setItem(A.KEY, JSON.stringify(A.overrides)); } catch (e) {}
      return A.ghPut("data/overrides.json", JSON.stringify(A.overrides, null, 2) + "\n", token, "chore: publish product overrides");
    }).then(function (res) {
      if (res && (res.status === 401 || res.status === 403)) {
        A.forgetToken();
        throw new Error("auth");
      }
      if (!res || !res.ok) throw new Error("HTTP");
      if (typedEl) typedEl.value = "";
      A.setMsg("status", A.t("p_live"));
    }).catch(function () {
      A.setMsg("status", A.t("publishFail"));
    }).then(function () {
      A._publishing = false;
      if (A._publishAgain) { A._publishAgain = false; A.publishLive(); }
    });
  };

  A.publish = function () {
    if (A.editingId != null && document.getElementById("editView") && !document.getElementById("editView").hidden && A.saveEdit) A.saveEdit({ skipPublish: true });
    try { localStorage.setItem(A.KEY, JSON.stringify(A.overrides)); } catch (e) {}
    A.saveOrders();
    var tokenEl = document.getElementById("token");
    var typed = tokenEl && tokenEl.value ? tokenEl.value.trim() : "";
    var token = typed || A.readToken();
    if (!token) {
      A.setMsg("status", A.t("needTok"));
      A.setMsg("settingsStatus", A.t("needTok2"));
      return;
    }
    if (typed) A.keepToken(typed);
    A.setMsg("status", A.t("publishing"));
    A.setMsg("settingsStatus", A.t("publishing"));
    var chain = Promise.resolve();
    if (A.materializeProductImages) chain = A.materializeProductImages(token);
    chain.then(function () {
      var jobs = [
        A.ghPut("data/overrides.json", JSON.stringify(A.overrides, null, 2) + "\n", token, "chore: publish product overrides")
      ];
      if (A.publishReviews) jobs.push(A.publishReviews(token));
      return Promise.all(jobs);
    }).then(function (res) {
      if (!res[0].ok || (res[1] && !res[1].ok)) throw new Error("HTTP");
      if (tokenEl) tokenEl.value = "";
      A.setMsg("status", A.t("publishedProducts"));
      A.setMsg("orderStatus", A.t("ordersStay"));
      A.setMsg("settingsStatus", A.t("published"));
      var rs = document.getElementById("reviewStatus");
      if (rs) rs.textContent = A.t("reviewsOk");
    }).catch(function (err) {
      if (tokenEl) tokenEl.value = "";
      try { localStorage.removeItem(A.TOKEN); } catch (e) {}
      A.setMsg("status", A.t("publishFail") + " " + (err && err.message ? err.message : ""));
      A.setMsg("settingsStatus", A.t("publishFail"));
    });
  };
})(window);
