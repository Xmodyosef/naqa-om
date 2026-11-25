/* Shared state + helpers for Naqa admin modules */
(function (w) {
  var A = w.NaqaAdmin = w.NaqaAdmin || {};
  A.products = (w.NAQA_PRODUCTS || []).map(function (p) { return Object.assign({ imgs: [] }, p); });
  A.KEY = "naqa_overrides";
  A.PIN = "naqa_admin_pin";
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
  A.dayKey = function (d) {
    if (!d) return "";
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Muscat", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));
    } catch (e) {
      return String(d).slice(0, 10);
    }
  };
  A.inDateRange = function (at) {
    var day = A.dayKey(at);
    if (A.dateFrom && (!day || day < A.dateFrom)) return false;
    if (A.dateTo && (!day || day > A.dateTo)) return false;
    return true;
  };
  A.dateFilterHtml = function (prefix) {
    return '<div class="date-filter status-bar" style="flex-wrap:wrap;gap:8px;align-items:center">'
      + '<label style="display:flex;gap:6px;align-items:center;font-size:13px">' + A.t("dateFrom")
      + ' <input type="date" id="' + prefix + 'From" value="' + A.esc(A.dateFrom || "") + '" style="border:1px solid #efe4df;border-radius:10px;padding:8px"></label>'
      + '<label style="display:flex;gap:6px;align-items:center;font-size:13px">' + A.t("dateTo")
      + ' <input type="date" id="' + prefix + 'To" value="' + A.esc(A.dateTo || "") + '" style="border:1px solid #efe4df;border-radius:10px;padding:8px"></label>'
      + '<button type="button" class="mini" id="' + prefix + 'Clear">' + A.t("dateClear") + '</button>'
      + '</div>';
  };
  A.bindDateFilter = function (prefix, onChange) {
    function sync() {
      var f = document.getElementById(prefix + "From");
      var t = document.getElementById(prefix + "To");
      A.dateFrom = (f && f.value) || "";
      A.dateTo = (t && t.value) || "";
      if (onChange) onChange();
    }
    var f = document.getElementById(prefix + "From");
    var t = document.getElementById(prefix + "To");
    var c = document.getElementById(prefix + "Clear");
    if (f) f.onchange = sync;
    if (t) t.onchange = sync;
    if (c) c.onclick = function () { A.dateFrom = ""; A.dateTo = ""; if (onChange) onChange(); };
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

  A.esc = function (v) {
    return String(v == null ? "" : v).split("&").join("&" + "amp;").split("<").join("&" + "lt;").split('"').join("&" + "quot;");
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
  A.keepImgs = function (base, saved) {
    base = (base || []).filter(Boolean);
    saved = (saved || []).filter(Boolean);
    if (!saved.length) return base.slice(0, 5);
    var kept = saved.some(function (u) { return base.indexOf(u) >= 0; });
    if (kept) return saved.slice(0, 5);
    var out = [], seen = {};
    function add(u) { if (!u || seen[u] || out.length >= 6) return; seen[u] = 1; out.push(u); }
    saved.forEach(add);
    base.forEach(add);
    return out;
  };
  A.merged = function (p) {
    var o = A.overrides[p.id] || A.overrides[String(p.id)] || {};
    var baseImgs = Array.isArray(p.imgs) ? p.imgs.filter(Boolean) : [];
    var m = Object.assign({}, p, o);
    var savedImgs = Array.isArray(o.imgs) ? o.imgs.filter(Boolean) : [];
    m.imgs = savedImgs.length ? A.keepImgs(baseImgs, savedImgs) : baseImgs.slice(0, 5);
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
        A.setMsg(msgId || "orderStatus", "ما قدرنا ننسخ — حدّدي النص يدوياً");
        prompt("انسخي من هنا:", text.slice(0, 1500));
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok).catch(fail);
    } else fail();
  };
  A.buildOrdersReport = function (filter) {
    var lines = ["نقاء — تقرير الطلبات", "—"];
    var list = A.orders.filter(function (o) {
      if (!filter || filter === "all") return true;
      if (filter === "new") return A.normalizeStatus(o.status) === "new";
      return A.normalizeStatus(o.status) === filter;
    });
    if (!list.length) return "ما في طلبات.";
    list.forEach(function (o, i) {
      var st = A.statusLabel(A.normalizeStatus(o.status)) || o.status;
      lines.push((i + 1) + ") " + (o.id || "") + " · " + st);
      lines.push("   " + (o.name || "—") + " · " + (o.phone || "—") + " · " + (o.area || "—"));
      lines.push("   المجموع: " + (o.total != null ? Number(o.total).toFixed(3) : "—") + " ر.ع (شامل الضريبة ٥٪)");
      var vatN = o.vat != null ? Number(o.vat) : (o.total != null ? Number(o.total) * 0.05 / 1.05 : null);
      if (vatN != null && !isNaN(vatN)) lines.push("   منها ضريبة ٥٪: " + vatN.toFixed(3) + " ر.ع");
      lines.push("   " + A.t("payLine") + ": " + A.payText(o));
      if (o.delivery != null || o.codFee != null || o.shipping != null) {
        lines.push("   رسوم: توصيل " + Number(o.delivery != null ? o.delivery : 0).toFixed(3)
          + " · استلام " + Number(o.codFee != null ? o.codFee : 0).toFixed(3)
          + " · صافي رسوم " + Number(o.shipping != null ? o.shipping : 0).toFixed(3) + " ر.ع");
      }
      if (Array.isArray(o.items) && o.items.length) {
        o.items.forEach(function (it) {
          lines.push("   - " + (it.name || it.nameAr || "") + " ×" + (it.qty || 1) + " (" + (it.sku || "") + ")");
        });
      } else if (o.itemsText) lines.push("   " + o.itemsText);
      lines.push("");
    });
    lines.push("الإجمالي المسجّل: " + list.length + " طلب");
    return lines.join("\n");
  };
  A.buildCustomersReport = function () {
    var map = {};
    A.orders.forEach(function (o) {
      if (A.normalizeStatus(o.status) === "cancel") return;
      var key = String(o.phone || ("n:" + (o.name || o.id)));
      if (!map[key]) map[key] = { name: o.name || "—", phone: o.phone || "—", area: o.area || "—", count: 0, total: 0 };
      map[key].count++;
      map[key].total += Number(o.total) || 0;
    });
    var list = Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.total - a.total; });
    var lines = ["نقاء — قائمة العملاء", "—"];
    if (!list.length) return "ما في عملاء.";
    list.forEach(function (c, i) {
      lines.push((i + 1) + ") " + c.name + " · " + c.phone + " · " + c.area);
      lines.push("   " + c.count + " طلب · " + c.total.toFixed(3) + " ر.ع");
    });
    lines.push("");
    lines.push("العدد: " + list.length);
    return lines.join("\n");
  };
  A.buildFinanceReport = function () {
    var sales = 0, count = 0, cancel = 0;
    var bySt = { new: 0, prep: 0, ship: 0, delivered: 0 };
    A.orders.forEach(function (o) {
      var st = A.normalizeStatus(o.status);
      if (st === "cancel") { cancel++; return; }
      count++;
      sales += Number(o.total) || 0;
      if (bySt[st] != null) bySt[st]++;
    });
    return [
      "نقاء — تقرير مالية",
      "—",
      "مبيعات (بدون ملغي): " + sales.toFixed(3) + " ر.ع",
      "طلبات فعّالة: " + count,
      "متوسط الطلب: " + (count ? (sales / count).toFixed(3) : "0.000") + " ر.ع",
      "جديد: " + bySt.new + " · تجهيز: " + bySt.prep + " · توصيل: " + bySt.ship + " · تم: " + bySt.delivered,
      "ملغي: " + cancel,
      "تاريخ التقرير: " + new Date().toLocaleString("ar-OM")
    ].join("\n");
  };
  A.waShareText = function (text) {
    var url = "https://wa.me/" + (w.WA_NUMBER || "96879088349") + "?text=" + encodeURIComponent(text);
    w.open(url, "_blank");
  };
  A.loadRemoteOrders = function () {
    return fetch("data/orders.json?v=" + Date.now()).then(function (r) { return r.ok ? r.json() : []; }).then(function (remote) {
      if (!Array.isArray(remote)) return;
      var by = {};
      A.orders.forEach(function (o) { if (o && o.id) by[o.id] = o; });
      remote.forEach(function (o) {
        if (!o || !o.id) return;
        by[o.id] = Object.assign({}, by[o.id] || {}, o);
      });
      A.orders = Object.keys(by).map(function (k) { return by[k]; });
      A.orders.sort(function (a, b) { return (b.at || "").localeCompare(a.at || ""); });
      A.orders.forEach(function (o) { o.status = A.normalizeStatus(o.status); });
      A.saveOrders();
      if (A.paintOrders) A.paintOrders();
      if (A.paintDashboard) A.paintDashboard();
      if (A.paintCustomers) A.paintCustomers();
      if (A.paintFinance) A.paintFinance();
    }).catch(function () {});
  };
})(window);
