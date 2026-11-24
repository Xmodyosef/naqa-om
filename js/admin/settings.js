(function (w) {
  var A = w.NaqaAdmin;
  A.paintSettings = function () {
    var box = document.getElementById("settingsBox");
    if (!box) return;
    box.innerHTML =
      '<div class="panel settings">'
      + '<h2>' + A.t("setTitle") + '</h2>'
      + '<p class="note">' + A.t("setPin") + '</p>'
      + '<p class="note" style="border:1px solid #efe4df;border-radius:12px;padding:12px;background:#faf7f5">' + A.t("setSecure") + '</p>'
      + '<p class="note" style="color:#b05c6e">' + A.t("setTok") + '</p>'
      + '<label style="display:block;margin:8px 0;font-size:.8rem;font-weight:800;color:#8a7f78">' + A.t("setTokLabel") + '<input id="token" type="password" value="" autocomplete="off" placeholder="ghp_..."></label>'
      + (function () {
          var has = "";
          try { has = localStorage.getItem(A.TOKEN) || ""; } catch (e) {}
          if (!has) return '<button type="button" class="primary" id="btnSaveTok" style="width:100%;margin-top:8px">' + A.t("tokSaveBtn") + '</button>';
          return '<p class="note">' + A.t("tokSaved") + '</p>'
            + '<button type="button" class="mini" id="btnForgetTok">' + A.t("tokForget") + '</button>';
        })()
      + '<p class="note">' + A.t("setWa") + ': +' + A.esc(String(w.WA_NUMBER || "96879088349")) + '</p>'
      + '<p class="note" style="margin-top:10px"><b>' + (A.lang==="en"?"Bank (storefront)":"الحساب البنكي (المتجر)") + '</b><br>'
      + A.esc((w.BANK_NAME||"").trim() || (A.lang==="en"?"Name: not set":"الاسم: غير مضاف")) + '<br>'
      + A.esc((w.BANK_IBAN||"").trim() || (A.lang==="en"?"IBAN: not set — edit js/config.js":"الآيبان: غير مضاف — عدّلي js/config.js")) + '</p>'
      + '<p class="note" style="color:#8d3048">' + (A.lang==="en"?"PIN locks this device only. Orders arrive via the WhatsApp save link.":"الرمز يقفل هذا الجهاز فقط. الطلبات تصل عبر رابط الحفظ من واتساب.") + '</p>'
      + '<button type="button" class="primary" id="btnChangePin" style="width:100%;margin-top:8px">' + A.t("setPinBtn") + '</button>'
      + '<button type="button" class="logout" id="btnLogout" style="width:100%;margin-top:8px;border:0;border-radius:12px;padding:12px;font-weight:800">' + A.t("setOut") + '</button>'
      + '</div>';
    var saveTok = document.getElementById("btnSaveTok");
    if (saveTok) saveTok.onclick = function () {
      var v = (document.getElementById("token").value || "").trim();
      if (v.length < 8) { A.setMsg("settingsStatus", A.t("needTok2")); return; }
      A.keepToken(v);
      document.getElementById("token").value = "";
      A.setMsg("settingsStatus", A.t("tokSaved"));
      A.paintSettings();
    };
    var forgetTok = document.getElementById("btnForgetTok");
    if (forgetTok) forgetTok.onclick = function () {
      A.forgetToken();
      A.setMsg("settingsStatus", A.t("needTok2"));
      A.paintSettings();
    };
    document.getElementById("btnLogout").onclick = function () {
      if (confirm(A.t("setOutAsk"))) {
        document.getElementById("tools").hidden = true;
        document.getElementById("tabs").hidden = true;
        document.getElementById("savebar").hidden = true;
        document.getElementById("pin").hidden = false;
        document.getElementById("pinInput").value = "";
        if (A.clearSession) A.clearSession();
      }
    };
    document.getElementById("btnChangePin").onclick = function () {
      var n = prompt(A.t("setNewPin"));
      if (!n || n.trim().length < 4) return;
      A.hashPin(n.trim()).then(function (h) {
        localStorage.setItem(A.PIN_HASH, h);
        localStorage.removeItem(A.PIN);
        A.setMsg("settingsStatus", A.t("setPinOk"));
      });
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
    try { return (localStorage.getItem(A.TOKEN) || "").trim(); } catch (e) { return ""; }
  };
  A.keepToken = function (token) {
    try { localStorage.setItem(A.TOKEN, token); } catch (e) {}
  };
  A.forgetToken = function () {
    /* token kept on device */
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
      /* token kept on device */
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
