/* Real reviews only. Approved list is data/reviews.json. No phone numbers. */
var NAQA_REVIEWS = [];

function applyReviewsList(list) {
  NAQA_REVIEWS = Array.isArray(list) ? list : [];
  if (typeof openProductId !== "undefined" && openProductId && typeof openSheet === "function") {
    var mode = (typeof sheetMode !== "undefined") ? sheetMode : "full";
    if (mode !== "qv") openSheet(openProductId, mode, false);
  }
}
function loadReviewsFromCloud() {
  try {
    if (!window.firebase || !firebase.apps || !firebase.apps.length || !firebase.firestore) return Promise.resolve(null);
    return firebase.firestore().collection("naqa").doc("reviews").get().then(function (snap) {
      if (!snap.exists) return null;
      var d = snap.data() || {};
      var list = d.list || d.reviews || null;
      return Array.isArray(list) ? list : null;
    }).catch(function () { return null; });
  } catch (e) { return Promise.resolve(null); }
}
function loadReviews() {
  return fetch("data/reviews.json?v=" + Date.now())
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (list) {
      applyReviewsList(Array.isArray(list) ? list : []);
      return loadReviewsFromCloud().then(function (cloud) {
        if (cloud && cloud.length) applyReviewsList(cloud);
      });
    })
    .catch(function () {
      return loadReviewsFromCloud().then(function (cloud) {
        applyReviewsList(cloud || []);
      }).catch(function () { NAQA_REVIEWS = []; });
    });
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
  return '<div class="review-pill"><span class="rv-stars" aria-hidden="true">★</span> ' + avg.toFixed(1) + " · " + label + "</div>";
}

function reviewsSection(p) {
  var en = typeof lang !== "undefined" && lang === "en";
  var list = reviewsFor(p);
  var cards = list.map(function (r) {
    var photo = r.photo ? '<img class="review-photo" src="' + esc(r.photo) + '" alt="' + (en ? "Review photo" : "صورة التقييم") + '">' : "";
    return '<article class="review-card"><header><span>' + esc(r.name || (en ? "Customer" : "زبونة")) + '</span><span class="rv-stars" aria-hidden="true">' + "★".repeat(Math.max(1, Math.min(5, Number(r.stars) || 0))) + '</span></header><p>' + esc(reviewText(r)) + '</p>' + photo + '</article>';
  }).join("");
  var empty = list.length ? "" : '<p class="review-empty">' + (en ? "No reviews yet. Be the first." : "لا تقييمات بعد. كوني الأولى.") + "</p>";
  var thanks = en
    ? "Thank you for sharing your experience. It means a lot to us."
    : "شكراً لمشاركتكِ تجربتكِ. رأيكِ يعني لنا الكثير.";
  return '<section class="reviews-block"><h4 class="block-h">' + (en ? "Reviews" : "التقييمات") + '</h4>'
    + empty + cards
    + '<p class="review-empty">' + thanks + '</p>'
    + '<button type="button" class="btn-ghost btn-write-review" data-write-review="' + p.id + '">' + (en ? "Write a review (1–5 stars)" : "اكتبي تقييمك (من 1 إلى 5 نجوم)") + "</button></section>";
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
    + '<div class="star-pick" id="starPick" role="group" aria-label="stars"></div>'
    + '<p class="star-count" id="starCount" aria-live="polite"></p>'
    + '<label id="lblName"></label><input id="rvName" maxlength="24" autocomplete="nickname">'
    + '<label id="lblText"></label><textarea id="rvText" maxlength="600" rows="4"></textarea>'
    + '<label id="lblPhoto"></label><input id="rvPhoto" type="file" accept="image/*">'
    + '<p class="review-empty" id="rvMsg"></p>'
    + '<div style="display:flex;gap:8px;margin-top:12px">'
    + '<button type="submit" class="btn-add" id="rvSend" style="flex:1;border:0;border-radius:12px;padding:12px;font-weight:700"></button>'
    + '<button type="button" id="rvClose" style="border:1px solid var(--line);border-radius:12px;padding:12px;font-weight:800;background:#fff"></button>'
    + '</div></form>';
  document.body.appendChild(el);
  var pick = document.getElementById("starPick");
  for (var i = 1; i <= 5; i++) {
    var b = document.createElement("button");
    b.type = "button";
    b.dataset.star = String(i);
    b.textContent = "★";
    b.setAttribute("aria-label", String(i));
    pick.appendChild(b);
  }
  function paintStars(n) {
    n = Math.max(1, Math.min(5, Number(n) || 5));
    el.dataset.stars = String(n);
    pick.querySelectorAll("button").forEach(function (x) {
      var on = Number(x.dataset.star) <= n;
      x.classList.toggle("on", on);
      x.setAttribute("aria-pressed", on && Number(x.dataset.star) === n ? "true" : (on ? "true" : "false"));
    });
    var sc = document.getElementById("starCount");
    if (sc) {
      var en = typeof lang !== "undefined" && lang === "en";
      sc.textContent = en ? ("You chose " + n + " of 5 stars") : ("اخترتِ " + n + " من 5 نجوم");
    }
  }
  el.__paintStars = paintStars;
  pick.addEventListener("click", function (e) {
    var b = e.target.closest("[data-star]");
    if (!b) return;
    paintStars(b.dataset.star);
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
    ? "Thank you. We are glad you are here."
    : "شكراً لكِ. يسعدنا وجودكِ.";
  if (typeof el.__paintStars === "function") el.__paintStars(5);
  else document.querySelectorAll("#starPick button").forEach(function (x) { x.classList.add("on"); });
  el.hidden = false;
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
  if (text.length < 8) { msg.textContent = en ? "Write a little more about the product." : "اكتبي أكثر عن المنتج."; return; }
  if (stars < 1) { msg.textContent = en ? "Choose the stars." : "اختاري النجوم."; return; }
  var fileInput = document.getElementById("rvPhoto");
  var file = fileInput.files && fileInput.files[0];
  var sendBtn = document.getElementById("rvSend");
  if (sendBtn) sendBtn.disabled = true;
  shrinkReviewPhoto(file).then(function (photo) {
    var id = "rv" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    var data = {
      kind: "review",
      pid: Number(p.id),
      sku: String(p.sku || ""),
      name: name.slice(0, 24),
      stars: stars,
      text: text.slice(0, 600),
      lang: en ? "en" : "ar",
      photo: photo && photo.length < 650000 ? photo : "",
      at: Date.now()
    };
    function thanks() {
      if (sendBtn) sendBtn.disabled = false;
      el.hidden = true;
      if (typeof toast === "function") {
        toast(en
          ? ("Thank you · " + stars + " stars sent")
          : ("شكراً لكِ · تم إرسال " + stars + " نجوم"));
      }
    }
    function openWa() {
      var n = (typeof WA_NUMBER !== "undefined") ? WA_NUMBER : "96879088349";
      var body = (en ? "Naqa review" : "تقييم نقاء") + "\n"
        + (p.sku || "") + " · " + pname(p) + "\n"
        + "★".repeat(stars) + " " + stars + "/5\n"
        + name + "\n" + text;
      window.open("https://wa.me/" + n + "?text=" + encodeURIComponent(body), "_blank");
    }
    function deliver() {
      thanks();
      try {
        if (window.NAQA_FIREBASE && window.firebase && firebase.apps && !firebase.apps.length && firebase.initializeApp) {
          firebase.initializeApp(window.NAQA_FIREBASE);
        }
        if (window.firebase && firebase.firestore) {
          firebase.firestore().collection("naqa_inbox").doc(id).set(data).catch(function () { openWa(); });
          return;
        }
      } catch (err) {}
      openWa();
    }
    deliver();
  });
}

function shrinkReviewPhoto(file) {
  return new Promise(function (resolve) {
    if (!file) { resolve(""); return; }
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      var max = 640;
      var s = Math.min(1, max / Math.max(img.width, img.height));
      var c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * s));
      c.height = Math.max(1, Math.round(img.height * s));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.62));
    };
    img.onerror = function () { URL.revokeObjectURL(url); resolve(""); };
    img.src = url;
  });
}

document.addEventListener("click", function (e) {
  var b = e.target.closest("[data-write-review]");
  if (!b) return;
  e.preventDefault();
  openReviewForm(Number(b.dataset.writeReview));
});

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadReviews);
else loadReviews();
