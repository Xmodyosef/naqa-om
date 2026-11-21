var products = (window.NAQA_PRODUCTS || []).map(function (p) { return Object.assign({ imgs: [] }, p); });
var KEY = "naqa_overrides";
var PIN = "naqa_admin_pin";
var TOKEN = "naqa_gh_token";
var overrides = {};
var editingId = null;
var CATS = ["عناية", "وجه", "عيون", "حواجب", "شفاه", "عطور", "أدوات", "شعر"];
try { overrides = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { overrides = {}; }

function esc(v) {
  return String(v == null ? "" : v).split("&").join("&" + "amp;").split("<").join("&" + "lt;").split('"').join("&" + "quot;");
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
function paintList(q) {
  editingId = null;
  document.getElementById("listView").hidden = false;
  document.getElementById("editView").hidden = true;
  document.getElementById("savebar").hidden = false;
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
      + '<small>السعر ' + esc(m.price) + ' · المخزون ' + esc(stock) + hid + '</small></div>'
      + '<button type="button" class="edit-btn" data-open="' + p.id + '">تعديل</button></article>';
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
  document.getElementById("savebar").hidden = false;
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
    + '<p class="note">الصق روابط الصور الجاهزة. كل سطر صورة واحدة.</p>'
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
  // drop empty optional numbers
  if (next.price == null || isNaN(next.price)) delete next.price;
  if (next.was == null || isNaN(next.was)) delete next.was;
  if (next.stock == null || isNaN(next.stock)) delete next.stock;
  if (!next.imgs.length) delete next.imgs;
  if (!next.hidden) delete next.hidden;
  // remove empty strings that match original? keep all non-empty for clarity
  Object.keys(next).forEach(function (k) {
    if (next[k] === "" || next[k] === undefined) delete next[k];
  });
  if (Object.keys(next).length) overrides[editingId] = next;
  else delete overrides[editingId];
  localStorage.setItem(KEY, JSON.stringify(overrides));
  document.getElementById("status").textContent = "انحفظ المنتج. اضغطي «حفظ على جهازي» أو «نشر للكل» لما تخلصين.";
  paintList(document.getElementById("q").value.trim());
}
function saveLocal() {
  if (editingId != null && document.getElementById("editView") && !document.getElementById("editView").hidden) {
    saveEdit();
  }
  localStorage.setItem(KEY, JSON.stringify(overrides));
  document.getElementById("status").textContent = "انحفظ على هذا الآيفون. الزباين الثانية ما تشوف التغيير إلا بعد النشر.";
}
function utf8b64(text) {
  return btoa(unescape(encodeURIComponent(text)));
}
function publish() {
  if (editingId != null && document.getElementById("editView") && !document.getElementById("editView").hidden) {
    saveEdit();
  }
  localStorage.setItem(KEY, JSON.stringify(overrides));
  var token = document.getElementById("token").value.trim() || localStorage.getItem(TOKEN) || "";
  var status = document.getElementById("status");
  if (!token) {
    status.textContent = "انحفظ على جهازك. للنشر لكل الزباين الصقي رمز GitHub بصلاحية Contents على مستودع naqa-om.";
    return;
  }
  localStorage.setItem(TOKEN, token);
  status.textContent = "جاري النشر…";
  var path = "data/overrides.json";
  var api = "https://api.github.com/repos/Xmodyosef/naqa-om/contents/" + path;
  var headers = { Authorization: "Bearer " + token, Accept: "application/vnd.github+json" };
  fetch(api, { headers: headers }).then(function (res) { return res.ok ? res.json() : {}; }).then(function (cur) {
    return fetch(api, {
      method: "PUT",
      headers: Object.assign({ "Content-Type": "application/json" }, headers),
      body: JSON.stringify({
        message: "chore: publish store overrides from admin",
        content: utf8b64(JSON.stringify(overrides, null, 2) + "\n"),
        sha: cur.sha
      })
    });
  }).then(function (res) {
    if (!res.ok) throw new Error("HTTP " + res.status);
    status.textContent = "اننشر. بعد دقيقة حدّثي المتجر وبيبان لكل الزباين.";
  }).catch(function (err) {
    status.textContent = "ما اننشر. تأكدي من الرمز وصلاحية Contents. " + (err && err.message ? err.message : "");
  });
}
function openAdmin() {
  document.getElementById("pin").hidden = true;
  document.getElementById("tools").hidden = false;
  document.getElementById("savebar").hidden = false;
  var saved = localStorage.getItem(TOKEN);
  if (saved) document.getElementById("token").value = saved;
  paintList("");
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
document.getElementById("q").addEventListener("input", function (e) {
  paintList(e.target.value.trim());
});
document.getElementById("list").addEventListener("click", function (e) {
  var btn = e.target.closest("[data-open]");
  if (!btn) return;
  openEdit(+btn.getAttribute("data-open"));
});
document.getElementById("saveLocal").onclick = saveLocal;
document.getElementById("publish").onclick = publish;
