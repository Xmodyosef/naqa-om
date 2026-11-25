(function (w) {
  var A = w.NaqaAdmin;
  function stars(n) { return "★".repeat(Math.max(1, Math.min(5, Number(n) || 0))); }
  function saveLocal() {
    A.reviews.forEach(function (r) {
      if (r.photoB64 && r.photoB64.length > 900000) r.photoB64 = "";
    });
    try { localStorage.setItem(A.REVIEWS_KEY, JSON.stringify(A.reviews)); } catch (e) {}
  }
  function fileToJpeg(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var max = 720, s = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.7).split(",")[1]);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("photo")); };
      img.src = url;
    });
  }
  function publicList() {
    return (A.reviews || []).filter(function (r) { return r.on !== false && !r.sample; }).map(function (r) {
      var photo = r.photo || "";
      if (!photo && r.photoB64 && r.photoB64.length < 700000) {
        photo = "data:image/jpeg;base64," + r.photoB64;
      }
      return {
        id: r.id,
        sku: r.sku || "",
        pid: r.pid,
        name: r.name || "",
        stars: Number(r.stars) || 5,
        ar: r.ar || "",
        en: r.en || "",
        photo: photo,
        at: r.at || ""
      };
    });
  }
  function fsDoc() {
    try {
      if (!w.firebase || !firebase.apps || !firebase.apps.length) return null;
      if (!firebase.firestore) return null;
      return firebase.firestore().collection("naqa").doc("reviews");
    } catch (e) { return null; }
  }
  /** Publish approved reviews to Firestore for the live store (no GitHub token). */
  A.syncReviewsCloud = function () {
    saveLocal();
    var list = publicList();
    var doc = fsDoc();
    if (!doc) {
      return Promise.reject(new Error("no-firestore"));
    }
    var user = null;
    try { user = firebase.auth && firebase.auth().currentUser; } catch (e) {}
    if (!user) return Promise.reject(new Error("not-signed-in"));
    return doc.set({
      list: list,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: user.uid || ""
    }, { merge: false }).then(function () { return true; });
  };
  A.publishReviews = function () {
    return A.syncReviewsCloud().then(function () {
      if (A.setMsg) A.setMsg("reviewStatus", A.t("r_published") || (A.lang === "en" ? "Reviews published to the store ✓" : "انشرت التقييمات على المتجر ✓"));
      try { if (A.activity && A.activity.log) A.activity.log(A.lang === "en" ? "Publish reviews" : "نشر تقييمات", ""); } catch (e) {}
      return true;
    }).catch(function (err) {
      var code = (err && (err.code || err.message)) || "";
      var msg = A.t("r_publishFail") || (A.lang === "en" ? "Could not publish reviews." : "ما قدرنا ننشر التقييمات.");
      if (String(code).indexOf("not-signed-in") >= 0) {
        msg = A.lang === "en" ? "Sign in first." : "سجّلي الدخول أولاً.";
      } else if (String(code).indexOf("permission") >= 0 || String(code).indexOf("Permission") >= 0) {
        msg = A.lang === "en"
          ? "Permission denied. Publish firestore.rules once in Firebase Console (reviews path)."
          : "مرفوض. انشري ملف firestore.rules مرة في Firebase (مسار التقييمات).";
      } else if (String(code).indexOf("no-firestore") >= 0) {
        msg = A.lang === "en" ? "Firestore not ready. Check network." : "Firestore غير جاهز. راجعي النت.";
      }
      if (A.setMsg) A.setMsg("reviewStatus", msg);
      return false;
    });
  };
  A.paintReviews = function () {
    var box = document.getElementById("reviewsBox");
    if (!box) return;
    function mergeRemoteJson() {
      return fetch("data/reviews.json?v=" + Date.now()).then(function (r) { return r.ok ? r.json() : []; }).then(function (remote) {
        if (Array.isArray(remote)) {
          remote.forEach(function (r) {
            if (!r || !r.id) return;
            var hit = A.reviews.find(function (x) { return x.id === r.id; });
            if (!hit) A.reviews.push(r);
            else if (!hit.phone && r.phone) hit.phone = r.phone;
          });
        }
      }).catch(function () {});
    }
    function mergeCloud() {
      var doc = fsDoc();
      if (!doc) return Promise.resolve();
      return doc.get().then(function (snap) {
        if (!snap.exists) return;
        var d = snap.data() || {};
        var list = d.list || d.reviews || [];
        if (!Array.isArray(list)) return;
        list.forEach(function (r) {
          if (!r || !r.id) return;
          if (!A.reviews.some(function (x) { return x.id === r.id; })) A.reviews.push(r);
        });
      }).catch(function () {});
    }
    Promise.resolve().then(mergeRemoteJson).then(mergeCloud).then(draw).catch(draw);
    function phoneDigits(s) {
      return String(s || "").replace(/\D/g, "");
    }
    function matchPhone(r, q) {
      q = String(q || "").trim();
      if (!q) return true;
      var d = phoneDigits(q);
      var p = phoneDigits(r && r.phone);
      if (d) return p.indexOf(d) >= 0;
      return String((r && r.phone) || "").indexOf(q) >= 0;
    }
    A.exportReviewsCsv = function () {
      var ar = A.lang !== "en";
      var head = ar
        ? ["الجوال", "الاسم", "SKU", "النجوم", "عربي", "English", "الطلب"]
        : ["phone", "name", "SKU", "stars", "Arabic", "English", "order"];
      var rows = [head];
      var q = A.reviewQuery || "";
      (A.reviews || []).filter(function (r) { return matchPhone(r, q); }).forEach(function (r) {
        rows.push([r.phone || "", r.name || "", r.sku || "", r.stars || "", r.ar || "", r.en || "", r.order || ""]);
      });
      A.downloadCsv("naqa-reviews.csv", rows);
    };
    function draw() {
      var q = A.reviewQuery || "";
      var rows = (A.reviews || []).filter(function (r) { return matchPhone(r, q); }).map(function (r) {
        var imgSrc = r.photo || (r.photoB64 ? ("data:image/jpeg;base64," + r.photoB64) : "");
        var img = imgSrc ? '<img src="' + A.esc(imgSrc) + '" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:10px">' : "";
        var sample = r.sample ? (' <span class="tax-mark">' + (A.lang === "en" ? "Preview" : "تجريبي") + '</span>') : "";
        var phone = r.phone ? (' · ' + A.esc(r.phone)) : "";
        var ord = r.order ? (" · " + A.esc(r.order)) : "";
        return '<div class="row"><div>' + img + '<strong>' + A.esc(r.name || "") + " " + stars(r.stars) + sample + '</strong><small>' + A.esc(r.sku || "") + phone + ord + " · " + A.esc((r.ar || r.en || "").slice(0, 80)) + '</small></div></div>';
      }).join("");
      if (!rows) {
        rows = '<p class="note">' + A.esc(q
          ? (A.t("r_phoneEmpty") || (A.lang === "en" ? "No review for this number" : "ما في تقييم لهذا الرقم"))
          : (A.t("r_empty") || (A.lang === "en" ? "No reviews yet." : "لا تقييمات بعد."))) + '</p>';
      }
      box.innerHTML = '<div class="panel"><h2>' + A.t("r_title") + '</h2>'
        + '<div id="reviewStatus" class="msg"></div>'
        + rows
        + '</div>';
    }
  };
  
    function addReview() {
    var sku = document.getElementById("rvSku").value.trim();
    var name = document.getElementById("rvName").value.trim();
    var ar = document.getElementById("rvAr").value.trim();
    var en = document.getElementById("rvEn").value.trim();
    var starsN = Number(document.getElementById("rvStars").value);
    var status = document.getElementById("reviewStatus");
    var p = (A.products || w.products || []).find(function (x) { return String(x.sku) === sku; });
    if (!p) { if (status) status.textContent = A.t("r_badSku"); return; }
    if (name.length < 2 || (ar.length < 2 && en.length < 2)) { if (status) status.textContent = A.t("r_need"); return; }
    var rec = { id: "rv" + Date.now().toString(36), sku: p.sku, pid: p.id, name: name, stars: starsN, ar: ar, en: en, photo: "", at: new Date().toISOString().slice(0, 10), on: true };
    var file = document.getElementById("rvFile").files[0];
    var finish = function () {
      A.reviews.unshift(rec);
      saveLocal();
      if (status) status.textContent = A.t("r_added");
      A.paintReviews();
    };
    if (!file) { finish(); return; }
    fileToJpeg(file).then(function (b64) { rec.photoB64 = b64; finish(); }).catch(function () {
      if (status) status.textContent = A.t("r_photoFail");
    });
  }
})(window);
