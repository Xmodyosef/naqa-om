/* Activity log + dark mode + command palette (admin UX extras). */
(function (w) {
  "use strict";
  var A = w.NaqaAdmin = w.NaqaAdmin || {};
  var ACT_KEY = "naqa_activity_log";
  var THEME_KEY = "naqa_admin_theme";

  A.activity = A.activity || {
    list: function () {
      try { return JSON.parse(localStorage.getItem(ACT_KEY) || "[]"); } catch (e) { return []; }
    },
    log: function (action, detail) {
      try {
        var rows = A.activity.list();
        rows.unshift({
          at: new Date().toISOString(),
          action: String(action || "").slice(0, 80),
          detail: String(detail || "").slice(0, 160)
        });
        localStorage.setItem(ACT_KEY, JSON.stringify(rows.slice(0, 80)));
      } catch (e) {}
    },
    render: function (el) {
      if (!el) return;
      var rows = A.activity.list();
      var ar = A.lang !== "en";
      if (!rows.length) {
        el.innerHTML = '<p class="set-act-empty">' + (ar ? "لا أحداث مسجّلة بعد." : "No recorded activity yet.") + "</p>";
        return;
      }
      function ago(iso) {
        try {
          var t = new Date(iso).getTime();
          if (!isFinite(t)) return iso || "";
          var d = Math.max(0, Date.now() - t);
          var m = Math.floor(d / 60000);
          if (m < 1) return ar ? "الآن" : "now";
          if (m < 60) return (ar ? "قبل " + m + " د" : m + "m ago");
          var h = Math.floor(m / 60);
          if (h < 48) return (ar ? "قبل " + h + " س" : h + "h ago");
          var days = Math.floor(h / 24);
          return ar ? "قبل " + days + " يوم" : days + "d ago";
        } catch (e) { return iso || ""; }
      }
      el.innerHTML = '<ul class="set-act-list">' + rows.slice(0, 12).map(function (r) {
        return '<li class="set-act-item">'
          + '<span class="set-act-what">' + A.esc(r.action) + '</span>'
          + (r.detail ? '<span class="set-act-detail">' + A.esc(r.detail) + '</span>' : '')
          + '<span class="set-act-when" dir="ltr">' + A.esc(ago(r.at)) + '</span>'
          + '</li>';
      }).join("") + '</ul>';
    }
  };

  A.applyAdminTheme = function (mode) {
    mode = mode === "dark" ? "dark" : "light";
    try { localStorage.setItem(THEME_KEY, mode); } catch (e) {}
    document.documentElement.setAttribute("data-admin-theme", mode);
    document.body.classList.toggle("admin-dark", mode === "dark");
  };
  A.toggleAdminTheme = function () {
    var cur = "light";
    try { cur = localStorage.getItem(THEME_KEY) || "light"; } catch (e) {}
    A.applyAdminTheme(cur === "dark" ? "light" : "dark");
  };
  try {
    var m = localStorage.getItem(THEME_KEY) || "light";
    A.applyAdminTheme(m);
  } catch (e) {}

  A.openCommandPalette = function () {
    var ar = A.lang !== "en";
    var existing = document.getElementById("naqaCmd");
    if (existing) { existing.remove(); return; }
    var wrap = document.createElement("div");
    wrap.id = "naqaCmd";
    wrap.className = "naqa-cmd";
    wrap.innerHTML = '<div class="naqa-cmd-card" role="dialog" aria-label="Command">'
      + '<input type="search" id="naqaCmdInput" placeholder="' + (ar ? "بحث في الأوامر… (طلبات، منتجات، مالية، مظهر)" : "Search commands… (orders, products, finance, theme)") + '" autocomplete="off" />'
      + '<div id="naqaCmdList" class="naqa-cmd-list"></div>'
      + '<p class="note" style="margin:8px 4px 0;font-size:.75rem">Esc ' + (ar ? "للإغلاق" : "to close") + " · Ctrl/⌘ K</p>"
      + "</div>";
    document.body.appendChild(wrap);
    var cmds = [
      { id: "home", label: ar ? "الرئيسية" : "Home", run: function () { A.go("home", ""); } },
      { id: "orders", label: ar ? "الطلبات" : "Orders", run: function () { A.go("orders", "all"); } },
      { id: "products", label: ar ? "المنتجات" : "Products", run: function () { A.go("products", "all"); } },
      { id: "finance", label: ar ? "المالية" : "Finance", run: function () { A.go("finance", ""); } },
      { id: "settings", label: ar ? "الإعدادات" : "Settings", run: function () { A.go("settings", ""); } },
      { id: "theme", label: ar ? "تبديل الوضع الليلي" : "Toggle dark mode", run: function () { A.toggleAdminTheme(); } },
      { id: "pull", label: ar ? "سحب الطلبات سحابياً" : "Pull cloud orders", run: function () { if (A.pullOrdersCloud) A.pullOrdersCloud(); } }
    ];
    function paint(q) {
      q = String(q || "").toLowerCase();
      var list = document.getElementById("naqaCmdList");
      if (!list) return;
      list.innerHTML = cmds.filter(function (c) {
        return !q || c.label.toLowerCase().indexOf(q) >= 0 || c.id.indexOf(q) >= 0;
      }).map(function (c) {
        return '<button type="button" class="naqa-cmd-item" data-cmd="' + c.id + '">' + A.esc(c.label) + "</button>";
      }).join("") || ('<p class="note">' + (ar ? "لا نتائج" : "No matches") + "</p>");
    }
    paint("");
    wrap.addEventListener("click", function (e) {
      if (e.target === wrap) wrap.remove();
      var b = e.target.closest("[data-cmd]");
      if (b) {
        var c = cmds.find(function (x) { return x.id === b.getAttribute("data-cmd"); });
        wrap.remove();
        if (c) c.run();
      }
    });
    var inp = document.getElementById("naqaCmdInput");
    if (inp) {
      inp.focus();
      inp.addEventListener("input", function () { paint(inp.value); });
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Escape") wrap.remove();
        if (e.key === "Enter") {
          var first = document.querySelector("#naqaCmdList [data-cmd]");
          if (first) first.click();
        }
      });
    }
  };

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      A.openCommandPalette();
    }
  });

  /* Hook log on common actions */
  var _th = A.toggleHide;
  if (_th) {
    A.toggleHide = function (id) {
      A.activity.log(A.lang === "en" ? "Toggle hide" : "إخفاء/إظهار", "id=" + id);
      return _th.apply(this, arguments);
    };
  }
})(window);
