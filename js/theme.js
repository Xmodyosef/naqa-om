/* Day / night / auto theme (Muscat-friendly hours) */
(function (w) {
  "use strict";
  var KEY = "naqa_theme"; // auto | day | night
  var mode = "auto";

  function hourMuscat() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Muscat", hour: "numeric", hour12: false
      }).formatToParts(new Date());
      var h = parts.find(function (p) { return p.type === "hour"; });
      return h ? parseInt(h.value, 10) : new Date().getHours();
    } catch (e) {
      return new Date().getHours();
    }
  }

  function resolve(m) {
    if (m === "day" || m === "night") return m;
    // auto: day 6:00–17:59, night otherwise (Oman)
    var h = hourMuscat();
    return (h >= 6 && h < 18) ? "day" : "night";
  }

  function apply(m) {
    mode = m || mode;
    var resolved = resolve(mode);
    var root = document.documentElement;
    root.setAttribute("data-theme", resolved);
    root.setAttribute("data-theme-mode", mode);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolved === "night" ? "#1a1412" : "#b05c6e");
    var btn = document.getElementById("themeBtn");
    if (btn) {
      var en = mode === "night" ? "Night" : (mode === "day" ? "Day" : "Auto");
      var ar = mode === "night"
        ? ((typeof T === "function" && T("themeNight")) || "مسائي")
        : (mode === "day"
          ? ((typeof T === "function" && T("themeDay")) || "صباحي")
          : ((typeof T === "function" && T("themeAuto")) || "تلقائي"));
      var label = (typeof lang !== "undefined" && lang === "en") ? en : ar;
      var icon = resolved === "night" ? "☾" : "☀";
      btn.textContent = icon + " " + label;
      btn.setAttribute("aria-label", (typeof lang !== "undefined" && lang === "en")
        ? ("Theme: " + en + " (tap to cycle)")
        : ("الثيم: " + ar + " (اضغطي للتبديل)"));
      btn.title = btn.getAttribute("aria-label");
    }
  }

  function load() {
    try {
      var s = localStorage.getItem(KEY);
      if (s === "day" || s === "night" || s === "auto") mode = s;
      else mode = "auto";
    } catch (e) { mode = "auto"; }
    apply(mode);
  }

  function cycle() {
    // auto → day → night → auto
    mode = mode === "auto" ? "day" : (mode === "day" ? "night" : "auto");
    try { localStorage.setItem(KEY, mode); } catch (e) {}
    apply(mode);
  }

  function bind() {
    var btn = document.getElementById("themeBtn");
    if (btn && !btn.__naqaTheme) {
      btn.__naqaTheme = true;
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        cycle();
      });
    }
  }

  w.naqaTheme = { load: load, apply: apply, cycle: cycle, bind: bind, getMode: function () { return mode; }, resolve: resolve };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { load(); bind(); });
  } else {
    load(); bind();
  }
  // re-apply auto when hour might flip (every 15 min)
  setInterval(function () {
    if (mode === "auto") apply("auto");
  }, 15 * 60 * 1000);
})(window);
