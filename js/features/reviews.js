/* Real reviews only. Approved list is data/reviews.json. No phone numbers. */
var NAQA_REVIEWS = [];

function loadReviews() {
  return fetch("data/reviews.json?v=" + Date.now())
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (list) {
      NAQA_REVIEWS = Array.isArray(list) ? list : [];
      if (openProductId && typeof openSheet === "function") {
        var mode = (typeof sheetMode !== "undefined") ? sheetMode : "full";
        if (mode !== "qv") openSheet(openProductId, mode, false);
      }
    })
    .catch(function () { NAQA_REVIEWS = []; });
}

function reviewsFor(p) {
  if (!p) return [];
  return NAQA_REVIEWS.filter(function (r) {
    if (!r) return false;
    if (r.pid != null && Number(r.pid) === Number(p.id)) return true;
    return r.sku && p.sku && String(r.sku) === String(p.sku);
  });
}

function reviewText(r) {
  var ar = (r.ar || "").trim();
  var en = (r.en || "").trim();
  if (typeof lang !== "undefined" && lang === "en") return en || ar;
  return ar || en;
}

function reviewHTML(p) {
  var list = reviewsFor(p);
  if (!list.length) return "";
  var avg = list.reduce(function (s, r) { return s + Number(r.stars || 0); }, 0) / list.length;
  var label = (typeof lang !== "undefined" && lang === "en")
    ? (list.length + (list.length === 1 ? " review" : " reviews"))
    : (list.length + " تقييم");
  return '<div class="review-pill">' + avg.toFixed(1) + " ★ · " + label + "</div>";
}

function reviewsSection(p) {
  var en = typeof lang !== "undefined" && lang === "en";
  var list = reviewsFor(p);
  var cards = list.map(function (r) {
    var photo = r.photo ? '<img class="review-photo" src="' + esc(r.photo) + '" alt="">' : "";
    return '<article class="review-card"><header><span>' + esc(r.name || (en ? "Customer" : "زبونة")) + '</span><span>' + "★".repeat(Math.max(1, Math.min(5, Number(r.stars) || 0))) + '</span></header><p>' + esc(reviewText(r)) + '</p>' + photo + '</article>';
  }).join("");
  var empty = list.length ? "" : '<p class="review-empty">' + (en ? "No reviews yet. Be the first." : "لا تقييمات بعد. كوني الأولى.") + "</p>";
  return '<section class="reviews-block"><h4 class="block-h">' + (en ? "Real reviews" : "تقييمات حقيقية") + '</h4>'
    + '<p class="review-empty">' + (en ? "A nickname, your words, and an optional photo. Your phone number is never shown. It appears after we approve it." : "لقب، كلامك، وصورة اختيارية. رقمك ما يننشر. يظهر بعد الموافقة.") + "</p>"
    + empty + cards
    + '<button type="button" class="btn-ghost" data-write-review="' + p.id + '" style="margin-top:8px;border:1px solid var(--line);border-radius:12px;padding:10px 14px;font-weight:800">' + (en ? "Write a review" : "اكتبي تقييمك") + "</button></section>";
}

function ensureReviewForm() {
  if (document.getElementById("reviewOverlay")) return;
  var el = document.createElement("div");
  el.id = "reviewOverlay";
  el.className = "review-overlay";
  el.hidden = true;
  el.innerHTML = '<form class="review-card-form" id="reviewForm">'
    + '<h3 id="reviewTitle" style="margin:0 0 6px"></h3>'
    + '<p class="review-empty" id="reviewLead"></p>'
    + '<div class="star-pick" id="starPick"></div>'
    + '<label id="lblName"></label><input id="rvName" maxlength="24" autocomplete="nickname">'
    + '<label id="lblText"></label><textarea id="rvText" maxlength="600" rows="4"></textarea>'
    + '<label id="lblPhoto"></label><input id="rvPhoto" type="file" accept="image/*">'
    + '<p class="review-empty" id="rvMsg"></p>'
    + '<div style="display:flex;gap:8px;margin-top:12px">'
    + '<button type="submit" class="btn-add" id="rvSend" style="flex:1;border:0;border-radius:12px;padding:12px;font-weight:800;background:#1f1a17;color:#fff"></button>'
    + '<button type="button" id="rvClose" style="border:1px solid var(--line);border-radius:12px;padding:12px;font-weight:800;background:#fff"></button>'
    + '</div></form>';
  document.body.appendChild(el);
  var pick = document.getElementById("starPick");
  for (var i = 1; i <= 5; i++) {
    var b = document.createElement("button");
    b.type = "button";
    b.dataset.star = String(i);
    b.textContent = "★";
    pick.appendChild(b);
  }
  pick.addEventListener("click", function (e) {
    var b = e.target.closest("[data-star]");
    if (!b) return;
    el.dataset.stars = b.dataset.star;
    pick.querySelectorAll("button").forEach(function (x) {
      x.classList.toggle("on", Number(x.dataset.star) <= Number(el.dataset.stars));
    });
  });
  document.getElementById("rvClose").onclick = function () { el.hidden = true; };
  el.addEventListener("click", function (e) { if (e.target === el) el.hidden = true; });
  document.getElementById("reviewForm").addEventListener("submit", submitReview);
}

function openReviewForm(id) {
  var p = products.find(function (x) { return x.id === id; });
  if (!p) return;
  ensureReviewForm();
  var el = document.getElementById("reviewOverlay");
  var en = typeof lang !== "undefined" && lang === "en";
  el.dataset.pid = String(p.id);
  el.dataset.stars = "5";
  document.getElementById("reviewTitle").textContent = en ? "Review this product" : "قيّمي هذا المنتج";
  document.getElementById("reviewLead").textContent = pname(p);
  document.getElementById("lblName").textContent = en ? "Nickname shown on the site" : "اللقب الذي يظهر في الموقع";
  document.getElementById("lblText").textContent = en ? "Your experience, in English or Arabic" : "تجربتك، بالعربي أو الإنجليزي";
  document.getElementById("lblPhoto").textContent = en ? "Photo, optional" : "صورة، اختيارية";
  document.getElementById("rvSend").textContent = en ? "Send" : "إرسال";
  document.getElementById("rvClose").textContent = en ? "Close" : "إغلاق";
  document.getElementById("rvName").value = "";
  document.getElementById("rvText").value = "";
  document.getElementById("rvPhoto").value = "";
  document.getElementById("rvMsg").textContent = en
    ? "We read it first. Your phone number is not published."
    : "نقرأ التقييم أولاً. رقمك ما يننشر.";
  document.querySelectorAll("#starPick button").forEach(function (x) { x.classList.add("on"); });
  el.hidden = false;
}

function looksLikePhone(s) {
  var digits = String(s || "").replace(/\D/g, "");
  return digits.length >= 8;
}

function hasArabic(s) {
  return /[\u0600-\u06FF]/.test(s || "");
}

function submitReview(e) {
  e.preventDefault();
  var el = document.getElementById("reviewOverlay");
  var en = typeof lang !== "undefined" && lang === "en";
  var p = products.find(function (x) { return String(x.id) === String(el.dataset.pid); });
  if (!p) return;
  var name = document.getElementById("rvName").value.trim();
  var text = document.getElementById("rvText").value.trim();
  var stars = Number(el.dataset.stars || 0);
  var msg = document.getElementById("rvMsg");
  if (name.length < 2) { msg.textContent = en ? "Add a nickname." : "اكتبي لقباً."; return; }
  if (looksLikePhone(name) || looksLikePhone(text)) { msg.textContent = en ? "Don't include a phone number." : "لا تكتبي رقم هاتف."; return; }
  if (text.length < 8) { msg.textContent = en ? "Write a little more about the product." : "اكتبي أكثر عن المنتج."; return; }
  if (stars < 1) { msg.textContent = en ? "Choose the stars." : "اختاري النجوم."; return; }
  var fileInput = document.getElementById("rvPhoto");
  var file = fileInput.files && fileInput.files[0];
  var body = (en ? "Naqa review" : "تقييم نقاء") + "\n"
    + (p.sku || "") + " · " + pname(p) + "\n"
    + "★".repeat(stars) + " " + stars + "/5\n"
    + name + "\n" + text;
  if (file) body += en ? "\n\nPhoto is attached." : "\n\nالصورة مرفقة.";
  else body += "";
  var share = { text: body, title: "Naqa" };
  if (file) share.files = [file];
  var done = function () {
    el.hidden = true;
    if (typeof toast === "function") toast(en ? "Sent. It shows after approval." : "وصل. يظهر بعد الموافقة.");
  };
  if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share(share).then(done).catch(function (err) {
      if (err && err.name === "AbortError") return;
      openWaReview(body + (en ? "\n\nAttach the photo in the chat." : "\n\nأرفقي الصورة في نفس المحادثة."));
      done();
    });
    return;
  }
  if (!file && navigator.share) {
    navigator.share({ text: body, title: "Naqa" }).then(done).catch(function (err) {
      if (err && err.name === "AbortError") return;
      openWaReview(body);
      done();
    });
    return;
  }
  openWaReview(body + (file ? (en ? "\n\nAttach the photo in the chat." : "\n\nأرفقي الصورة في نفس المحادثة.") : ""));
  done();
}

function openWaReview(text) {
  var n = (typeof WA_NUMBER !== "undefined") ? WA_NUMBER : "96879088349";
  window.open("https://wa.me/" + n + "?text=" + encodeURIComponent(text), "_blank");
}

document.addEventListener("click", function (e) {
  var b = e.target.closest("[data-write-review]");
  if (!b) return;
  e.preventDefault();
  openReviewForm(Number(b.dataset.writeReview));
});

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadReviews);
else loadReviews();
