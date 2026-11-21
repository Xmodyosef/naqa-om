(function (w) {
  var A = w.NaqaAdmin;
  A.paintSettings = function () {
    var box = document.getElementById("settingsBox");
    if (!box) return;
    var tok = localStorage.getItem(A.TOKEN) || "";
    box.innerHTML =
      '<div class="panel settings">'
      + '<h2>الحساب والنشر</h2>'
      + '<p class="note">رمز الدخول على هذا الجهاز. رمز GitHub اختياري لمشاركة overrides والطلبات بين أجهزتك.</p>'
      + '<label style="display:block;margin:8px 0;font-size:.8rem;font-weight:800;color:#8a7f78">رمز GitHub (contents:write)<input id="token" type="password" value="' + A.esc(tok) + '" autocomplete="off" placeholder="ghp_..."></label>'
      + '<p class="note">واتساب المتجر: +' + A.esc(String(w.WA_NUMBER || "96879088349")) + '</p>'
      + '<button type="button" class="primary" id="btnChangePin" style="width:100%;margin-top:8px">تغيير رمز الدخول</button>'
      + '<button type="button" class="logout" id="btnLogout" style="width:100%;margin-top:8px;border:0;border-radius:12px;padding:12px;font-weight:800">خروج</button>'
      + '</div>';
    document.getElementById("btnLogout").onclick = function () {
      if (confirm("خروج من لوحة التحكم؟")) {
        document.getElementById("tools").hidden = true;
        document.getElementById("tabs").hidden = true;
        document.getElementById("savebar").hidden = true;
        document.getElementById("pin").hidden = false;
        document.getElementById("pinInput").value = "";
      }
    };
    document.getElementById("btnChangePin").onclick = function () {
      var n = prompt("رمز جديد (٤ أرقام على الأقل)");
      if (!n || n.trim().length < 4) return;
      localStorage.setItem(A.PIN, n.trim());
      A.setMsg("settingsStatus", "تم تغيير الرمز.");
    };
  };
  A.saveLocal = function () {
    if (A.editingId != null && document.getElementById("editView") && !document.getElementById("editView").hidden && A.saveEdit) A.saveEdit();
    localStorage.setItem(A.KEY, JSON.stringify(A.overrides));
    A.saveOrders();
    var tokEl = document.getElementById("token");
    if (tokEl && tokEl.value.trim()) localStorage.setItem(A.TOKEN, tokEl.value.trim());
    A.setMsg("status", "انحفظ على الجهاز.");
    A.setMsg("orderStatus", "انحفظ سجل الطلبات.");
    A.setMsg("settingsStatus", "انحفظ.");
  };
  A.publish = function () {
    if (A.editingId != null && document.getElementById("editView") && !document.getElementById("editView").hidden && A.saveEdit) A.saveEdit();
    localStorage.setItem(A.KEY, JSON.stringify(A.overrides));
    A.saveOrders();
    var token = (document.getElementById("token") && document.getElementById("token").value.trim()) || localStorage.getItem(A.TOKEN) || "";
    if (!token) {
      A.setMsg("status", "انحفظ محلياً. للنشر الصقي رمز GitHub في الإعدادات.");
      A.setMsg("settingsStatus", "يلزم رمز GitHub للنشر.");
      return;
    }
    localStorage.setItem(A.TOKEN, token);
    A.setMsg("status", "جاري النشر…");
    A.setMsg("settingsStatus", "جاري النشر…");
    Promise.all([
      A.ghPut("data/overrides.json", JSON.stringify(A.overrides, null, 2) + "\n", token, "chore: publish product overrides"),
      A.ghPut("data/orders.json", JSON.stringify(A.orders, null, 2) + "\n", token, "chore: publish orders log")
    ]).then(function (res) {
      if (!res[0].ok || !res[1].ok) throw new Error("HTTP");
      A.setMsg("status", "اننشرت المنتجات.");
      A.setMsg("orderStatus", "اننشرت الطلبات.");
      A.setMsg("settingsStatus", "اننشر للكل.");
    }).catch(function (err) {
      A.setMsg("status", "فشل النشر. " + (err && err.message ? err.message : ""));
      A.setMsg("settingsStatus", "فشل النشر.");
    });
  };
})(window);
