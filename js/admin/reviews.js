(function (w) {
  var A = w.NaqaAdmin;
  function stars(n) { return "★".repeat(Math.max(1, Math.min(5, Number(n) || 0))); }
  function saveLocal() {
    A.reviews.forEach(function (r) {
      if (r.photoB64 && r.photoB64.length > 1800000) r.photoB64 = "";
    });
    try { localStorage.setItem(A.REVIEWS_KEY, JSON.stringify(A.reviews)); } catch (e) {}
  }
  function fileToJpeg(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var max = 900, s = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.72).split(",")[1]);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("photo")); };
      img.src = url;
    });
  }
  A.publishReviews = function (token) {
    var uploads = (A.reviews || []).filter(function (r) { return r.photoB64; }).map(function (r) {
      var path = "media/reviews/" + r.id + ".jpg";
      return A.ghPutB64(path, r.photoB64, token, "chore: review photo " + r.id).then(function (res) {
        if (!res.ok) throw new Error("photo");
        r.photo = path;
        delete r.photoB64;
      });
    });
    return Promise.all(uploads).then(function () {
      saveLocal();
      var pub = (A.reviews || []).filter(function (r) { return r.on !== false; }).map(function (r) {
        return { id: r.id, sku: r.sku || "", pid: r.pid, name: r.name || "", stars: Number(r.stars) || 5, ar: r.ar || "", en: r.en || "", photo: r.photo || "", at: r.at || "" };
      });
      return A.ghPut("data/reviews.json", JSON.stringify(pub, null, 2) + "\n", token, "chore: publish approved reviews");
    });
  };
  A.paintReviews = function () {
    var box = document.getElementById("reviewsBox");
    if (!box) return;
    fetch("data/reviews.json?v=" + Date.now()).then(function (r) { return r.ok ? r.json() : []; }).then(function (remote) {
      if (Array.isArray(remote)) {
        remote.forEach(function (r) {
          if (!A.reviews.some(function (x) { return x.id === r.id; })) A.reviews.push(r);
        });
      }
      draw();
    }).catch(draw);
    function draw() {
      var opts = (w.products || []).map(function (p) {
        return '<option value="' + A.esc(p.sku || "") + '">' + A.esc((p.sku || "") + " · " + (p.brand || "") ) + "</option>";
      }).join("");
      var rows = (A.reviews || []).map(function (r) {
        var img = r.photo ? '<img src="' + A.esc(r.photo) + '" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:10px">' : "";
        return '<div class="row"><div>' + img + '<strong>' + A.esc(r.name || "") + " " + stars(r.stars) + '</strong><small>' + A.esc(r.sku || "") + " · " + A.esc((r.ar || r.en || "").slice(0, 80)) + '</small></div>'
          + '<button type="button" class="mini" data-rv-off="' + A.esc(r.id) + '">' + (r.on === false ? "إظهار" : "إخفاء") + '</button>'
          + '<button type="button" class="mini" data-rv-del="' + A.esc(r.id) + '">حذف</button></div>';
      }).join("") || '<p class="note">لا تقييمات منشورة بعد.</p>';
      box.innerHTML = '<div class="panel"><h2>تقييمات الزبونات</h2>'
        + '<p class="note">الزبونة ترسل الكلام والصورة على واتساب. أنتِ توافقين هنا: لقب، نجوم، عربي، إنجليزي، وصورة. الرقم ما ينحفظ ولا يننشر. بعدين «نشر للكل».</p>'
        + '<label>SKU المنتج<input id="rvSku" list="rvSkus" placeholder="SKU"></label><datalist id="rvSkus">' + opts + '</datalist>'
        + '<label>اللقب<input id="rvName" maxlength="24"></label>'
        + '<label>النجوم<select id="rvStars"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></label>'
        + '<label>النص العربي<textarea id="rvAr" rows="3"></textarea></label>'
        + '<label>English text<textarea id="rvEn" rows="3"></textarea></label>'
        + '<label>صورة اختيارية<input id="rvFile" type="file" accept="image/*"></label>'
        + '<button type="button" class="primary" id="rvAdd" style="width:100%;margin-top:8px">إضافة التقييم</button>'
        + '</div>' + rows;
      document.getElementById("rvAdd").onclick = addReview;
      box.querySelectorAll("[data-rv-del]").forEach(function (b) {
        b.onclick = function () {
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
    var p = (w.products || []).find(function (x) { return String(x.sku) === sku; });
    if (!p) { if (status) status.textContent = "SKU غير موجود."; return; }
    if (name.length < 2 || (ar.length < 2 && en.length < 2)) { if (status) status.textContent = "اللقب والنص مطلوبان."; return; }
    var rec = { id: "rv" + Date.now().toString(36), sku: p.sku, pid: p.id, name: name, stars: starsN, ar: ar, en: en, photo: "", at: new Date().toISOString().slice(0, 10), on: true };
    var file = document.getElementById("rvFile").files[0];
    var finish = function () {
      A.reviews.unshift(rec);
      saveLocal();
      if (status) status.textContent = "انضاف على جهازك. اضغطي «نشر للكل» عشان يظهر في المتجر.";
      A.paintReviews();
    };
    if (!file) { finish(); return; }
    fileToJpeg(file).then(function (b64) { rec.photoB64 = b64; finish(); }).catch(function () {
      if (status) status.textContent = "الصورة ما انفتحت.";
    });
  }
})(window);
