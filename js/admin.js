var products = (window.NAQA_PRODUCTS || []).map(function (p) { return Object.assign({ imgs: [] }, p); });
var KEY = "naqa_overrides";
var PIN = "naqa_admin_pin";
var TOKEN = "naqa_gh_token";
var ORDERS_KEY = "naqa_orders";
var overrides = {};
var orders = [];
var editingId = null;
var CATS = ["عناية", "وجه", "عيون", "حواجب", "شفاه", "عطور", "أدوات", "شعر"];
var STATUS = {
  new: "جديد",
  prep: "جاري التجهيز",
  ship: "جاري التوصيل",
  delivered: "تم التوصيل",
  cancel: "ملغي"
};
var STATUS_ORDER = ["new", "prep", "ship", "delivered", "cancel"];
var orderFilter = "all";
function normalizeStatus(st) {
  if (st === "done") return "ship"; // old label was جاري التوصيل under key done
  if (STATUS[st]) return st;
  return "new";
}

try { overrides = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { overrides = {}; }
try { orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]"); if (!Array.isArray(orders)) orders = []; } catch (e) { orders = []; }

function esc(v) {
  return String(v == null ? "" : v).split("&").join("&" + "amp;").split("<").join("&" + "lt;").split('"').join("&" + "quot;");
}
function saveOrders() {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.slice(0, 100)));
}
function loadRemoteOrders() {
  return fetch("data/orders.json?v=" + Date.now()).then(function (r) { return r.ok ? r.json() : []; }).then(function (remote) {
    if (!Array.isArray(remote)) return;
    var map = {};
    orders.forEach(function (o) { map[o.id] = o; });
    remote.forEach(function (o) {
      if (!o || !o.id) return;
      if (!map[o.id]) orders.push(o);
      else if ((o.at || "") > (map[o.id].at || "")) map[o.id] = Object.assign({}, map[o.id], o);
    });
    // rebuild from map + new
    var by = {};
    orders.forEach(function (o) { by[o.id] = o; });
    remote.forEach(function (o) { if (o && o.id) by[o.id] = Object.assign({}, by[o.id] || {}, o); });
    orders = Object.keys(by).map(function (k) { return by[k]; });
    orders.sort(function (a, b) { return (b.at || "").localeCompare(a.at || ""); });
    saveOrders();
    paintOrders();
  }).catch(function () {});
}
function merged(p) {
  var o = overrides[p.id] || overrides[String(p.id)] || {};
  var m = Object.assign({}, p, o);
  if (o.imgs && o.imgs.length) m.imgs = o.imgs;
  if (m.stock == null || m.stock === "") m.stock = "";
  if (m.was == null) m.was = "";
  return m;
}
function val(id) {
  var el = document.getElementById(id);
  return el ? el.value : "";
}
function setTab(tab) {
  document.querySelectorAll("#tabs button").forEach(function (b) {
    b.classList.toggle("on", b.getAttribute("data-tab") === tab);
  });
  document.getElementById("productsTab").hidden = tab !== "products";
  document.getElementById("ordersTab").hidden = tab !== "orders";
  document.getElementById("savebar").hidden = false;
  if (tab === "orders") paintOrders();
}
function paintList(q) {
  editingId = null;
  document.getElementById("listView").hidden = false;
  document.getElementById("editView").hidden = true;
  q = (q || "").toLowerCase();
  var html = products.filter(function (p) {
    var m = merged(p);
    var blob = [m.nameAr, m.nameEn, m.brand, m.sku, p.id].join(" ").toLowerCase();
    return !q || blob.indexOf(q) >= 0;
  }).map(function (p) {
    var m = merged(p);
    var img = (m.imgs && m.imgs[0]) || "";
    var thumb = img ? '<img src="' + esc(img) + '" alt="">' : '<div class="ph"></div>';
    var stock = m.stock === "" || m.stock == null ? "—" : m.stock;
    var hid = m.hidden ? " · مخفي" : "";
    return '<article class="row" data-open="' + p.id + '">' + thumb
      + '<div><strong>' + esc(m.nameAr || m.nameEn) + '</strong>'
      + '<small>' + esc(m.brand || "") + ' · ' + esc(m.cat || "") + ' · SKU ' + esc(m.sku || "—") + '</small>'
      + '<small>السعر ' + esc(m.price) + ' · المخزون ' + esc(stock) + hid + '</small>'
      + '<small style="color:#b05c6e;font-weight:800">كمية · صور · وصف · استعمال</small></div>'
      + '<button type="button" class="edit-btn" data-open="' + p.id + '">تعديل كامل</button></article>';
  }).join("");
  document.getElementById("list").innerHTML = html || '<p class="note">ما في نتائج</p>';
}
function openEdit(id) {
  var p = products.find(function (x) { return x.id == id; });
  if (!p) return;
  editingId = p.id;
  var m = merged(p);
  document.getElementById("listView").hidden = true;
  document.getElementById("editView").hidden = false;
  var catOpts = CATS.map(function (c) {
    return '<option value="' + esc(c) + '"' + (m.cat === c ? " selected" : "") + ">" + esc(c) + "</option>";
  }).join("");
  var imgs = (m.imgs || []).join("\n");
  document.getElementById("editView").innerHTML =
    '<button type="button" class="back" id="backList">← رجوع للقائمة</button>'
    + '<div class="edit-card">'
    + '<div class="preview">' + ((m.imgs && m.imgs[0]) ? '<img src="' + esc(m.imgs[0]) + '" alt="">' : '<div class="ph big"></div>') + '</div>'
    + '<label>الاسم عربي<textarea id="f_nameAr" rows="2">' + esc(m.nameAr || "") + '</textarea></label>'
    + '<label>الاسم English<textarea id="f_nameEn" rows="2">' + esc(m.nameEn || "") + '</textarea></label>'
    + '<div class="grid2">'
    + '<label>الماركة<input id="f_brand" type="text" value="' + esc(m.brand || "") + '"></label>'
    + '<label>التصنيف<select id="f_cat">' + catOpts + '</select></label>'
    + '</div>'
    + '<label>SKU<input id="f_sku" type="text" value="' + esc(m.sku || "") + '"></label>'
    + '<div class="grid3">'
    + '<label>السعر ر.ع<input id="f_price" type="number" min="0" step="0.001" value="' + esc(m.price) + '"></label>'
    + '<label>قبل الخصم<input id="f_was" type="number" min="0" step="0.001" value="' + esc(m.was) + '"></label>'
    + '<label>الكمية / المخزون<input id="f_stock" type="number" min="0" step="1" value="' + esc(m.stock) + '" placeholder="فارغ = بدون حد"></label>'
    + '</div>'
    + '<label class="hide-row"><input id="f_hidden" type="checkbox"' + (m.hidden ? " checked" : "") + '> إخفاء المنتج من المتجر</label>'
    + '<label>الوصف عربي<textarea id="f_descAr" rows="4">' + esc(m.descAr || "") + '</textarea></label>'
    + '<label>الوصف English<textarea id="f_descEn" rows="4">' + esc(m.descEn || "") + '</textarea></label>'
    + '<label>طريقة الاستعمال عربي<textarea id="f_useAr" rows="4">' + esc(m.useAr || "") + '</textarea></label>'
    + '<label>طريقة الاستعمال English<textarea id="f_useEn" rows="4">' + esc(m.useEn || "") + '</textarea></label>'
    + '<label>يناسب (عربي)<input id="f_skinAr" type="text" value="' + esc(m.skinAr || "") + '"></label>'
    + '<label>Best for (English)<input id="f_skinEn" type="text" value="' + esc(m.skinEn || "") + '"></label>'
    + '<label>روابط الصور (سطر لكل صورة، حتى ٥)<textarea id="f_imgs" rows="5" placeholder="https://...">' + esc(imgs) + '</textarea></label>'
    + '<button type="button" class="primary" id="saveEdit">حفظ هذا المنتج</button>'
    + '</div>';
  document.getElementById("backList").onclick = function () { paintList(document.getElementById("q").value.trim()); };
  document.getElementById("saveEdit").onclick = function () { saveEdit(); };
}
function saveEdit() {
  if (editingId == null) return;
  var next = {
    nameAr: val("f_nameAr"),
    nameEn: val("f_nameEn"),
    brand: val("f_brand"),
    cat: val("f_cat"),
    sku: val("f_sku"),
    price: val("f_price") === "" ? undefined : Number(val("f_price")),
    was: val("f_was") === "" ? undefined : Number(val("f_was")),
    stock: val("f_stock") === "" ? undefined : Number(val("f_stock")),
    descAr: val("f_descAr"),
    descEn: val("f_descEn"),
    useAr: val("f_useAr"),
    useEn: val("f_useEn"),
    skinAr: val("f_skinAr"),
    skinEn: val("f_skinEn"),
    imgs: val("f_imgs").split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 5),
    hidden: !!(document.getElementById("f_hidden") && document.getElementById("f_hidden").checked)
  };
  if (next.price == null || isNaN(next.price)) delete next.price;
  if (next.was == null || isNaN(next.was)) delete next.was;
  if (next.stock == null || isNaN(next.stock)) delete next.stock;
  if (!next.imgs.length) delete next.imgs;
  if (!next.hidden) delete next.hidden;
  Object.keys(next).forEach(function (k) { if (next[k] === "" || next[k] === undefined) delete next[k]; });
  if (Object.keys(next).length) overrides[editingId] = next;
  else delete overrides[editingId];
  localStorage.setItem(KEY, JSON.stringify(overrides));
  document.getElementById("status").textContent = "انحفظ المنتج.";
  paintList(document.getElementById("q").value.trim());
}
function paintStatusBar() {
  var bar = document.getElementById("statusBar");
  if (!bar) return;
  var counts = { all: orders.length };
  STATUS_ORDER.forEach(function (k) { counts[k] = 0; });
  orders.forEach(function (o) {
    var st = normalizeStatus(o.status);
    o.status = st;
    counts[st] = (counts[st] || 0) + 1;
  });
  var parts = [{ id: "all", label: "الكل" }].concat(STATUS_ORDER.map(function (k) {
    return { id: k, label: STATUS[k] };
  }));
  bar.innerHTML = parts.map(function (p) {
    return '<button type="button" data-filter="' + p.id + '"' + (orderFilter === p.id ? ' class="on"' : "") + ">"
      + p.label + " (" + (counts[p.id] || 0) + ")</button>";
  }).join("");
}
function paintOrders() {
  try {
    var btn = document.querySelector('#tabs button[data-tab="orders"]');
    if (btn) btn.textContent = orders.length ? ("الطلبات (" + orders.length + ")") : "الطلبات";
  } catch (e) {}
  // normalize legacy done -> ship
  orders.forEach(function (o) { o.status = normalizeStatus(o.status); });
  paintStatusBar();
  var box = document.getElementById("ordersList");
  if (!box) return;
  var list = orders.filter(function (o) {
    if (orderFilter === "all") return true;
    return normalizeStatus(o.status) === orderFilter;
  });
  if (!orders.length) {
    box.innerHTML = '<p class="note">ما في طلبات بعد. اطلبي من المتجر (نفس الجهاز) أو انشري سجل الطلبات بعد ما يوصلك واتساب وتحفظينه من صفحة الطلب إن وُجدت.</p>';
    return;
  }
  if (!list.length) {
    box.innerHTML = '<p class="note">ما في طلبات بهالحالة. جرّبي فلتر «الكل».</p>';
    return;
  }
  box.innerHTML = list.map(function (o) {
    var st = normalizeStatus(o.status);
    var items = "";
    if (Array.isArray(o.items) && o.items.length) {
      items = '<ul class="items">' + o.items.map(function (it) {
        var thumb = it.img ? ('<img src="' + esc(it.img) + '" alt="" style="width:40px;height:40px;object-fit:contain;border-radius:8px;background:#f6f1ee;vertical-align:middle;margin-left:8px">') : "";
        return '<li>' + thumb + '<strong>' + esc(it.name || it.nameAr || "") + '</strong><small>SKU ' + esc(it.sku || "—") + ' · ×' + esc(it.qty) + ' · ' + esc(it.line != null ? it.line : it.price) + ' ر.ع</small>'
          + (it.link ? ('<div><a href="' + esc(it.link) + '" target="_blank" rel="noopener">رابط المنتج</a></div>') : "") + "</li>";
      }).join("") + "</ul>";
    } else if (o.itemsText) {
      items = '<pre class="note" style="white-space:pre-wrap">' + esc(o.itemsText) + "</pre>";
    }
    var when = o.at ? new Date(o.at).toLocaleString("ar-OM") : "";
    var phoneDigits = String(o.phone || "").replace(/\D/g, "").replace(/^968/, "");
    var statusBtns = STATUS_ORDER.map(function (k) {
      return '<button type="button" class="mini' + (st === k ? " on" : (k === "cancel" ? " ghost" : "")) + '" data-st="' + k + '" data-oid="' + esc(o.id) + '">' + STATUS[k] + "</button>";
    }).join("");
    return '<article class="order" data-oid="' + esc(o.id) + '">'
      + '<strong>' + esc(o.id) + ' <span class="badge ' + esc(st) + '">' + esc(STATUS[st] || st) + "</span></strong>"
      + "<small>" + esc(when) + "</small>"
      + "<small>" + esc(o.name || "—") + " · " + esc(o.phone || "—") + " · " + esc(o.area || "—") + "</small>"
      + "<small>المجموع: <b>" + esc(o.total != null ? Number(o.total).toFixed(3) : "—") + " ر.ع</b></small>"
      + (o.note ? ("<small>ملاحظة: " + esc(o.note) + "</small>") : "")
      + items
      + '<div class="actions">' + statusBtns
      + (phoneDigits ? ('<a class="mini" style="background:#25D366;display:inline-block;color:#fff;text-decoration:none;text-align:center" href="https://wa.me/968' + esc(phoneDigits) + '" target="_blank" rel="noopener">واتساب الزبونة</a>') : "")
      + '<button type="button" class="mini ghost" data-del="' + esc(o.id) + '">حذف</button>'
      + "</div></article>";
  }).join("");
}
function saveLocal() {
  if (editingId != null && document.getElementById("editView") && !document.getElementById("editView").hidden) saveEdit();
  localStorage.setItem(KEY, JSON.stringify(overrides));
  saveOrders();
  document.getElementById("status").textContent = "انحفظ على هذا الآيفون (منتجات + طلبات).";
  document.getElementById("orderStatus").textContent = "انحفظ سجل الطلبات على الجهاز.";
}
function utf8b64(text) {
  return btoa(unescape(encodeURIComponent(text)));
}
function ghPut(path, content, token, message) {
  var api = "https://api.github.com/repos/Xmodyosef/naqa-om/contents/" + path;
  var headers = { Authorization: "Bearer " + token, Accept: "application/vnd.github+json" };
  return fetch(api, { headers: headers }).then(function (res) { return res.ok ? res.json() : {}; }).then(function (cur) {
    return fetch(api, {
      method: "PUT",
      headers: Object.assign({ "Content-Type": "application/json" }, headers),
      body: JSON.stringify({ message: message, content: utf8b64(content), sha: cur.sha })
    });
  });
}
function publish() {
  if (editingId != null && document.getElementById("editView") && !document.getElementById("editView").hidden) saveEdit();
  localStorage.setItem(KEY, JSON.stringify(overrides));
  saveOrders();
  var token = document.getElementById("token").value.trim() || localStorage.getItem(TOKEN) || "";
  var status = document.getElementById("status");
  var ostatus = document.getElementById("orderStatus");
  if (!token) {
    status.textContent = "انحفظ على جهازك. للنشر الصقي رمز GitHub.";
    ostatus.textContent = "للمشاركة بين أجهزتك: انشري مع رمز GitHub.";
    return;
  }
  localStorage.setItem(TOKEN, token);
  status.textContent = "جاري النشر…";
  ostatus.textContent = "جاري نشر الطلبات…";
  Promise.all([
    ghPut("data/overrides.json", JSON.stringify(overrides, null, 2) + "\n", token, "chore: publish product overrides"),
    ghPut("data/orders.json", JSON.stringify(orders, null, 2) + "\n", token, "chore: publish orders log")
  ]).then(function (res) {
    if (!res[0].ok || !res[1].ok) throw new Error("HTTP");
    status.textContent = "اننشرت المنتجات.";
    ostatus.textContent = "اننشر سجل الطلبات.";
  }).catch(function (err) {
    status.textContent = "ما اننشر كامل. " + (err && err.message ? err.message : "");
    ostatus.textContent = "فشل نشر الطلبات.";
  });
}
function openAdmin() {
  document.getElementById("pin").hidden = true;
  document.getElementById("tools").hidden = false;
  document.getElementById("tabs").hidden = false;
  document.getElementById("savebar").hidden = false;
  var saved = localStorage.getItem(TOKEN);
  if (saved) document.getElementById("token").value = saved;
  var wa = "https://wa.me/" + (window.WA_NUMBER || "96879088349");
  document.getElementById("waOrders").href = wa;
  paintList("");
  loadRemoteOrders();
  var start = (location.hash || "").indexOf("orders") >= 0 ? "orders" : "products";
  setTab(start);
  try {
    var n = orders.length;
    var btn = document.querySelector('#tabs button[data-tab="orders"]');
    if (btn) btn.textContent = n ? ("الطلبات (" + n + ")") : "الطلبات";
  } catch (e) {}
}
document.getElementById("pinGo").onclick = function () {
  var typed = document.getElementById("pinInput").value.trim();
  var have = localStorage.getItem(PIN);
  var msg = document.getElementById("pinMsg");
  if (!typed || typed.length < 4) { msg.textContent = "الرمز ٤ أرقام على الأقل."; return; }
  if (!have) { localStorage.setItem(PIN, typed); openAdmin(); return; }
  if (typed === have) openAdmin();
  else msg.textContent = "الرمز غير صحيح.";
};
document.getElementById("q").addEventListener("input", function (e) { paintList(e.target.value.trim()); });
document.getElementById("list").addEventListener("click", function (e) {
  var btn = e.target.closest("[data-open]");
  if (!btn) return;
  openEdit(+btn.getAttribute("data-open"));
});
document.getElementById("tabs").addEventListener("click", function (e) {
  var b = e.target.closest("[data-tab]");
  if (!b) return;
  setTab(b.getAttribute("data-tab"));
});
document.getElementById("ordersList").addEventListener("click", function (e) {
  var del = e.target.closest("[data-del]");
  if (del) {
    var idDel = del.getAttribute("data-del");
    orders = orders.filter(function (o) { return String(o.id) !== String(idDel); });
    saveOrders();
    paintOrders();
    var os = document.getElementById("orderStatus");
    if (os) os.textContent = "انحذف الطلب " + idDel;
    return;
  }
  var st = e.target.closest("[data-st]");
  if (st) {
    var id = st.getAttribute("data-oid");
    var next = st.getAttribute("data-st");
    var found = false;
    orders.forEach(function (o) {
      if (String(o.id) === String(id)) {
        o.status = next;
        found = true;
      }
    });
    if (found) {
      saveOrders();
      paintOrders();
      var os2 = document.getElementById("orderStatus");
      if (os2) os2.textContent = "حالة " + id + " → " + (STATUS[next] || next);
    }
  }
});
var statusBarEl = document.getElementById("statusBar");
if (statusBarEl) {
  statusBarEl.addEventListener("click", function (e) {
    var f = e.target.closest("[data-filter]");
    if (!f) return;
    orderFilter = f.getAttribute("data-filter") || "all";
    paintOrders();
  });
}
document.getElementById("saveLocal").onclick = saveLocal;
document.getElementById("publish").onclick = publish;
