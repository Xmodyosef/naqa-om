/* Products load: docs/ENGINEERING-RULES.md §3 — refreshProductsFromBundle must stay top-level */
/* Shared state + helpers for Naqa admin modules */
(function (w) {
  var A = w.NaqaAdmin = w.NaqaAdmin || {};
  A.products = [];
  A.refreshProductsFromBundle = function () {
    try {
      var src = w.NAQA_PRODUCTS || [];
      A.products = src.map(function (p) { return Object.assign({ imgs: [] }, p); });
    } catch (e) {
      A.products = A.products || [];
    }
    return A.products;
  };
  try {
    if (w.NAQA_PRODUCTS && w.NAQA_PRODUCTS.length) A.refreshProductsFromBundle();
  } catch (e) {}
  A.KEY = "naqa_overrides";
  /* Legacy key cleared on logout only (never used for publish). */
  A.TOKEN = "naqa_gh_token";

  /** P1: Firebase session present (and matches A.fbUser if set). Soft — no UI wipe. */
  A.isAuthed = function () {
    try {
      if (!w.firebase || !firebase.auth) return false;
      var u = firebase.auth().currentUser;
      if (!u || !u.uid) return false;
      if (A.fbUser && A.fbUser.uid && u.uid !== A.fbUser.uid) return false;
      if (w.naqaIsAdminUid && !naqaIsAdminUid(u.uid)) return false;
      return true;
    } catch (e) {
      return false;
    }
  };
  /** P1: block this action only — never hide the whole panel from here. */
  A.requireAuth = function (msgId) {
    if (A.isAuthed()) return true;
    if (msgId && A.setMsg) {
      A.setMsg(msgId, A.lang === "en" ? "Sign in required." : "يلزم تسجيل الدخول.");
    }
    return false;
  };
  A.ORDERS_KEY = "naqa_orders";
  A.overrides = {};
  A.orders = [];
  A.dateFrom = A.dateFrom || "";
  A.dateTo = A.dateTo || "";
  A.orderDateFrom = A.orderDateFrom || "";
  A.orderDateTo = A.orderDateTo || "";
  A.dayKey = function (d) {
    if (!d) return "";
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Muscat", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));
    } catch (e) {
      return String(d).slice(0, 10);
    }
  };
  /* Numeric dates only: 25/11/2026 · 25/11/2026 14:05 (no month/weekday names) */
  A.fmtDateNum = function (d) {
    if (!d) return "";
    var dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return "";
    var dd = String(dt.getDate()).padStart(2, "0");
    var mm = String(dt.getMonth() + 1).padStart(2, "0");
    var yy = dt.getFullYear();
    return dd + "/" + mm + "/" + yy;
  };
  A.fmtDateTimeNum = function (d) {
    if (!d) return "";
    var dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return "";
    var hh = String(dt.getHours()).padStart(2, "0");
    var mi = String(dt.getMinutes()).padStart(2, "0");
    return A.fmtDateNum(dt) + " " + hh + ":" + mi;
  };

  A.inDateRange = function (at) {
    var day = A.dayKey(at);
    if (A.dateFrom && (!day || day < A.dateFrom)) return false;
    if (A.dateTo && (!day || day > A.dateTo)) return false;
    return true;
  };
  A.dateFilterHtml = function (prefix, bag, opts) {
    opts = opts || {};
    var from = bag === "order" ? (A.orderDateFrom || "") : (A.dateFrom || "");
    var to = bag === "order" ? (A.orderDateTo || "") : (A.dateTo || "");
    var clearBtn = opts.noClear
      ? ""
      : ('<button type="button" class="mini" id="' + prefix + 'Clear">' + A.t("dateClear") + '</button>');
    return '<div class="date-filter" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;width:100%">'
      + '<label style="display:flex;gap:6px;align-items:center;font-size:13px">' + A.t("dateFrom")
      + ' <input type="date" lang="en" dir="ltr" id="' + prefix + 'From" value="' + A.esc(from) + '" style="border:1px solid #efe4df;border-radius:10px;padding:8px"></label>'
      + '<label style="display:flex;gap:6px;align-items:center;font-size:13px">' + A.t("dateTo")
      + ' <input type="date" lang="en" dir="ltr" id="' + prefix + 'To" value="' + A.esc(to) + '" style="border:1px solid #efe4df;border-radius:10px;padding:8px"></label>'
      + clearBtn
      + '</div>';
  };
  A.bindDateFilter = function (prefix, onChange, bag) {
    function sync() {
      var f = document.getElementById(prefix + "From");
      var t = document.getElementById(prefix + "To");
      var fv = (f && f.value) || "";
      var tv = (t && t.value) || "";
      if (bag === "order") { A.orderDateFrom = fv; A.orderDateTo = tv; }
      else { A.dateFrom = fv; A.dateTo = tv; }
      if (onChange) onChange();
    }
    var f = document.getElementById(prefix + "From");
    var t = document.getElementById(prefix + "To");
    var c = document.getElementById(prefix + "Clear");
    if (f) f.onchange = sync;
    if (t) t.onchange = sync;
    if (c) c.onclick = function () {
      if (bag === "order") { A.orderDateFrom = ""; A.orderDateTo = ""; }
      else { A.dateFrom = ""; A.dateTo = ""; }
      if (onChange) onChange();
    };
  };
  A.ordersInRange = function (at) {
    var day = A.dayKey(at);
    if (A.orderDateFrom && (!day || day < A.orderDateFrom)) return false;
    if (A.orderDateTo && (!day || day > A.orderDateTo)) return false;
    return true;
  };
  A.csvCell = function (v) {
    v = String(v == null ? "" : v);
    if (/[",\n\r]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
    return v;
  };
  A.downloadCsv = function (filename, rows) {
    var text = "\uFEFF" + rows.map(function (r) {
      return r.map(A.csvCell).join(",");
    }).join("\n");
    var blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { try { URL.revokeObjectURL(a.href); } catch (e) {} }, 1500);
  };
  A.parseCsv = function (text) {
    text = String(text || "").replace(/^\uFEFF/, "");
    var rows = [], row = [], cell = "", i = 0, q = false;
    while (i < text.length) {
      var ch = text[i];
      if (q) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i += 2; continue; }
          q = false; i++; continue;
        }
        cell += ch; i++; continue;
      }
      if (ch === '"') { q = true; i++; continue; }
      if (ch === ",") { row.push(cell); cell = ""; i++; continue; }
      if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; i++; continue; }
      if (ch === "\r") { i++; continue; }
      cell += ch; i++;
    }
    if (cell.length || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ""; }); });
  };
  A.editingId = null;
  A.orderFilter = "all";
  A.CATS = ["عناية", "وجه", "عيون", "حواجب", "شفاه", "عطور", "أدوات", "شعر"];
  A.STATUS = {
    new: "جديد",
    prep: "جاري التجهيز",
    ship: "جاري التوصيل",
    delivered: "تم التوصيل",
    cancel: "ملغي"
  };
  A.STATUS_ORDER = ["new", "prep", "ship", "delivered", "cancel"];

  try { A.overrides = JSON.parse(localStorage.getItem(A.KEY) || "{}"); } catch (e) { A.overrides = {}; }
  try {
    A.orders = JSON.parse(localStorage.getItem(A.ORDERS_KEY) || "[]");
    if (!Array.isArray(A.orders)) A.orders = [];
  } catch (e) { A.orders = []; }

  /* Escape for HTML text + attribute context (incl. single quotes). */
  A.esc = function (v) {
    return String(v == null ? "" : v)
      .split("&").join("&" + "amp;")
      .split("<").join("&" + "lt;")
      .split(">").join("&" + "gt;")
      .split('"').join("&" + "quot;")
      .split("'").join("&#39;");
  };
  A.val = function (id) {
    var el = document.getElementById(id);
    return el ? el.value : "";
  };
  A.normalizeStatus = function (st) {
    if (st === "done") return "ship";
    if (A.STATUS[st]) return st;
    return "new";
  };
  A.saveOrders = function () {
    var _cap = (typeof ORDERS_CAP === "number" && ORDERS_CAP > 0) ? ORDERS_CAP : 300;
    localStorage.setItem(A.ORDERS_KEY, JSON.stringify(A.orders.slice(0, _cap)));
  };
  /* RULE (LOCKED) — product images
     1) The on-screen gallery (_editImgs) is the source of truth on Save.
     2) Deleting with ✕ removes only that photo; Save stores exactly what remains.
     3) Catalog media/* paths are valid and must never be stripped in cloud sanitize.
     4) Wipe repair only when a stored list has zero catalog paths but the product has some
        (old bug). Intentional deletes are stored in removedImgs and are respected.
  */
  A.normImgPath = function (u) {
    u = String(u || "").trim();
    if (!u) return "";
    try {
      if (/^https?:\/\//i.test(u)) {
        var path = u.replace(/^https?:\/\/[^/]+/i, "");
        var base = "";
        try { base = (location.pathname || "").replace(/\/[^/]*$/, "/"); } catch (e) {}
        if (base && path.indexOf(base) === 0) path = path.slice(base.length);
        if (path.charAt(0) === "/") path = path.slice(1);
        if (/^media\//i.test(path)) return path;
      }
    } catch (e) {}
    return u.replace(/^\.\//, "").replace(/^\//, "");
  };
  A.isCatalogImg = function (u) {
    u = A.normImgPath(u);
    return /^media\//i.test(u) || /^p\//i.test(u);
  };
  A.isWipeImgs = function (base, saved) {
    base = (base || []).map(A.normImgPath).filter(Boolean);
    saved = (saved || []).map(A.normImgPath).filter(Boolean);
    if (!base.length || !saved.length) return false;
    var baseSet = {};
    base.forEach(function (u) { baseSet[u] = 1; });
    var hit = saved.some(function (u) { return baseSet[u]; });
    if (hit) return false;
    /* saved has only non-catalog (fs:/https) while product had catalog → old wipe */
    return saved.every(function (u) { return !A.isCatalogImg(u); });
  };
  A.keepImgs = function (base, saved, removed) {
    removed = removed || {};
    var rem = {};
    Object.keys(removed).forEach(function (k) { rem[A.normImgPath(k)] = 1; });
    base = (base || []).map(A.normImgPath).filter(Boolean);
    saved = (saved || []).map(function (u) { return String(u || "").trim(); }).filter(Boolean);
    var out = [], seen = {};
    function add(raw) {
      var u = String(raw || "").trim();
      if (!u) return;
      var key = A.normImgPath(u);
      if (!key || seen[key] || rem[key] || out.length >= 6) return;
      seen[key] = 1;
      out.push(u.indexOf("fs:") === 0 || /^https:\/\//i.test(u) ? u : key);
    }
    if (A.isWipeImgs(base, saved)) {
      saved.forEach(add);
      base.forEach(add);
      return out;
    }
    if (saved.length) {
      saved.forEach(add);
      return out;
    }
    base.forEach(add);
    return out;
  };
  A.repairAllProductImgs = function () {
    /* in-memory only — never auto-write to cloud (that made login heavy + could loop) */
    var map = A.overrides || {};
    var fixed = false;
    (A.products || []).forEach(function (p) {
      if (!p) return;
      var id = String(p.id);
      var o = map[id] || map[p.id];
      if (!o || !Array.isArray(o.imgs) || !o.imgs.length) return;
      var base = Array.isArray(p.imgs) ? p.imgs.filter(Boolean) : [];
      var rem = {};
      (o.removedImgs || []).forEach(function (u) { rem[A.normImgPath(u)] = 1; });
      if (!A.isWipeImgs(base, o.imgs)) return;
      var next = A.keepImgs(base, o.imgs, rem);
      try {
        if (JSON.stringify(next) === JSON.stringify(o.imgs)) return;
      } catch (e) {}
      o.imgs = next;
      map[id] = o;
      if (map[p.id] && String(p.id) !== id) delete map[p.id];
      fixed = true;
    });
    A.overrides = map;
    return fixed;
  };
  A.merged = function (p) {
    var o = A.overrides[p.id] || A.overrides[String(p.id)] || {};
    var baseImgs = Array.isArray(p.imgs) ? p.imgs.filter(Boolean) : [];
    var m = Object.assign({}, p, o);
    var rem = {};
    (o.removedImgs || []).forEach(function (u) { rem[A.normImgPath(u)] = 1; });
    if (Array.isArray(o.imgs)) {
      if (A.isWipeImgs(baseImgs, o.imgs)) m.imgs = A.keepImgs(baseImgs, o.imgs, rem);
      else m.imgs = o.imgs.map(function (u) { return String(u || "").trim(); }).filter(Boolean).slice(0, 6);
    } else {
      m.imgs = baseImgs.filter(function (u) { return u && !rem[A.normImgPath(u)]; }).slice(0, 6);
    }
    if (m.stock == null || m.stock === "") m.stock = 3;
    if (m.was == null) m.was = "";
    return m;
  };
  A.utf8b64 = function (text) {
    return btoa(unescape(encodeURIComponent(text)));
  };
  A.ghPutB64 = function () {
    return Promise.reject(new Error("github-publish-disabled"));
  };
  A.REVIEWS_KEY = "naqa_reviews";
  try { A.reviews = JSON.parse(localStorage.getItem(A.REVIEWS_KEY) || "[]"); } catch (e) { A.reviews = []; }
  if (!Array.isArray(A.reviews)) A.reviews = [];
  A.ghPut = function () {
    return Promise.reject(new Error("github-publish-disabled"));
  };
  A.setMsg = function (id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text || "";
  };
  A.copyText = function (text, msgId) {
    text = String(text || "");
    function ok() { A.setMsg(msgId || "orderStatus", A.t("copied")); }
    function fail() {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        ok();
      } catch (e) {
        A.setMsg(msgId || "orderStatus", A.t("c_copyFail"));
        prompt(A.t("c_copyPrompt"), text.slice(0, 1500));
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok).catch(fail);
    } else fail();
  };
  A.buildOrdersReport = function (filter) {
    var omr = A.t("omr");
    var lines = [A.t("rep_title"), "—"];
    var list = A.orders.filter(function (o) {
      if (!filter || filter === "all") return true;
      if (filter === "new") return A.normalizeStatus(o.status) === "new";
      return A.normalizeStatus(o.status) === filter;
    });
    if (!list.length) return A.t("rep_empty");
    list.forEach(function (o, i) {
      var st = A.statusLabel(A.normalizeStatus(o.status)) || o.status;
      var itemName = function (it) {
        if (A.lang === "en") return it.nameEn || it.name || it.nameAr || "";
        return it.nameAr || it.name || it.nameEn || "";
      };
      lines.push((i + 1) + ") " + (o.id || "") + " · " + st);
      lines.push("   " + (o.name || "—") + " · " + (o.phone || "—") + " · " + (o.area || "—"));
      lines.push("   " + A.t("rep_total") + ": " + (o.total != null ? Number(o.total).toFixed(3) : "—") + " " + A.t("rep_vat"));
      var vatN = o.vat != null ? Number(o.vat) : (o.total != null ? Number(o.total) * 0.05 / 1.05 : null);
      if (vatN != null && !isNaN(vatN)) lines.push("   " + A.t("rep_vatOf") + ": " + vatN.toFixed(3) + " " + omr);
      lines.push("   " + A.t("payLine") + ": " + A.payText(o));
      if (o.delivery != null || o.codFee != null || o.shipping != null) {
        lines.push("   " + A.t("rep_fees") + " " + Number(o.delivery != null ? o.delivery : 0).toFixed(3)
          + " · " + A.t("rep_cod") + " " + Number(o.codFee != null ? o.codFee : 0).toFixed(3)
          + " · " + A.t("rep_netFee") + " " + Number(o.shipping != null ? o.shipping : 0).toFixed(3) + " " + omr);
      }
      if (Array.isArray(o.items) && o.items.length) {
        o.items.forEach(function (it) {
          lines.push("   - " + itemName(it) + " ×" + (it.qty || 1) + " (" + (it.sku || "") + ")");
        });
      } else if (o.itemsText) lines.push("   " + o.itemsText);
      lines.push("");
    });
    lines.push(A.t("rep_count") + ": " + list.length + " " + A.t("rep_orderUnit"));
    return lines.join("\n");
  };
  A.buildCustomersReport = function () {
    var omr = A.t("omr");
    var map = {};
    A.orders.forEach(function (o) {
      if (A.normalizeStatus(o.status) === "cancel") return;
      var key = String(o.phone || ("n:" + (o.name || o.id)));
      if (!map[key]) map[key] = { name: o.name || "—", phone: o.phone || "—", area: o.area || "—", count: 0, total: 0 };
      map[key].count++;
      map[key].total += Number(o.total) || 0;
    });
    var list = Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.total - a.total; });
    var lines = [A.t("rep_custTitle"), "—"];
    if (!list.length) return A.t("rep_custEmpty");
    list.forEach(function (c, i) {
      lines.push((i + 1) + ") " + c.name + " · " + c.phone + " · " + c.area);
      lines.push("   " + c.count + " " + A.t("rep_custLine") + " · " + c.total.toFixed(3) + " " + omr);
    });
    lines.push("");
    lines.push(A.t("rep_custCount") + ": " + list.length);
    return lines.join("\n");
  };
  A.buildFinanceReport = function () {
    var omr = A.t("omr");
    var sales = 0, count = 0, cancel = 0;
    var bySt = { new: 0, prep: 0, ship: 0, delivered: 0 };
    A.orders.forEach(function (o) {
      var st = A.normalizeStatus(o.status);
      if (st === "cancel") { cancel++; return; }
      count++;
      sales += Number(o.total) || 0;
      if (bySt[st] != null) bySt[st]++;
    });
    var loc = A.lang === "en" ? "en-OM" : "ar-OM";
    return [
      A.t("rep_finTitle"),
      "—",
      A.t("rep_finSales") + ": " + sales.toFixed(3) + " " + omr,
      A.t("rep_finActive") + ": " + count,
      A.t("rep_finAvg") + ": " + (count ? (sales / count).toFixed(3) : "0.000") + " " + omr,
      A.t("rep_finNew") + ": " + bySt.new + " · " + A.t("rep_finPrep") + ": " + bySt.prep + " · " + A.t("rep_finShip") + ": " + bySt.ship + " · " + A.t("rep_finDone") + ": " + bySt.delivered,
      A.t("rep_finCancel") + ": " + cancel,
      A.t("rep_finDate") + ": " + A.fmtDateTimeNum(new Date())
    ].join("\n");
  };
  A.waShareText = function (text) {
    var url = "https://wa.me/" + (w.WA_NUMBER || "96879088349") + "?text=" + encodeURIComponent(text);
    w.open(url, "_blank");
  };
  A.loadRemoteOrders = function () {
    if (A._ordersRemoteLoading) return A._ordersRemoteLoading;
    if (A._ordersRemoteLoadedAt && (Date.now() - A._ordersRemoteLoadedAt) < 60000) {
      return Promise.resolve(A.orders || []);
    }
    A._ordersRemoteLoading = fetch("data/orders.json?v=20261125ord1").then(function (r) { return r.ok ? r.json() : []; }).then(function (remote) {
      A._ordersRemoteLoadedAt = Date.now();
      A._ordersRemoteLoading = null;
      if (!Array.isArray(remote)) return;
      var by = {};
      A.orders.forEach(function (o) { if (o && o.id) by[o.id] = o; });
      remote.forEach(function (o) {
        if (!o || !o.id) return;
        var prev = by[o.id];
        var merged = Object.assign({}, prev || {}, o);
        if (prev && prev.stockDeducted) merged.stockDeducted = true;
        by[o.id] = merged;
      });
      A.orders = Object.keys(by).map(function (k) { return by[k]; });
      A.orders.sort(function (a, b) { return (b.at || "").localeCompare(a.at || ""); });
      A.orders.forEach(function (o) { o.status = A.normalizeStatus(o.status); });
      if (A.settleOrderStock) A.settleOrderStock();
      A.saveOrders();
      if (A.paintOrders) A.paintOrders();
      if (A.paintDashboard) A.paintDashboard();
      if (A.paintCustomers) A.paintCustomers();
      if (A.paintFinance) A.paintFinance();
      return A.orders;
    }).catch(function () {
      A._ordersRemoteLoading = null;
      return A.orders || [];
    });
    return A._ordersRemoteLoading;
  };
})(window);
