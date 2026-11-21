(function (w) {
  var A = w.NaqaAdmin;
  var TABS = ["home", "orders", "products", "customers", "finance", "settings"];

  A.setTab = function (tab) {
    if (TABS.indexOf(tab) < 0) tab = "home";
    document.querySelectorAll("#tabs button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-tab") === tab);
    });
    TABS.forEach(function (t) {
      var el = document.getElementById(t + "Tab");
      if (el) el.hidden = t !== tab;
    });
    if (tab === "home" && A.paintDashboard) A.paintDashboard();
    if (tab === "orders" && A.paintOrders) A.paintOrders();
    if (tab === "products" && A.paintList) A.paintList(document.getElementById("q") ? document.getElementById("q").value.trim() : "");
    if (tab === "customers" && A.paintCustomers) A.paintCustomers();
    if (tab === "finance" && A.paintFinance) A.paintFinance();
    if (tab === "settings" && A.paintSettings) A.paintSettings();
    try { history.replaceState(null, "", "#/" + tab); } catch (e) {}
  };

  A.openAdmin = function () {
    document.getElementById("pin").hidden = true;
    document.getElementById("tools").hidden = false;
    document.getElementById("tabs").hidden = false;
    document.getElementById("savebar").hidden = false;
    var wa = document.getElementById("waOrders");
    if (wa) wa.href = "https://wa.me/" + (w.WA_NUMBER || "96879088349");
    A.loadRemoteOrders();
    var hash = (location.hash || "").replace(/^#\/?/, "");
    var start = TABS.indexOf(hash) >= 0 ? hash : "home";
    A.setTab(start);
  };

  document.getElementById("pinGo").onclick = function () {
    var typed = document.getElementById("pinInput").value.trim();
    var have = localStorage.getItem(A.PIN);
    var msg = document.getElementById("pinMsg");
    if (!typed || typed.length < 4) { msg.textContent = "الرمز ٤ أرقام على الأقل."; return; }
    if (!have) { localStorage.setItem(A.PIN, typed); A.openAdmin(); return; }
    if (typed === have) A.openAdmin();
    else msg.textContent = "الرمز غير صحيح.";
  };

  document.getElementById("tabs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-tab]");
    if (!b) return;
    A.setTab(b.getAttribute("data-tab"));
  });

  var q = document.getElementById("q");
  if (q) q.addEventListener("input", function (e) { A.paintList(e.target.value.trim()); });

  var list = document.getElementById("list");
  if (list) list.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-open]");
    if (!btn) return;
    A.openEdit(+btn.getAttribute("data-open"));
  });

  var ordersList = document.getElementById("ordersList");
  if (ordersList) ordersList.addEventListener("click", function (e) {
    var del = e.target.closest("[data-del]");
    if (del) {
      var idDel = del.getAttribute("data-del");
      A.orders = A.orders.filter(function (o) { return String(o.id) !== String(idDel); });
      A.saveOrders();
      A.paintOrders();
      A.setMsg("orderStatus", "انحذف " + idDel);
      return;
    }
    var st = e.target.closest("[data-st]");
    if (st) {
      var id = st.getAttribute("data-oid");
      var next = st.getAttribute("data-st");
      A.orders.forEach(function (o) {
        if (String(o.id) === String(id)) o.status = next;
      });
      A.saveOrders();
      A.paintOrders();
      A.setMsg("orderStatus", "حالة " + id + " → " + (A.STATUS[next] || next));
    }
  });

  var statusBarEl = document.getElementById("statusBar");
  if (statusBarEl) statusBarEl.addEventListener("click", function (e) {
    var f = e.target.closest("[data-filter]");
    if (!f) return;
    A.orderFilter = f.getAttribute("data-filter") || "all";
    A.paintOrders();
  });

  document.getElementById("saveLocal").onclick = function () { A.saveLocal(); };
  document.getElementById("publish").onclick = function () { A.publish(); };
})(window);
