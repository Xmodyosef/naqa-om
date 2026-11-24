(function (w) {
  var A = w.NaqaAdmin;

  A.paintSettings = function () {
    var box = document.getElementById("settingsBox");
    if (!box) return;

    var email = "";
    try { email = (A.fbUser && A.fbUser.email) || ""; } catch (e) {}
    var wa = String(w.WA_NUMBER || "96879088349");
    var bankName = (w.BANK_NAME || "").trim();
    var bankIban = (w.BANK_IBAN || "").trim();
    var ar = A.lang !== "en";

    box.innerHTML =
      '<div class="settings-stack">'

      + '<section class="panel settings-sec">'
      +   '<h2>' + (ar ? "المتجر" : "Store") + '</h2>'
      +   '<p class="note">' + (ar ? "هذه بيانات المتجر للزبائن." : "Public store details.") + '</p>'
      +   '<div class="set-row"><span class="set-k">' + (ar ? "واتساب" : "WhatsApp") + '</span><span class="set-v" dir="ltr">+' + A.esc(wa) + '</span></div>'
      +   '<div class="set-row"><span class="set-k">' + (ar ? "البنك" : "Bank") + '</span><span class="set-v">' + A.esc(bankName || (ar ? "غير مضاف" : "Not set")) + '</span></div>'
      +   '<div class="set-row"><span class="set-k">IBAN</span><span class="set-v" dir="ltr">' + A.esc(bankIban || (ar ? "غير مضاف" : "Not set")) + '</span></div>'
      +   '<p class="note" style="margin-top:10px">' + (ar
          ? "لتعديل البنك أو الرقم لاحقاً: من ملف الإعدادات في المشروع (أو نضيف شاشة لاحقاً)."
          : "Bank/WhatsApp are set in project config for now.") + '</p>'
      + '</section>'

      + '<section class="panel settings-sec">'
      +   '<h2>' + (ar ? "الحساب" : "Account") + '</h2>'
      +   (email
          ? ('<div class="set-row"><span class="set-k">' + (ar ? "مسجّلة كـ" : "Signed in as") + '</span><span class="set-v" dir="ltr">' + A.esc(email) + '</span></div>')
          : ('<p class="note">' + (ar ? "ما في جلسة ظاهرة." : "No session visible.") + '</p>'))
      +   '<p class="note">' + (ar
          ? "كلمة سر اللوحة تُغيَّر من شاشة الدخول → «نسيت كلمة السر؟» (بريد Firebase). مو من هنا."
          : "Change login password from the login screen → Forgot password (Firebase email). Not here.") + '</p>'
      +   '<button type="button" class="logout" id="btnLogout" style="width:100%;margin-top:8px;border:0;border-radius:12px;padding:12px;font-weight:800">'
      +     (ar ? "خروج" : "Log out") + '</button>'
      + '</section>'

      + '<section class="panel settings-sec">'
      +   '<h2>' + (ar ? "الخصوصية" : "Privacy") + '</h2>'
      +   '<p class="note">' + A.t("setSecure") + '</p>'
      + '</section>'

      + '</div>';

    /* hidden field so publishLive can still read typed token if we inject later */
    if (!document.getElementById("token")) {
      var hid = document.createElement("input");
      hid.type = "hidden";
      hid.id = "token";
      hid.autocomplete = "off";
      box.appendChild(hid);
    }

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
        if (fbLogin) fbLogin.hidden = false;
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

  /** Ask once for GitHub PAT — never confuses with login password */
  A.askPublishToken = function () {
    var ar = A.lang !== "en";
    var msg = ar
      ? "لنشر تعديلات المنتجات على الموقع تحتاجين رمز GitHub (يبدأ غالباً بـ ghp_ أو github_pat_).\n\nهذا مو كلمة سر اللوحة ولا إيميل Firebase.\nإذا ما عندك الرمز، اتركي الحقل فاضي — التعديل يبقى على جهازك."
      : "To publish product edits to the live site you need a GitHub token (usually starts with ghp_ or github_pat_).\n\nThis is NOT your admin login password.\nLeave empty to keep changes on this device only.";
    var v = prompt(msg, "");
    if (v == null) return "";
    v = String(v).trim();
    if (!v) return "";
    if (v.length < 8 || (!/^gh[pous]_/i.test(v) && v.indexOf("github_pat_") !== 0 && v.indexOf("gho_") !== 0)) {
      var warn = ar
        ? "هذا الشكل ما يشبه رمز GitHub. ما نحفظه عشان ما ينخلط بكلمة السر. إذا متأكدة أنه صحيح، أرسلي لي من GitHub Developer settings."
        : "That does not look like a GitHub token. Not saved (to avoid password mix-ups).";
      A.setMsg("status", warn);
      A.setMsg("settingsStatus", warn);
      return "";
    }
    A.keepToken(v);
    return v;
  };

  A.publishLive = function () {
    if (A._publishing) { A._publishAgain = true; return; }
    var token = A.readToken();
    if (!token) token = A.askPublishToken();
    if (!token) {
      A.setMsg("status", A.lang === "en" ? "Saved on this device only (no publish)." : "انحفظ على الجهاز فقط (بدون نشر للموقع).");
      return;
    }
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
    var token = A.readToken();
    if (!token) token = A.askPublishToken();
    if (!token) {
      A.setMsg("status", A.lang === "en" ? "Saved on this device only." : "انحفظ على الجهاز فقط.");
      A.setMsg("settingsStatus", A.lang === "en" ? "Saved on this device only." : "انحفظ على الجهاز فقط.");
      return;
    }
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
      A.setMsg("status", A.t("publishedProducts"));
      A.setMsg("orderStatus", A.t("ordersStay"));
      A.setMsg("settingsStatus", A.t("published"));
      var rs = document.getElementById("reviewStatus");
      if (rs) rs.textContent = A.t("reviewsOk");
    }).catch(function (err) {
      try { A.forgetToken(); } catch (e) {}
      A.setMsg("status", A.t("publishFail") + " " + (err && err.message ? err.message : ""));
      A.setMsg("settingsStatus", A.t("publishFail"));
    });
  };
})(window);
