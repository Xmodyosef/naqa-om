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
    return (A.reviews || []).filter(function (r) { return r.on !== false; }).map(function (r) {
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
      return true;
    }).catch(function (err) {
      var code = err && err.message;
      var msg = A.lang === "en" ? "Could not publish reviews." : "ما قدرنا ننشر التقييمات.";
      if (code === "not-signed-in") msg = A.lang === "en" ? "Sign in first." : "سجّلي الدخول أولاً.";
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
            if (!A.reviews.some(function (x) { return x.id === r.id; })) A.reviews.push(r);
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
    function draw() {
      var opts = (A.products || w.products || []).map(function (p) {
        return '<option value="' + A.esc(p.sku || "") + '">' + A.esc((p.sku || "") + " · " + (p.brand || "") ) + "</option>";
      }).join("");
      var rows = (A.reviews || []).filter(function (r) { return A.inDateRange(r.at); }).map(function (r) {
        var imgSrc = r.photo || (r.photoB64 ? ("data:image/jpeg;base64," + r.photoB64) : "");
        var img = imgSrc ? '<img src="' + A.esc(imgSrc) + '" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:10px">' : "";
        var when = r.at ? new Date(r.at).toLocaleDateString(A.lang === "en" ? "en-OM" : "ar-OM") : "";
        return '<div class="row"><div>' + img + '<strong>' + A.esc(r.name || "") + " " + stars(r.stars) + '</strong><small>' + A.esc(r.sku || "") + (when ? " · " + A.esc(when) : "") + " · " + A.esc((r.ar || r.en || "").slice(0, 80)) + '</small></div>'
          + '<button type="button" class="mini" data-rv-off="' + A.esc(r.id) + '">' + (r.on === false ? A.t("r_show") : A.t("r_hide")) + '</button>'
          + '<button type="button" class="mini" data-rv-del="' + A.esc(r.id) + '">' + A.t("del") + '</button></div>';
      }).join("") || '<p class="note">' + A.t("r_empty") + '</p>';
      box.innerHTML = '<div class="panel"><h2>' + A.t("r_title") + '</h2>'
        + '<p class="note">' + A.t("r_note") + '</p>'
        + A.dateFilterHtml("revDate")
        + '<div class="status-bar" style="margin:8px 0;flex-wrap:wrap;gap:6px">'
        + '<button type="button" class="primary" id="publishReviewsBtn">' + (A.t("r_publish") || (A.lang === "en" ? "Publish to store" : "انشري للمتجر")) + '</button>'
        + '<button type="button" class="mini" id="exportReviewsCsv">' + A.t("exportCsv") + '</button></div>'
        + '<label>' + A.t("r_sku") + '<input id="rvSku" list="rvSkus" placeholder="SKU"></label><datalist id="rvSkus">' + opts + '</datalist>'
        + '<label>' + A.t("r_nick") + '<input id="rvName" maxlength="24"></label>'
        + '<label>' + A.t("r_stars") + '<select id="rvStars"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></label>'
        + '<label>' + A.t("r_ar") + '<textarea id="rvAr" rows="3"></textarea></label>'
        + '<label>' + A.t("r_en") + '<textarea id="rvEn" rows="3"></textarea></label>'
        + '<label>' + A.t("r_photo") + '<input id="rvFile" type="file" accept="image/*"></label>'
        + '<button type="button" class="primary" id="rvAdd" style="width:100%;margin-top:8px">' + A.t("r_add") + '</button>'
        + '</div>' + rows;
      document.getElementById("rvAdd").onclick = addReview;
      var pubBtn = document.getElementById("publishReviewsBtn");
      if (pubBtn) pubBtn.onclick = function () {
        if (A.setMsg) A.setMsg("reviewStatus", A.lang === "en" ? "Publishing…" : "جاري النشر…");
        A.publishReviews();
      };
      A.bindDateFilter("revDate", draw);
      var er = document.getElementById("exportReviewsCsv");
      if (er) er.onclick = function () {
        var rows = [["id", "at", "sku", "name", "stars", "ar", "en", "on"]];
        (A.reviews || []).filter(function (r) { return A.inDateRange(r.at); }).forEach(function (r) {
          rows.push([r.id || "", r.at || "", r.sku || "", r.name || "", r.stars || "", r.ar || "", r.en || "", r.on === false ? "off" : "on"]);
        });
        A.downloadCsv("naqa-reviews.csv", rows);
      };
      box.querySelectorAll("[data-rv-del]").forEach(function (b) {
        b.onclick = function () {
          if (!confirm(A.t("delConfirm"))) return;
          A.reviews = A.reviews.filter(function (r) { return r.id !== b.dataset.rvDel; });
          saveLocal();
          draw();
        };
      });
      box.querySelectorAll("[data-rv-off]").forEach(function (b) {
        b.onclick = function () {
          A.reviews.forEach(function (r) { if (r.id === b.dataset.rvOff) r.on = r.on === false; });
          saveLocal();
          draw();
        };
      });
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
