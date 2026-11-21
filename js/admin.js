var products = (window.NAQA_PRODUCTS || []).map(function (p) { return Object.assign({ imgs: [] }, p); });
var KEY = "naqa_overrides";
var PIN = "naqa_admin_pin";
var TOKEN = "naqa_gh_token";
var overrides = {};
try { overrides = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { overrides = {}; }

function esc(v) {
  return String(v == null ? "" : v).replace(/&/g, "&").replace(/</g, "<").replace(/"/g, """);
}
function rowOf(p) {
  var o = overrides[p.id] || overrides[String(p.id)] || {};
  return {
    price: o.price != null && o.price !== "" ? o.price : p.price,
    was: o.was != null ? o.was : (p.was || ""),
    hidden: !!(o.hidden != null ? o.hidden : p.hidden)
  };
}
function readForm() {
  document.querySelectorAll("[data-id]").forEach(function (box) {
    var id = box.getAttribute("data-id");
    var price = box.querySelector("[data-f=price]").value;
    var was = box.querySelector("[data-f=was]").value;
    var hidden = box.querySelector("[data-f=hidden]").checked;
    var next = {};
    if (price !== "") next.price = Number(price);
    if (was !== "") next.was = Number(was);
    if (hidden) next.hidden = true;
    if (Object.keys(next).length) overrides[id] = next;
    else delete overrides[id];
  });
}
function paint(q) {
  q = (q || "").toLowerCase();
  var html = products.filter(function (p) {
    var blob = [p.nameAr, p.nameEn, p.brand, p.sku, p.id].join(" ").toLowerCase();
    return !q || blob.indexOf(q) >= 0;
  }).map(function (p) {
    var o = rowOf(p);
    var img = (p.imgs && p.imgs[0]) || "";
    var thumb = img ? '<img src="' + esc(img) + '" alt="">' : '<div class="ph"></div>';
    return '<article class="row" data-id="' + p.id + '">' + thumb
      + '<div><strong>' + esc(p.nameAr || p.nameEn) + '</strong><small>' + esc(p.brand || "") + ' · SKU ' + esc(p.sku || "—") + '</small></div>'
      + '<div class="ed"><label>السعر<input data-f="price" type="number" min="0" step="0.001" value="' + esc(o.price) + '"></label>'
      + '<label>قبل الخصم<input data-f="was" type="number" min="0" step="0.001" value="' + esc(o.was) + '"></label>'
      + '<label class="hide"><input data-f="hidden" type="checkbox"' + (o.hidden ? " checked" : "") + '> إخفاء</label></div></article>';
  }).join("");
  document.getElementById("list").innerHTML = html || '<p class="note">ما في نتائج</p>';
}
function saveLocal() {
  readForm();
  localStorage.setItem(KEY, JSON.stringify(overrides));
  document.getElementById("status").textContent = "انحفظ على هذا الآيفون. الزباین الثانية ما تشوف التغيير إلا بعد النشر.";
}
function utf8b64(text) {
  return btoa(unescape(encodeURIComponent(text)));
}
function publish() {
  readForm();
  localStorage.setItem(KEY, JSON.stringify(overrides));
  var token = document.getElementById("token").value.trim() || localStorage.getItem(TOKEN) || "";
  var status = document.getElementById("status");
  if (!token) {
    status.textContent = "انحفظ على جهازك. للنشر لكل الزباين: من GitHub سوي Fine-grained token صلاحية Contents على مستودع naqa-om، والصقيه هنا مرة.";
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
  paint("");
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
  readForm();
  paint(e.target.value.trim());
});
document.getElementById("saveLocal").onclick = saveLocal;
document.getElementById("publish").onclick = publish;
