/* Hide/overrides: docs/ENGINEERING-RULES.md §2 — data-hide + explicit delete hidden + cloud sync */
(function (w) {
  var A = w.NaqaAdmin;
  var MAX_IMGS = 6;

  var __editScale = 1;
  var __pinch = null;
  var __pinchDocBound = false;
  var __zoomToastTimer = null;

  function clampScale(n) {
    n = Number(n);
    if (!isFinite(n)) n = 1;
    if (n < 1) n = 1;
    if (n > 2.2) n = 2.2;
    return Math.round(n * 100) / 100;
  }
  function distTouches(a, b) {
    var dx = a.clientX - b.clientX;
    var dy = a.clientY - b.clientY;
    return Math.sqrt(dx * dx + dy * dy) || 1;
  }
  function showZoomToast() {
    var el = document.getElementById("editZoomToast");
    if (!el) return;
    el.textContent = Math.round(__editScale * 100) + "%";
    el.classList.add("on");
    clearTimeout(__zoomToastTimer);
    __zoomToastTimer = setTimeout(function () {
      try { el.classList.remove("on"); } catch (e) {}
    }, 700);
  }
  function applyEditScale() {
    __editScale = clampScale(__editScale);
    var root = document.getElementById("editView");
    var body = document.getElementById("editSheetBody");
    var pct = document.getElementById("editZoomPct");
    if (root) {
      root.style.setProperty("--edit-fs", (16 * __editScale) + "px");
      root.style.setProperty("--edit-pad", (12 * __editScale) + "px");
    }
    if (body) {
      /* iOS Safari: element zoom scales layout + text (visible change) */
      try { body.style.zoom = String(__editScale); } catch (e1) {}
      /* Fallback if zoom ignored: transform */
      if (!("zoom" in body.style) || body.style.zoom === "" || body.style.zoom === "normal") {
        body.style.transform = "scale(" + __editScale + ")";
        body.style.transformOrigin = "top center";
        body.style.width = (100 / __editScale) + "%";
        body.style.marginInline = "auto";
      } else {
        body.style.transform = "";
        body.style.width = "";
        body.style.marginInline = "";
      }
    }
    if (pct) pct.textContent = Math.round(__editScale * 100) + "%";
    showZoomToast();
    try { localStorage.setItem("naqa_edit_scale", String(__editScale)); } catch (e) {}
  }
  function loadEditScale() {
    try {
      var s = parseFloat(localStorage.getItem("naqa_edit_scale") || "1");
      __editScale = clampScale(isFinite(s) && s >= 1 ? s : 1);
    } catch (e) { __editScale = 1; }
  }
  function onPinchStart(e) {
    if (!document.body.classList.contains("naqa-editing")) return;
    if (e.touches && e.touches.length === 2) {
      __pinch = {
        d0: distTouches(e.touches[0], e.touches[1]),
        s0: __editScale
      };
    }
  }
  function onPinchMove(e) {
    if (!__pinch || !e.touches || e.touches.length !== 2) return;
    if (!document.body.classList.contains("naqa-editing")) return;
    try { e.preventDefault(); } catch (err) {}
    var d = distTouches(e.touches[0], e.touches[1]);
    __editScale = clampScale(__pinch.s0 * (d / __pinch.d0));
    applyEditScale();
  }
  function onPinchEnd(e) {
    if (!e.touches || e.touches.length < 2) __pinch = null;
  }
  function bindDocPinch() {
    if (__pinchDocBound) return;
    __pinchDocBound = true;
    document.addEventListener("touchstart", onPinchStart, { passive: true, capture: true });
    /* passive:false so preventDefault works — required for custom pinch on iOS */
    document.addEventListener("touchmove", onPinchMove, { passive: false, capture: true });
    document.addEventListener("touchend", onPinchEnd, { passive: true, capture: true });
    document.addEventListener("touchcancel", onPinchEnd, { passive: true, capture: true });
  }
  function endEditMode() {
    try {
      document.body.classList.remove("naqa-editing");
      document.documentElement.classList.remove("naqa-editing");
    } catch (e) {}
    __pinch = null;
    var body = document.getElementById("editSheetBody");
    if (body) {
      body.style.zoom = "";
      body.style.transform = "";
      body.style.width = "";
    }
  }

  function startEditMode() {
    try {
      document.body.classList.add("naqa-editing");
      document.documentElement.classList.add("naqa-editing");
    } catch (e) {}
    bindDocPinch();
    loadEditScale();
    try {
      window.scrollTo(0, 0);
    } catch (e) {}
  }

  A.isEditing = function () {
    return A.editingId != null;
  };

  A.taxLabel = function (m) {
    m = m || {};
    var mode = m.taxMode || "vat5";
    if (mode === "exempt") return A.t("tax_exempt") || "معفى من الضريبة";
    if (mode === "custom") {
      var r = Number(m.taxCustom);
      if (!isFinite(r) || r < 0) r = 0;
      return (A.t("tax_custom") || "نسبة أخرى") + " " + r + "%";
    }
    return A.t("tax_vat5") || "ضريبة ٥٪";
  };


  /** Close product edit → list. fromPop=true when browser back/swipe. */
  A.closeEdit = function (fromPop) {
    var editView = document.getElementById("editView");
    var open = A.editingId != null || (editView && !editView.hidden);
    if (!open) return false;
    if (!fromPop && A._editNavPushed) {
      A._editNavPushed = false;
      try { history.back(); return true; } catch (e) {}
    }
    A._editNavPushed = false;
    A.paintList(A.productQuery || "");
    try { history.replaceState({ naqa: "tab", tab: "products" }, "", "#/products"); } catch (e) {}
    return true;
  };

  function fileToJpegBlob(file, max, quality) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * s));
        c.height = Math.max(1, Math.round(img.height * s));
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (blob) {
          if (!blob) reject(new Error("photo"));
          else resolve(blob);
        }, "image/jpeg", quality);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("photo"));
      };
      img.src = url;
    });
  }

  function blobToB64(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () {
        var s = String(r.result || "");
        var i = s.indexOf(",");
        resolve(i >= 0 ? s.slice(i + 1) : s);
      };
      r.onerror = function () { reject(new Error("photo")); };
      r.readAsDataURL(blob);
    });
  }

  function shrinkToB64(file) {
    var max = 1000;
    var quality = 0.72;
    function attempt() {
      return fileToJpegBlob(file, max, quality).then(function (blob) {
        return blobToB64(blob).then(function (b64) {
          if (b64.length < 680000) return { blob: blob, b64: b64 };
          if (max <= 480) {
            var e = new Error("too-big");
            e.code = "too-big";
            throw e;
          }
          max = Math.round(max * 0.78);
          quality = Math.max(0.5, quality - 0.08);
          return attempt();
        });
      });
    }
    return attempt();
  }

  function saveFsImage(b64) {
    if (!window.firebase || !firebase.firestore || !firebase.apps || !firebase.apps.length) {
      var e1 = new Error("no-firestore");
      e1.code = "no-firestore";
      return Promise.reject(e1);
    }
    var user = firebase.auth && firebase.auth().currentUser;
    if (!user) {
      var e2 = new Error("not-signed-in");
      e2.code = "not-signed-in";
      return Promise.reject(e2);
    }
    if (window.naqaIsAdminUid && !window.naqaIsAdminUid(user.uid)) {
      var e3 = new Error("not-admin");
      e3.code = "not-admin";
      return Promise.reject(e3);
    }
    var ref = firebase.firestore().collection("naqa_imgs").doc();
    var payload = {
      jpeg: b64,
      updatedBy: String(user.uid)
    };
    try {
      if (firebase.firestore.FieldValue && firebase.firestore.FieldValue.serverTimestamp) {
        payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      } else {
        payload.updatedAt = Date.now();
      }
    } catch (e) {
      payload.updatedAt = Date.now();
    }
    return ref.set(payload).then(function () { return "fs:" + ref.id; });
  }

  function imgUploadMsg(err) {
    var code = (err && (err.code || err.message)) || "";
    if (code === "not-signed-in" || code.indexOf("unauthenticated") >= 0) return A.t("p_imgsNeedLogin");
    if (code === "too-big") return A.t("p_imgsTooBig");
    if (code === "not-admin" || code.indexOf("permission-denied") >= 0 || code.indexOf("permission") >= 0) return A.t("p_imgsNeedRules");
    return A.t("p_imgsFail");
  }

  function showImgSrc(src) {
    if (A._fsPreview && A._fsPreview[src]) return A._fsPreview[src];
    return src;
  }

  function showStoredImg(img, src) {
    if (!img || !src) return;
    if (A._fsPreview && A._fsPreview[src]) {
      img.src = A._fsPreview[src];
      return;
    }
    if (src.indexOf("fs:") !== 0) return;
    if (!window.firebase || !firebase.firestore || !firebase.apps || !firebase.apps.length) return;
    firebase.firestore().collection("naqa_imgs").doc(src.slice(3)).get().then(function (snap) {
      var j = snap.exists && snap.data() && snap.data().jpeg;
      if (!j) return;
      A._fsPreview = A._fsPreview || {};
      A._fsPreview[src] = "data:image/jpeg;base64," + j;
      img.src = A._fsPreview[src];
    }).catch(function () {});
  }

  function fillStoredImgs(root) {
    if (!root) return;
    Array.prototype.forEach.call(root.querySelectorAll("img"), function (img) {
      var src = img.getAttribute("data-src") || img.getAttribute("src") || "";
      if (src.indexOf("fs:") === 0) showStoredImg(img, src);
    });
  }

  function normImgs(list) {
    return (list || []).map(function (s) { return String(s || "").trim(); }).filter(Boolean).slice(0, MAX_IMGS);
  }

  A.paintImgGallery = function () {
    var box = document.getElementById("imgGal");
    if (!box) return;
    var imgs = A._editImgs = normImgs(A._editImgs);
    if (!imgs.length) {
      box.innerHTML =
        '<div class="img-gal-add" id="imgGalEmpty" role="button" tabindex="0">'
        + '<span style="font-size:1.4rem">＋</span>'
        + '<span>' + A.t("p_imgsAdd") + '</span>'
        + '</div>';
      var empty = document.getElementById("imgGalEmpty");
      if (empty) empty.onclick = function () {
        var f = document.getElementById("f_imgFile");
        if (f) f.click();
      };
      return;
    }
    var html = imgs.map(function (src, i) {
      var main = i === 0
        ? '<span class="main-tag">' + A.t("p_imgsMain") + '</span>'
        : "";
      return '<div class="img-gal-item' + (i === 0 ? " is-main" : "") + '" data-i="' + i + '">'
        + main
        + '<img src="' + A.esc(showImgSrc(src)) + '" data-src="' + A.esc(src) + '" alt="" loading="lazy">'
        + '<div class="img-gal-actions">'
        /* نجمة = رئيسية فقط · حذف — بدون تحريك يمين/يسار */
        + (i === 0
          ? '<button type="button" class="img-fav is-main" disabled title="' + A.esc(A.t("p_imgsMain") || (A.lang === "en" ? "Main photo" : "الصورة الرئيسية")) + '" aria-label="' + A.esc(A.t("p_imgsMain") || "رئيسية") + '">★</button>'
          : '<button type="button" class="img-fav" data-img-main="' + i + '" title="' + A.esc(A.t("p_imgsSetMain") || (A.lang === "en" ? "Set as main" : "اجعلها الرئيسية")) + '" aria-label="' + A.esc(A.t("p_imgsSetMain") || "رئيسية") + '">☆</button>')
        + '<button type="button" class="img-del" data-img-del="' + i + '" title="' + A.esc(A.t("p_imgsDel") || (A.lang === "en" ? "Delete" : "حذف")) + '" aria-label="' + A.esc(A.t("p_imgsDel") || "حذف") + '">✕</button>'
        + '</div></div>';
    }).join("");
    if (imgs.length < MAX_IMGS) {
      html += '<div class="img-gal-add" id="imgGalAddMore" role="button" tabindex="0">'
        + '<span style="font-size:1.2rem">＋</span>'
        + '<span>' + A.t("p_imgsAddBtn") + '</span></div>';
    }
    box.innerHTML = html;
    var more = document.getElementById("imgGalAddMore");
    if (more) more.onclick = function () {
      var f = document.getElementById("f_imgFile");
      if (f) f.click();
    };
    fillStoredImgs(box);
  };
  function bindImgTools() {
    var gal = document.getElementById("imgGal");
    if (gal && !gal._bound) {
      gal._bound = true;
      gal.addEventListener("click", function (e) {
        var main = e.target.closest("[data-img-main]");
        var del = e.target.closest("[data-img-del]");
        if (main) {
          var i = +main.getAttribute("data-img-main");
          if (isNaN(i) || i <= 0 || i >= (A._editImgs || []).length) return;
          var t = A._editImgs.splice(i, 1)[0];
          A._editImgs.unshift(t);
          A.paintImgGallery();
          return;
        }
        if (del) {
          e.preventDefault();
          e.stopPropagation();
          var ix = +del.getAttribute("data-img-del");
          if (isNaN(ix) || ix < 0 || ix >= (A._editImgs || []).length) return;
          var gone = A._editImgs[ix];
          A._editRemoved = A._editRemoved || {};
          if (gone) {
            var gKey = A.normImgPath ? A.normImgPath(gone) : gone;
            A._editRemoved[gKey] = 1;
            A._editRemoved[gone] = 1;
          }
          A._editImgs.splice(ix, 1);
          A.paintImgGallery();
          return;
        }
      });
    }
    var pick = document.getElementById("btnImgPick");
    if (pick) pick.onclick = function () {
      var f = document.getElementById("f_imgFile");
      if (f) f.click();
    };
    var file = document.getElementById("f_imgFile");
    if (file && !file._bound) {
      file._bound = true;
      file.addEventListener("change", function () {
        var files = Array.prototype.slice.call(file.files || []);
        file.value = "";
        if (!files.length) return;
        var left = MAX_IMGS - (A._editImgs || []).length;
        if (left <= 0) {
          A.setMsg("status", A.t("p_imgsMax"));
          return;
        }
        files = files.slice(0, left);
        A.setMsg("status", A.t("p_imgsPrep"));
        var chain = Promise.resolve();
        var added = [];
        files.forEach(function (one) {
          chain = chain.then(function () {
            return shrinkToB64(one).then(function (packed) { return saveFsImage(packed.b64).then(function (url) { A._fsPreview = A._fsPreview || {}; A._fsPreview[url] = URL.createObjectURL(packed.blob); return url; }); }).then(function (url) {
              added.push(url);
              A._editImgs = normImgs((A._editImgs || []).concat([url]));
              A.paintImgGallery();
            });
          });
        });
        chain.then(function () {
          A.setMsg("status", added.length ? A.t("p_imgsAdded") : A.t("p_imgsFail"));
        }).catch(function (err) {
          A.setMsg("status", imgUploadMsg(err));
        });
      });
    }
    var addUrl = document.getElementById("btnImgUrl");
    if (addUrl) addUrl.onclick = function () {
      var inp = document.getElementById("f_imgUrl");
      var u = inp ? inp.value.trim() : "";
      if (!u) return;
      if (!/^https:\/\//i.test(u)) {
        A.setMsg("status", A.t("p_imgsUrlBad"));
        return;
      }
      if ((A._editImgs || []).length >= MAX_IMGS) {
        A.setMsg("status", A.t("p_imgsMax"));
        return;
      }
      A._editImgs = normImgs((A._editImgs || []).concat([u]));
      if (inp) inp.value = "";
      A.paintImgGallery();
    };
  }

  /* ---- products tools: search / sort / export / bulk / custom inject ---- */
  A.productQuery = A.productQuery || "";
  A.productSort = A.productSort || "name";
  A.productSel = A.productSel || {};

  A.injectCustomProducts = function () {
    var map = A.overrides || {};
    Object.keys(map).forEach(function (id) {
      var o = map[id];
      if (!o || !o._new) return;
      var exists = (A.products || []).some(function (x) { return String(x.id) === String(id); });
      if (exists) return;
      A.products.unshift({
        id: id,
        brand: o.brand || "",
        cat: o.cat || ((A.CATS && A.CATS[0]) || "عناية"),
        sku: o.sku || "",
        price: o.price != null ? Number(o.price) : 0,
        was: o.was != null ? Number(o.was) : undefined,
        stock: o.stock != null ? Number(o.stock) : 3,
        imgs: Array.isArray(o.imgs) ? o.imgs.slice(0, 6) : [],
        nameAr: o.nameAr || "",
        nameEn: o.nameEn || "",
        descAr: o.descAr || "",
        descEn: o.descEn || "",
        useAr: o.useAr || "",
        useEn: o.useEn || "",
        skinAr: o.skinAr || "",
        skinEn: o.skinEn || "",
        hot: !!o.hot,
        hidden: !!o.hidden,
        _new: true
      });
    });
  };

  A.skuTaken = function (sku, exceptId) {
    sku = String(sku || "").trim().toLowerCase();
    if (!sku) return false;
    return (A.products || []).some(function (p) {
      if (String(p.id) === String(exceptId)) return false;
      var m = A.merged(p);
      return String(m.sku || "").trim().toLowerCase() === sku;
    });
  };

  A.persistOverridePatch = function (id, patch) {
    if (A.requireAuth && !A.requireAuth("status")) return false;
    var key = String(id);
    var existing = A.overrides[id] || A.overrides[key] || {};
    var next = Object.assign({}, existing, patch || {});
    Object.keys(next).forEach(function (k) {
      if (next[k] === "" || next[k] === undefined) delete next[k];
    });
    /* explicit false/clear for hidden/hot */
    if (patch && Object.prototype.hasOwnProperty.call(patch, "hidden") && !patch.hidden) delete next.hidden;
    if (patch && Object.prototype.hasOwnProperty.call(patch, "hot") && !patch.hot) delete next.hot;
    if (Object.keys(next).length) {
      A.overrides[key] = next;
      if (A.overrides[id] && String(id) !== key) delete A.overrides[id];
    } else {
      delete A.overrides[key];
      delete A.overrides[id];
    }
    try { localStorage.setItem(A.KEY || "naqa_overrides", JSON.stringify(A.overrides)); } catch (e) {
      A.setMsg("status", A.t("p_imgsFull"));
      return false;
    }
    if (A.syncOverridesCloud) A.syncOverridesCloud();
    else if (A.publishLive) A.publishLive();
    return true;
  };


  /* Excel menu: open → Export / Import */
  if (typeof document !== "undefined" && !window.__naqaExcelMenuBound) {
    window.__naqaExcelMenuBound = true;
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var menuBtn = t.closest("#excelMenuBtn");
      var menu = document.getElementById("excelMenu");
      var wrap = document.getElementById("excelWrap");
      if (menuBtn) {
        e.preventDefault();
        e.stopPropagation();
        if (!menu) return;
        var open = menu.hidden;
        menu.hidden = !open;
        menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
        return;
      }
      if (t.closest("#excelExportBtn")) {
        e.preventDefault();
        e.stopPropagation();
        if (menu) menu.hidden = true;
        if ((A.currentTab || "") === "reviews" && A.exportReviewsCsv) A.exportReviewsCsv();
        else if (A.exportProductsCsv) A.exportProductsCsv();
        return;
      }
      if (t.closest("#excelImportBtn")) {
        e.preventDefault();
        e.stopPropagation();
        if ((A.currentTab || "") === "reviews") return;
        if (menu) menu.hidden = true;
        var file = document.getElementById("excelImportFile");
        if (file) file.click();
        return;
      }
      /* click outside closes menu */
      if (menu && !menu.hidden && wrap && !wrap.contains(t)) {
        menu.hidden = true;
        var b = document.getElementById("excelMenuBtn");
        if (b) b.setAttribute("aria-expanded", "false");
      }
    }, true);
    document.addEventListener("change", function (e) {
      var fileEl = e.target;
      if (!fileEl || fileEl.id !== "excelImportFile") return;
      var f = fileEl.files && fileEl.files[0];
      fileEl.value = "";
      if (f && A.importProductsFile) A.importProductsFile(f);
    });
  }

  A.exportProductsCsv = function () {
    if (A.requireAuth && !A.requireAuth("status")) return;
    var ar = A.lang !== "en";
    var head = ar
      ? ["المعرف", "SKU", "الاسم عربي", "الاسم EN", "الماركة", "التصنيف", "السعر", "قبل الخصم", "المخزون", "مخفي"]
      : ["id", "SKU", "nameAr", "nameEn", "brand", "cat", "price", "was", "stock", "hidden"];
    var rows = [head];
    var selectedIds = Object.keys(A.productSel || {}).filter(function (id) { return A.productSel[id]; });
    var onlySelected = selectedIds.length > 0;
    var selSet = null;
    if (onlySelected) {
      selSet = Object.create(null);
      selectedIds.forEach(function (id) { selSet[String(id)] = true; });
    }
    (A.products || []).forEach(function (p) {
      if (onlySelected && !selSet[String(p.id)]) return;
      var m = A.merged(p);
      rows.push([
        p.id,
        m.sku || "",
        m.nameAr || "",
        m.nameEn || "",
        m.brand || "",
        m.cat || "",
        m.price != null ? m.price : "",
        m.was != null ? m.was : "",
        m.stock != null ? m.stock : "",
        m.hidden ? (ar ? "نعم" : "yes") : (ar ? "لا" : "no")
      ]);
    });
    var nExport = rows.length - 1;
    /* real .xlsx spreadsheet when available; CSV fallback only */
    if (A.downloadXlsx) {
      A.downloadXlsx("naqa-products.xlsx", rows, ar ? "المنتجات" : "Products");
    } else if (A.downloadCsv) {
      A.downloadCsv("naqa-products.csv", rows);
    }
    var msg = A.t("exportOk") || (ar ? "تم التصدير · Excel" : "Exported · Excel");
    if (onlySelected) {
      msg = ar
        ? ("تم تصدير " + nExport + " منتج محدد · Excel")
        : ("Exported " + nExport + " selected · Excel");
    } else {
      msg = ar
        ? ("تم تصدير " + nExport + " منتج · Excel")
        : ("Exported " + nExport + " products · Excel");
    }
    A.setMsg("status", msg);
  };


  A.importProductsFile = function (file) {
    if (A.requireAuth && !A.requireAuth("status")) return;
    if (!file) return;
    var ar = A.lang !== "en";
    var name = String(file.name || "").toLowerCase();
    if (/\.xlsx?$/.test(name) && !/\.csv$/.test(name)) {
      A.setMsg("status", ar
        ? "الاستيراد يدعم CSV. من Excel: ملف → حفظ باسم → CSV، ثم استوردي الملف."
        : "Import supports CSV. In Excel: File → Save As → CSV, then import.");
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var text = String(reader.result || "");
        var table = A.parseCsv ? A.parseCsv(text) : null;
        if (!table || !table.length) {
          A.setMsg("status", A.t("importFail") || (ar ? "ملف الاستيراد غير صالح" : "Import file is invalid"));
          return;
        }
        var head = (table[0] || []).map(function (h) { return String(h || "").trim().toLowerCase(); });
        function col() {
          var aliases = Array.prototype.slice.call(arguments);
          for (var i = 0; i < aliases.length; i++) {
            var a = String(aliases[i]).toLowerCase();
            var ix = head.indexOf(a);
            if (ix >= 0) return ix;
          }
          return -1;
        }
        var iId = col("id", "المعرف");
        var iSku = col("sku");
        var iPrice = col("price", "السعر");
        var iWas = col("was", "قبل الخصم");
        var iStock = col("stock", "المخزون");
        var iHidden = col("hidden", "مخفي");
        if (iId < 0 && iSku < 0) {
          A.setMsg("status", ar ? "الملف يحتاج عمود المعرف أو SKU." : "File needs id or SKU column.");
          return;
        }
        var byId = Object.create(null);
        var bySku = Object.create(null);
        (A.products || []).forEach(function (p) {
          byId[String(p.id)] = p;
          if (p.sku) bySku[String(p.sku).toLowerCase()] = p;
        });
        var n = 0;
        for (var r = 1; r < table.length; r++) {
          var row = table[r] || [];
          if (!row.length) continue;
          var p = null;
          if (iId >= 0 && row[iId] != null && String(row[iId]).trim() !== "") {
            p = byId[String(row[iId]).trim()];
          }
          if (!p && iSku >= 0 && row[iSku] != null && String(row[iSku]).trim() !== "") {
            p = bySku[String(row[iSku]).trim().toLowerCase()];
          }
          if (!p) continue;
          var id = String(p.id);
          var existing = A.overrides[id] || A.overrides[p.id] || {};
          var next = Object.assign({}, existing);
          var changed = false;
          if (iPrice >= 0 && row[iPrice] != null && String(row[iPrice]).trim() !== "") {
            var pr = Number(String(row[iPrice]).replace(",", "."));
            if (isFinite(pr) && pr >= 0) { next.price = pr; changed = true; }
          }
          if (iWas >= 0 && row[iWas] != null && String(row[iWas]).trim() !== "") {
            var w = Number(String(row[iWas]).replace(",", "."));
            if (isFinite(w) && w >= 0) { next.was = w; changed = true; }
          }
          if (iStock >= 0 && row[iStock] != null && String(row[iStock]).trim() !== "") {
            var st = Number(String(row[iStock]).replace(",", "."));
            if (isFinite(st) && st >= 0) { next.stock = Math.floor(st); changed = true; }
          }
          if (iHidden >= 0 && row[iHidden] != null && String(row[iHidden]).trim() !== "") {
            var hv = String(row[iHidden]).trim().toLowerCase();
            var isHid = (hv === "1" || hv === "true" || hv === "yes" || hv === "نعم" || hv === "y");
            var isShow = (hv === "0" || hv === "false" || hv === "no" || hv === "لا" || hv === "n");
            if (isHid) { next.hidden = true; changed = true; }
            else if (isShow) { delete next.hidden; changed = true; }
          }
          if (changed) {
            if (Object.keys(next).length) A.overrides[id] = next;
            else { delete A.overrides[id]; delete A.overrides[p.id]; }
            n += 1;
          }
        }
        try { localStorage.setItem(A.KEY || "naqa_overrides", JSON.stringify(A.overrides)); } catch (e1) {}
        if (A.syncOverridesCloud) A.syncOverridesCloud();
        if (A.paintList) A.paintList(A.productQuery || "");
        if (A.refreshChildNav) A.refreshChildNav();
        A.setMsg("status", n
          ? ((A.t("importOk") || (ar ? "تم الاستيراد" : "Imported")) + " · " + n)
          : (ar ? "ما تغيّر شيء من الملف." : "Nothing changed from the file."));
      } catch (err) {
        A.setMsg("status", A.t("importFail") || (ar ? "ملف الاستيراد غير صالح" : "Import file is invalid"));
      }
    };
    reader.onerror = function () {
      A.setMsg("status", A.t("importFail") || (ar ? "ملف الاستيراد غير صالح" : "Import file is invalid"));
    };
    reader.readAsText(file);
  };

  A.bulkSetHidden = function (hide) {
    if (A.requireAuth && !A.requireAuth("status")) return;
    var ids = Object.keys(A.productSel || {}).filter(function (id) { return A.productSel[id]; });
    if (!ids.length) {
      A.setMsg("status", A.t("p_bulkNone") || (A.lang === "en" ? "Select products first." : "حددي منتجات أولاً."));
      return;
    }
    ids.forEach(function (id) {
      var existing = A.overrides[id] || A.overrides[String(id)] || {};
      var next = Object.assign({}, existing);
      if (hide) next.hidden = true;
      else delete next.hidden;
      if (Object.keys(next).length) A.overrides[String(id)] = next;
      else { delete A.overrides[String(id)]; delete A.overrides[id]; }
    });
    try { localStorage.setItem(A.KEY || "naqa_overrides", JSON.stringify(A.overrides)); } catch (e) {}
    A.productSel = {};
    if (A.paintList) A.paintList(A.productQuery || "");
    if (A.syncOverridesCloud) A.syncOverridesCloud();
    A.setMsg("status", hide
      ? (A.lang === "en" ? "Hidden selected on the store." : "انخفت المنتجات المحددة.")
      : (A.lang === "en" ? "Shown selected on the store." : "ظهرت المنتجات المحددة."));
  };

  A.bulkDiscountPct = function () {
    if (A.requireAuth && !A.requireAuth("status")) return;
    var ids = Object.keys(A.productSel || {}).filter(function (id) { return A.productSel[id]; });
    if (!ids.length) {
      A.setMsg("status", A.t("p_bulkNone") || (A.lang === "en" ? "Select products first." : "حددي منتجات أولاً."));
      return;
    }
    var raw = window.prompt(A.t("p_bulkDiscAsk") || (A.lang === "en" ? "Discount % (e.g. 10):" : "نسبة الخصم % (مثال 10):"), "10");
    if (raw == null) return;
    var pct = Number(String(raw).replace(",", ".").replace("%", "").trim());
    if (!isFinite(pct) || pct <= 0 || pct >= 100) {
      A.setMsg("status", A.t("p_bulkDiscBad") || (A.lang === "en" ? "Invalid %." : "نسبة غير صالحة."));
      return;
    }
    ids.forEach(function (id) {
      var p = (A.products || []).find(function (x) { return String(x.id) === String(id); });
      if (!p) return;
      var m = A.merged(p);
      var base = Number(m.was != null && m.was > 0 ? m.was : m.price);
      if (!isFinite(base) || base <= 0) return;
      var price = Math.round(base * (1 - pct / 100) * 1000) / 1000;
      var existing = A.overrides[id] || A.overrides[String(id)] || {};
      var next = Object.assign({}, existing, { was: base, price: price });
      A.overrides[String(id)] = next;
    });
    try { localStorage.setItem(A.KEY || "naqa_overrides", JSON.stringify(A.overrides)); } catch (e) {}
    A.productSel = {};
    if (A.paintList) A.paintList(A.productQuery || "");
    if (A.syncOverridesCloud) A.syncOverridesCloud();
    A.setMsg("status", A.lang === "en" ? ("Applied −" + pct + "%") : ("تم تطبيق −" + pct + "٪"));
  };

  A.toggleHot = function (id) {
    if (A.requireAuth && !A.requireAuth("status")) return;
    var p = (A.products || []).find(function (x) { return String(x.id) === String(id); });
    if (!p) return;
    var m = A.merged(p);
    var nextHot = !m.hot;
    if (!A.persistOverridePatch(id, { hot: nextHot })) return;
    /* keep live object in sync for admin list */
    p.hot = nextHot;
    if (A.paintList) A.paintList(A.productQuery || "");
    A.setMsg("status", nextHot
      ? (A.lang === "en" ? "Marked as featured." : "صار مميّز (الأكثر مبيعاً).")
      : (A.lang === "en" ? "Featured removed." : "أُلغي الوسم المميّز."));
  };

  A.quickSaveField = function (id, field, raw) {
    if (A.requireAuth && !A.requireAuth("status")) return;
    var val = String(raw == null ? "" : raw).trim().replace(",", ".");
    var num = val === "" ? undefined : Number(val);
    if (num != null && (isNaN(num) || num < 0)) {
      A.setMsg("status", field === "stock" ? A.t("p_stockBad") : A.t("p_priceBad"));
      return;
    }
    var patch = {};
    patch[field] = num;
    if (!A.persistOverridePatch(id, patch)) return;
    /* soft UI update — keep focus, no full repaint */
    try {
      var card = document.querySelector('#list .prod-card[data-pid="' + String(id).replace(/"/g, "") + '"]');
      if (card && field === "stock") {
        var labs = card.querySelectorAll("label.qk");
        for (var i = 0; i < labs.length; i++) {
          if (labs[i].querySelector("[data-qk-stock]")) {
            labs[i].classList.remove("is-low", "is-out");
            if (num != null && num <= 0) labs[i].classList.add("is-out");
            else if (num != null && num <= 2) labs[i].classList.add("is-low");
          }
        }
      }
      if (card && field === "price") {
        var wasEl = card.querySelector(".prod-was s, .prod-was");
        var priceN = Number(num);
        var wasN = wasEl ? Number(String(wasEl.textContent || "").replace(/[^0-9.]/g, "")) : NaN;
        var tag = card.querySelector(".prod-off-tag");
        if (wasEl && isFinite(wasN) && wasN > priceN && priceN >= 0) {
          var off = Math.round((1 - priceN / wasN) * 100);
          if (tag) tag.textContent = "−" + off + "%";
          else {
            var title = card.querySelector(".prod-title");
            if (title) {
              var sp = document.createElement("span");
              sp.className = "prod-off-tag";
              sp.textContent = "−" + off + "%";
              title.appendChild(document.createTextNode(" "));
              title.appendChild(sp);
            }
          }
        } else if (tag) tag.remove();
      }
    } catch (eSoft) {}
    A.setMsg("status", A.t("p_saved") || (A.lang === "en" ? "Saved." : "انحفظ."));
    try { if (A.updateOrdersBadge) A.updateOrdersBadge(); } catch (eB) {}
  };

  A.openNewProduct = function () {
    if (A.requireAuth && !A.requireAuth("status")) return;
    var id = "n" + Date.now();
    var base = {
      id: id,
      brand: "",
      cat: (A.CATS && A.CATS[0]) || "عناية",
      sku: "",
      price: 0,
      stock: 3,
      imgs: [],
      nameAr: "",
      nameEn: "",
      _new: true
    };
    A.products = A.products || [];
    A.products.unshift(base);
    A.overrides[String(id)] = Object.assign({}, A.overrides[String(id)] || {}, { _new: true, stock: 3, price: 0 });
    try { localStorage.setItem(A.KEY || "naqa_overrides", JSON.stringify(A.overrides)); } catch (e) {}
    A.openEdit(id);
  };

  A.paintList = function (q) {
    A.editingId = null;
    A._editImgs = [];
    A._editNavPushed = false;
    var listView = document.getElementById("listView");
    var editView = document.getElementById("editView");
    if (!listView || !editView) return;
    listView.hidden = false;
    editView.hidden = true;
    editView.innerHTML = "";
    endEditMode();
    if (!A.products || !A.products.length) {
      try { if (A.refreshProductsFromBundle) A.refreshProductsFromBundle(); } catch (e) {}
    }
    try { A.injectCustomProducts(); } catch (e2) {}

    if (q == null || q === undefined) q = A.productQuery || "";
    else A.productQuery = String(q);
    q = String(A.productQuery || "").trim().toLowerCase();

    var view = A.productView || "all";
    var inv = "";
    var matched = (A.products || []).filter(function (p) {
      var m = A.merged(p);
      if (view === "hidden" && !m.hidden) return false;
      if (view === "shown" && m.hidden) return false;
      if (view === "stock") {
        if (m.stock === "" || m.stock == null) return false;
        var sn = Number(m.stock);
        if (!(sn >= 0 && sn <= 2)) return false;
      }
      if (!q) return true;
      var blob = [m.nameAr, m.nameEn, m.brand, m.sku, m.cat, p.id].join(" ").toLowerCase();
      return blob.indexOf(q) >= 0;
    });

    /* sort */
    var sort = A.productSort || "name";
    matched.sort(function (a, b) {
      var ma = A.merged(a), mb = A.merged(b);
      if (sort === "priceAsc") return (Number(ma.price) || 0) - (Number(mb.price) || 0);
      if (sort === "priceDesc") return (Number(mb.price) || 0) - (Number(ma.price) || 0);
      if (sort === "stockAsc") {
        var sa = ma.stock == null || ma.stock === "" ? 9999 : Number(ma.stock);
        var sb = mb.stock == null || mb.stock === "" ? 9999 : Number(mb.stock);
        return sa - sb;
      }
      if (sort === "stockDesc") {
        var sa2 = ma.stock == null || ma.stock === "" ? -1 : Number(ma.stock);
        var sb2 = mb.stock == null || mb.stock === "" ? -1 : Number(mb.stock);
        return sb2 - sa2;
      }
      if (sort === "hidden") return (mb.hidden ? 1 : 0) - (ma.hidden ? 1 : 0);
      if (sort === "hot") return (mb.hot ? 1 : 0) - (ma.hot ? 1 : 0);
      var na = String((A.lang === "en" ? (ma.nameEn || ma.nameAr) : (ma.nameAr || ma.nameEn)) || "").toLowerCase();
      var nb = String((A.lang === "en" ? (mb.nameEn || mb.nameAr) : (mb.nameAr || mb.nameEn)) || "").toLowerCase();
      return na.localeCompare(nb, A.lang === "en" ? "en" : "ar");
    });

    var selCount = Object.keys(A.productSel || {}).filter(function (id) { return A.productSel[id]; }).length;

    /* selection bar for Excel export — no hide/show bulk */
    var allMatchedIds = matched.map(function (p) { return String(p.id); });
    var allMatchedOn = matched.length > 0 && allMatchedIds.every(function (id) { return !!(A.productSel && A.productSel[id]); });
    var tools =
      '<div class="prod-tools" id="prodTools">'
      + '<div class="prod-bulk on prod-sel-bar" id="prodBulk">'
      +   '<label class="prod-check-all"><input type="checkbox" id="prodCheckAll"' + (allMatchedOn ? " checked" : "") + '> '
      +     A.esc(A.t("p_selectAll") || (A.lang === "en" ? "Select all" : "تحديد الكل"))
      +   '</label>'
      +   (selCount ? ('<span class="prod-sel-n" title="' + A.esc(A.lang === "en" ? "Selected" : "محدد") + '">' + selCount + '</span>') : '<span class="prod-sel-n is-zero">0</span>')
      +   (selCount ? ('<button type="button" class="mini prod-sel-clear" id="prodBulkClear">' + A.esc(A.t("clearSelected") || (A.lang === "en" ? "Clear" : "إلغاء التحديد")) + '</button>') : '')
      + '</div>'
      + '</div>';

    var per = 50;
    var pages = Math.max(1, Math.ceil(matched.length / per));
    var page = A.productPage || 1;
    if (page > pages) page = pages;
    if (page < 1) page = 1;
    A.productPage = page;
    var slice = matched.slice((page - 1) * per, page * per);

    var html = slice.map(function (p) {
      var m = A.merged(p);
      var img = (m.imgs && m.imgs[0]) || "";
      var thumb = img ? '<img src="' + A.esc(img.indexOf("fs:") === 0 ? "" : img) + '" data-src="' + A.esc(img) + '" alt="">' : '<div class="ph"></div>';
      var stock = m.stock === "" || m.stock == null ? "" : m.stock;
      var stockN = Number(m.stock);
      var stockCls = (m.stock !== "" && m.stock != null && stockN <= 0) ? " is-out" : (m.stock != null && m.stock !== "" && stockN <= 2 ? " is-low" : "");
      var title = String((A.lang === "en" ? (m.nameEn || m.nameAr) : (m.nameAr || m.nameEn)) || "").replace(/\s+/g, " ").trim();
      var taxTxt = A.taxLabel ? A.taxLabel(m) : (A.t("tax_vat5") || "");
      var wasN = Number(m.was);
      var priceN = Number(m.price);
      var off = (m.was != null && wasN > priceN && priceN >= 0) ? Math.round((1 - priceN / wasN) * 100) : 0;
      var checked = !!(A.productSel && A.productSel[String(p.id)]);
      return '<article class="prod-card row' + (m.hidden ? " is-hidden" : "") + '" data-pid="' + p.id + '">'
        + '<label class="prod-pick"><input type="checkbox" data-pick="' + p.id + '"' + (checked ? " checked" : "") + ' aria-label="select"></label>'
        + '<div class="prod-thumb">' + thumb + '</div>'
        + '<div class="prod-body">'
        +   '<div class="prod-title">' + A.esc(title || (A.lang === "en" ? "(untitled)" : "(بدون اسم)")) + (off ? ' <span class="prod-off-tag">−' + off + '%</span>' : '') + '</div>'
        +   '<div class="prod-meta">'
        +     (m.brand ? '<span>' + A.esc(m.brand) + '</span>' : '')
        +     (m.cat ? '<span>' + A.esc(m.cat) + '</span>' : '')
        +     '<span>SKU ' + A.esc(m.sku || "—") + '</span>'
        +     (m.hidden ? '<span class="prod-hid">' + A.esc(A.t("p_hidden") || "مخفي") + '</span>' : '')
        +   '</div>'
        +   '<div class="prod-price-row prod-readonly">'
        +     '<span class="pr-line pr-price">'
        +       '<span class="pr-lab">' + A.esc(A.t("p_price") || (A.lang === "en" ? "Price" : "السعر")) + '</span>'
        +       '<span class="pr-colon">:</span>'
        +       '<b class="pr-val">' + A.esc(m.price != null ? m.price : "—") + '</b>'
        +       '<small class="pr-cur">' + A.esc(A.t("omr") || "ر.ع") + '</small>'
        +     '</span>'
        +     (m.was != null && wasN > 0 ? ('<span class="prod-was"><s>' + A.esc(m.was) + '</s></span>') : '')
        +     '<span class="pr-line pr-qty' + stockCls + '">'
        +       '<span class="pr-lab">' + A.esc(A.t("p_qty") || (A.lang === "en" ? "Qty" : "الكمية")) + '</span>'
        +       '<span class="pr-colon">:</span>'
        +       '<b class="pr-val">' + A.esc(stock === "" ? "—" : stock) + '</b>'
        +     '</span>'
        +   '</div>'
        + '</div>'
        + '<div class="prod-actions">'
        +   '<button type="button" class="edit-btn" data-open="' + p.id + '">' + A.esc(A.t("p_editProduct") || (A.lang === "en" ? "Edit product" : "تعديل المنتج")) + '</button>'
        + '</div>'
        + '</article>';
    }).join("");

    var pager = "";
    if (matched.length) {
      pager = '<div class="pager naqa-pager" id="prodPager" role="navigation" aria-label="pages">'
        + '<button type="button" class="pager-btn" data-page="' + (page - 1) + '"' + (page <= 1 ? " disabled" : "") + ">"
        +   A.esc(A.t("pagePrev") || (A.lang === "en" ? "Previous" : "السابق"))
        + '</button>'
        + '<span class="pager-meta"><b>' + page + '</b><span class="pager-sep">/</span>' + pages
        +   '<span class="pager-dot">·</span><span class="pager-total">' + matched.length + '</span></span>'
        + '<button type="button" class="pager-btn" data-page="' + (page + 1) + '"' + (page >= pages ? " disabled" : "") + ">"
        +   A.esc(A.t("pageNext") || (A.lang === "en" ? "Next" : "التالي"))
        + '</button>'
        + "</div>";
    }
    var listEl = document.getElementById("list");
    if (!listEl) return;
    listEl.innerHTML = tools + inv + ((view === "stock" ? (html || '<p class="note">' + A.t("p_stockEmpty") + '</p>') : (html || '<p class="note">' + A.t("p_empty") + '</p>'))) + pager;
    fillStoredImgs(listEl);
    if (A.bindProductListClicks) A.bindProductListClicks();
    if (A.bindProductTools) A.bindProductTools();
    try { if (A.updateOrdersBadge) A.updateOrdersBadge(); } catch (eBadge) {}
  };

  A.openEdit = function (id, opts) {
    if (A.requireAuth && !A.requireAuth("status")) return;

    opts = opts || {};
    var p = A.products.find(function (x) { return x.id == id; });
    if (!p) return;
    A.editingId = p.id;
    var m = A.merged(p);
    document.getElementById("listView").hidden = true;
    var editView = document.getElementById("editView");
    editView.hidden = false;
    startEditMode();
    if (!opts.fromPop) {
      try {
        history.pushState({ naqa: "edit", id: p.id }, "", "#/products/edit/" + p.id);
        A._editNavPushed = true;
      } catch (e) { A._editNavPushed = false; }
    } else {
      A._editNavPushed = true;
    }

    A._editBaseImgs = Array.isArray(p.imgs) ? p.imgs.filter(Boolean).slice() : [];
    A._editRemoved = {};
    var oPrev = A.overrides[p.id] || A.overrides[String(p.id)] || {};
    (oPrev.removedImgs || []).forEach(function (u) {
      A._editRemoved[A.normImgPath ? A.normImgPath(u) : u] = 1;
    });
    /* Gallery = what user currently has. Wipe-repair only if old bad data. */
    A._editImgs = normImgs(m.imgs || A._editBaseImgs || []);

    var catOpts = A.CATS.map(function (c) {
      return '<option value="' + A.esc(c) + '"' + (m.cat === c ? " selected" : "") + ">" + A.esc(c) + "</option>";
    }).join("");
    var title = m.nameAr || m.nameEn || A.t("p_edit");

    editView.innerHTML =
      '<div class="edit-sheet-head">'
      + '<button type="button" class="back" id="backList">' + A.t("p_back") + '</button>'
      + '<h2>' + A.esc(title) + '</h2>'
      + '<span class="edit-zoom-pct" id="editZoomPct" title="' + (A.lang === "en" ? "Pinch with two fingers" : "قرّصي بإصبعين للتكبير") + '">100%</span>'
      + '</div>'
      + '<div class="edit-zoom-toast" id="editZoomToast" aria-live="polite">100%</div>'
      + '<div class="edit-sheet-body" id="editSheetBody">'
      + '<div class="edit-card">'
      + '<span class="img-gal-label">' + A.t("p_imgs") + '</span>'
      + '<p class="img-gal-note">' + A.t("p_imgsNote") + '</p>'
      + '<div class="img-gal-tools">'
      + '<button type="button" class="mini" id="btnImgPick">' + A.t("p_imgsUpload") + '</button>'
      + '<input id="f_imgFile" type="file" accept="image/*" multiple>'
      + '</div>'
      + '<div class="img-gal-url-row">'
      + '<input id="f_imgUrl" type="url" inputmode="url" placeholder="' + A.t("p_imgsUrlPh") + '">'
      + '<button type="button" class="mini" id="btnImgUrl">' + A.t("p_imgsAddBtn") + '</button>'
      + '</div>'
      + '<div class="img-gal" id="imgGal"></div>'
      + '<label>' + A.t("p_nameAr") + '<textarea id="f_nameAr" rows="2">' + A.esc(m.nameAr || "") + '</textarea></label>'
      + '<label>' + A.t("p_nameEn") + '<textarea id="f_nameEn" rows="2">' + A.esc(m.nameEn || "") + '</textarea></label>'
      + '<div class="grid2">'
      + '<label>' + A.t("p_brand") + '<input id="f_brand" type="text" value="' + A.esc(m.brand || "") + '"></label>'
      + '<label>' + A.t("p_cat") + '<select id="f_cat">' + catOpts + '</select></label></div>'
      + '<label>' + A.t("p_sku") + '<input id="f_sku" type="text" value="' + A.esc(m.sku || "") + '"></label>'
      + '<div class="grid3">'
      + '<label>' + A.t("p_priceLab") + '<input id="f_price" type="number" min="0" step="0.001" value="' + A.esc(m.price) + '"></label>'
      + '<label>' + A.t("p_was") + '<input id="f_was" type="number" min="0" step="0.001" value="' + A.esc(m.was) + '"></label>'
      + '<label>' + A.t("p_qty") + '<input id="f_stock" type="number" min="0" step="1" value="' + A.esc(m.stock) + '"></label></div>'
      + '<label>' + A.t("tax_label") + '<select id="f_taxMode">'
      + '<option value="vat5"' + ((m.taxMode || "vat5") === "vat5" ? " selected" : "") + '>' + A.t("tax_vat5") + '</option>'
      + '<option value="exempt"' + (m.taxMode === "exempt" ? " selected" : "") + '>' + A.t("tax_exempt") + '</option>'
      + '<option value="custom"' + (m.taxMode === "custom" ? " selected" : "") + '>' + A.t("tax_custom") + '</option>'
      + '</select></label>'
      + '<label id="f_taxCustomWrap"' + ((m.taxMode || "vat5") === "custom" ? "" : " hidden") + '>' + A.t("tax_customRate") + '<input id="f_taxCustom" type="number" min="0" max="100" step="0.1" value="' + A.esc(m.taxCustom != null ? m.taxCustom : "") + '" placeholder="%"></label>'
      + '<label class="hide-row"><input id="f_hidden" type="checkbox"' + (m.hidden ? " checked" : "") + '> ' + A.t("p_hide") + '</label>'
      + '<label>' + A.t("p_descAr") + '<textarea id="f_descAr" rows="4">' + A.esc(m.descAr || "") + '</textarea></label>'
      + '<label>' + A.t("p_descEn") + '<textarea id="f_descEn" rows="4">' + A.esc(m.descEn || "") + '</textarea></label>'
      + '<label>' + A.t("p_useAr") + '<textarea id="f_useAr" rows="4">' + A.esc(m.useAr || "") + '</textarea></label>'
      + '<label>' + A.t("p_useEn") + '<textarea id="f_useEn" rows="4">' + A.esc(m.useEn || "") + '</textarea></label>'
      + '<label>' + A.t("p_skinAr") + '<input id="f_skinAr" type="text" value="' + A.esc(m.skinAr || "") + '"></label>'
      + '<label>' + A.t("p_skinEn") + '<input id="f_skinEn" type="text" value="' + A.esc(m.skinEn || "") + '"></label>'
      + '</div></div>'
      + '<div class="edit-sheet-foot">'
      + '<button type="button" class="primary" id="saveEdit">' + A.t("p_save") + '</button>'
      + '</div>';

    A.paintImgGallery();
    bindImgTools();

    var bodyEl = document.getElementById("editSheetBody");
    if (bodyEl) bodyEl.scrollTop = 0;

    document.getElementById("backList").onclick = function () {
      A.closeEdit(false);
    };
    loadEditScale();
    applyEditScale();
    document.getElementById("saveEdit").onclick = function () { A.saveEdit(); };
    var taxSel = document.getElementById("f_taxMode");
    var taxWrap = document.getElementById("f_taxCustomWrap");
    if (taxSel && taxWrap) {
      taxSel.onchange = function () { taxWrap.hidden = taxSel.value !== "custom"; };
    }
    /* Hide checkbox: apply + sync immediately (same as list hide button) */
    var hidEl = document.getElementById("f_hidden");
    if (hidEl) {
      hidEl.onchange = function () {
        var id = A.editingId;
        if (id == null) return;
        var key = String(id);
        var existing = A.overrides[id] || A.overrides[key] || {};
        var next = Object.assign({}, existing);
        if (hidEl.checked) next.hidden = true;
        else delete next.hidden;
        if (Object.keys(next).length) {
          A.overrides[key] = next;
          if (A.overrides[id] && String(id) !== key) delete A.overrides[id];
        } else {
          delete A.overrides[key];
          delete A.overrides[id];
        }
        try { localStorage.setItem(A.KEY || "naqa_overrides", JSON.stringify(A.overrides)); } catch (e) {}
        A.setMsg("status", hidEl.checked
          ? (A.lang === "en" ? "Hidden on the store." : "صار مخفي في المتجر.")
          : (A.lang === "en" ? "Visible on the store." : "صار ظاهر في المتجر."));
        if (A.syncOverridesCloud) A.syncOverridesCloud();
        else if (A.publishLive) A.publishLive();
      };
    }
  };


  A.toggleHide = function (id) {
    if (A.requireAuth && !A.requireAuth("status")) return;
    if (!A.products || !A.products.length) {
      if (A.refreshProductsFromBundle) A.refreshProductsFromBundle();
    }
    var p = (A.products || []).find(function (x) { return String(x.id) === String(id); });
    if (!p) {
      A.setMsg("status", A.lang === "en" ? "Product not found." : "المنتج غير موجود.");
      return;
    }
    var key = String(id);
    var existing = A.overrides[id] || A.overrides[key] || {};
    var next = Object.assign({}, existing);
    var willHide = !next.hidden;
    if (willHide) next.hidden = true;
    else delete next.hidden;
    if (Object.keys(next).length) {
      A.overrides[key] = next;
      if (A.overrides[id] && String(id) !== key) delete A.overrides[id];
    } else {
      delete A.overrides[key];
      delete A.overrides[id];
    }
    try { localStorage.setItem(A.KEY || "naqa_overrides", JSON.stringify(A.overrides)); } catch (e) {
      A.setMsg("status", A.t("p_imgsFull"));
      return;
    }
    if (A.paintList) A.paintList(A.productQuery || "");
    var msg = willHide
      ? (A.lang === "en" ? "Hidden on the store." : "صار مخفي في المتجر.")
      : (A.lang === "en" ? "Visible on the store." : "صار ظاهر في المتجر.");
    A.setMsg("status", msg);
    if (A.syncOverridesCloud) A.syncOverridesCloud();
    else if (A.publishLive) A.publishLive();
  };
  A.saveEdit = function (opts) {
    if (A.requireAuth && !A.requireAuth("status")) return;

    opts = opts || {};
    if (A.editingId == null) return;
    var taxModeEl = document.getElementById("f_taxMode");
    var taxMode = taxModeEl ? taxModeEl.value : "vat5";
    if (taxMode !== "exempt" && taxMode !== "custom") taxMode = "vat5";
    var taxCustom = A.val("f_taxCustom") === "" ? undefined : Number(A.val("f_taxCustom"));
    var next = {
      nameAr: A.val("f_nameAr"), nameEn: A.val("f_nameEn"), brand: A.val("f_brand"), cat: A.val("f_cat"), sku: A.val("f_sku"),
      price: A.val("f_price") === "" ? undefined : Number(A.val("f_price")),
      was: A.val("f_was") === "" ? undefined : Number(A.val("f_was")),
      stock: A.val("f_stock") === "" ? undefined : Number(A.val("f_stock")),
      taxMode: taxMode,
      taxCustom: taxMode === "custom" ? taxCustom : undefined,
      descAr: A.val("f_descAr"), descEn: A.val("f_descEn"), useAr: A.val("f_useAr"), useEn: A.val("f_useEn"),
      skinAr: A.val("f_skinAr"), skinEn: A.val("f_skinEn"),
      imgs: normImgs(A._editImgs || []),
      hidden: !!(document.getElementById("f_hidden") && document.getElementById("f_hidden").checked)
    };
    /* intentional catalog deletes — so load never re-adds them as a "wipe repair" */
    (function () {
      var p0 = A.products.find(function (x) { return String(x.id) === String(A.editingId); });
      var base = (A._editBaseImgs && A._editBaseImgs.length)
        ? A._editBaseImgs
        : (p0 && Array.isArray(p0.imgs) ? p0.imgs.filter(Boolean) : []);
      var gallery = next.imgs || [];
      var gset = {};
      gallery.forEach(function (u) {
        var k = A.normImgPath ? A.normImgPath(u) : u;
        gset[k] = 1; gset[u] = 1;
      });
      var removed = [];
      base.forEach(function (u) {
        var k = A.normImgPath ? A.normImgPath(u) : u;
        if (!gset[k] && !gset[u]) removed.push(k || u);
      });
      Object.keys(A._editRemoved || {}).forEach(function (k) {
        if (removed.indexOf(k) < 0 && !gset[k]) removed.push(k);
      });
      if (removed.length) next.removedImgs = removed.slice(0, 20);
      else delete next.removedImgs;
    })();
    if (next.price != null && (isNaN(next.price) || next.price < 0)) { A.setMsg("status", A.t("p_priceBad")); return; }
    if (next.was != null && (isNaN(next.was) || next.was < 0)) { A.setMsg("status", A.t("p_priceBad")); return; }
    if (next.stock != null && (isNaN(next.stock) || next.stock < 0)) { A.setMsg("status", A.t("p_stockBad")); return; }
    if (next.sku && A.skuTaken && A.skuTaken(next.sku, A.editingId)) {
      A.setMsg("status", A.t("p_skuDup") || (A.lang === "en" ? "SKU already used on another product." : "هذا الـ SKU مستخدم لمنتج آخر."));
      return;
    }
    /* keep custom product flag so store injects it */
    (function () {
      var p0 = A.products.find(function (x) { return String(x.id) === String(A.editingId); });
      var prev = A.overrides[String(A.editingId)] || A.overrides[A.editingId] || {};
      if ((p0 && p0._new) || prev._new) next._new = true;
      /* featured UI removed from list — keep hot only if already in overrides */
    })();
    if (next.price == null || isNaN(next.price)) delete next.price;
    if (next.was == null || isNaN(next.was)) delete next.was;
    if (next.stock == null || isNaN(next.stock)) delete next.stock;
    if (next.taxMode === "vat5") delete next.taxMode;
    if (next.taxCustom == null || isNaN(next.taxCustom) || next.taxMode !== "custom") delete next.taxCustom;
    /* empty gallery is valid (user deleted all). Keep [] so store does not fall back to full catalog. */
    if (!Array.isArray(next.imgs)) next.imgs = [];
    if (!next.hidden) delete next.hidden;
    if (!next.hot) delete next.hot;
    Object.keys(next).forEach(function (k) { if (next[k] === "" || next[k] === undefined) delete next[k]; });
    var ok = String(A.editingId);
    if (Object.keys(next).length) {
      var prevO = A.overrides[ok] || A.overrides[A.editingId] || {};
      A.overrides[ok] = Object.assign({}, prevO, next);
      /* explicit empty imgs must win */
      if (Array.isArray(next.imgs)) A.overrides[ok].imgs = next.imgs;
      if (next.removedImgs) A.overrides[ok].removedImgs = next.removedImgs;
      else delete A.overrides[ok].removedImgs;
      /* unhide must clear prevO.hidden — Object.assign keeps it if next has no key */
      if (!next.hidden) delete A.overrides[ok].hidden;
      if (!next.hot) delete A.overrides[ok].hot;
      else A.overrides[ok].hot = true;
      if (A.overrides[A.editingId] && String(A.editingId) !== ok) delete A.overrides[A.editingId];
    } else {
      delete A.overrides[ok];
      delete A.overrides[A.editingId];
    }
    try { localStorage.setItem(A.KEY, JSON.stringify(A.overrides)); } catch (e) {
      A.setMsg("status", A.t("p_imgsFull"));
      return;
    }
    if (opts && opts.skipPublish) return;
    /* keep in-memory catalog fields in sync for new/custom products */
    try {
      var live = A.products.find(function (x) { return String(x.id) === String(A.editingId); });
      if (live) {
        Object.keys(next).forEach(function (k) {
          if (k === "removedImgs") return;
          live[k] = next[k];
        });
        if (!next.hidden) delete live.hidden;
        if (!next.hot) live.hot = false;
      }
    } catch (eLive) {}
    A.closeEdit(false);
    if (A.syncOverridesCloud) A.syncOverridesCloud();
    else if (A.publishLive) A.publishLive();
    else A.setMsg("status", A.t("p_saved"));
  };

  A.materializeProductImages = function () {
    /* Legacy GitHub upload removed. Product photos use Firestore naqa_imgs (fs:…) or https/media paths. */
    return Promise.resolve();
  };

  /* List clicks: hide / edit / pager / hot / pick — bound here so it works after deferred load */
  A.bindProductListClicks = function () {
    var list = document.getElementById("list");
    if (!list) return;
    if (list._naqaProdHandler) {
      try { list.removeEventListener("click", list._naqaProdHandler, true); } catch (e) {}
      try { list.removeEventListener("click", list._naqaProdHandler, false); } catch (e2) {}
    }
    if (list._naqaProdChange) {
      try { list.removeEventListener("change", list._naqaProdChange, true); } catch (e3) {}
    }
    function onListClick(e) {
      var hide = e.target.closest("[data-hide]");
      if (hide) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (A.toggleHide) A.toggleHide(hide.getAttribute("data-hide"));
        return;
      }
      var hot = e.target.closest("[data-hot]");
      if (hot) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (A.toggleHot) A.toggleHot(hot.getAttribute("data-hot"));
        return;
      }
      var pg = e.target.closest("[data-page]");
      if (pg && !pg.disabled) {
        e.preventDefault();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        var n = parseInt(pg.getAttribute("data-page"), 10);
        if (!n || n < 1) return;
        A.productPage = n;
        A.paintList(A.productQuery || "");
        try { history.pushState({ naqa: "sec", tab: "products", page: n }, "", A.sectionHash ? A.sectionHash() : "#/products"); } catch (err) {}
        return;
      }
      var open = e.target.closest("button[data-open], .edit-btn[data-open]");
      if (open) {
        e.preventDefault();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (A.openEdit) A.openEdit(open.getAttribute("data-open"));
      }
    }
    function onListChange(e) {
      var t = e.target;
      if (!t) return;
      if (t.getAttribute && t.getAttribute("data-pick") != null) {
        var pid = String(t.getAttribute("data-pick"));
        A.productSel = A.productSel || {};
        if (t.checked) A.productSel[pid] = true;
        else delete A.productSel[pid];
        var bulk = document.getElementById("prodBulk");
        var n = Object.keys(A.productSel).filter(function (k) { return A.productSel[k]; }).length;
        if (bulk) bulk.classList.add("on");
        var sn = bulk && bulk.querySelector(".prod-sel-n");
        if (sn) {
          sn.textContent = String(n);
          sn.classList.toggle("is-zero", n === 0);
        }
        /* show/hide clear without full repaint */
        var clearBtn = document.getElementById("prodBulkClear");
        if (n > 0 && !clearBtn && bulk) {
          clearBtn = document.createElement("button");
          clearBtn.type = "button";
          clearBtn.className = "mini prod-sel-clear";
          clearBtn.id = "prodBulkClear";
          clearBtn.textContent = A.t("clearSelected") || (A.lang === "en" ? "Clear" : "إلغاء التحديد");
          clearBtn.onclick = function () { A.productSel = {}; A.paintList(A.productQuery || ""); };
          bulk.appendChild(clearBtn);
        } else if (n === 0 && clearBtn) {
          clearBtn.remove();
        }
        var checkAll = document.getElementById("prodCheckAll");
        if (checkAll) {
          /* leave indeterminate/checked state light — full sync on next paint */
        }
        return;
      }
      if (t.getAttribute && t.getAttribute("data-qk-price") != null) {
        A.quickSaveField(t.getAttribute("data-qk-price"), "price", t.value);
        return;
      }
      if (t.getAttribute && t.getAttribute("data-qk-stock") != null) {
        A.quickSaveField(t.getAttribute("data-qk-stock"), "stock", t.value);
        return;
      }
    }
    list._naqaProdHandler = onListClick;
    list._naqaProdChange = onListChange;
    list.addEventListener("click", onListClick, true);
    list.addEventListener("change", onListChange, true);
    /* blur-save for number fields (mobile keyboards) */
    list.addEventListener("focusout", function (e) {
      var t = e.target;
      if (!t || !t.getAttribute) return;
      if (t.getAttribute("data-qk-price") != null) A.quickSaveField(t.getAttribute("data-qk-price"), "price", t.value);
      if (t.getAttribute("data-qk-stock") != null) A.quickSaveField(t.getAttribute("data-qk-stock"), "stock", t.value);
    }, true);
    list._naqaProdBound = true;
  };

  A.bindProductTools = function () {
    var search = document.getElementById("prodSearch");
    var sBtn = document.getElementById("prodSearchBtn");
    var sortEl = document.getElementById("prodSort");
    /* Excel menu is bound globally (#excelMenuBtn) */
    var goLow = document.getElementById("prodGoLow");
    var checkAll = document.getElementById("prodCheckAll");
    var bClear = document.getElementById("prodBulkClear");

    function runSearch() {
      A.productQuery = search ? search.value.trim() : "";
      A.productPage = 1;
      A.paintList(A.productQuery);
    }
    if (sBtn) sBtn.onclick = runSearch;
    if (search) {
      search.onkeydown = function (e) {
        if (e.key === "Enter") { e.preventDefault(); runSearch(); }
      };
      /* live filter (debounced) */
      var t = 0;
      search.oninput = function () {
        clearTimeout(t);
        t = setTimeout(runSearch, 220);
      };
    }
    if (sortEl) sortEl.onchange = function () {
      A.productSort = sortEl.value || "name";
      A.productPage = 1;
      A.paintList(A.productQuery || "");
    };

    if (goLow) goLow.onclick = function () {
      if (A.go) A.go("products", "stock", { push: true, page: 1 });
      else { A.productView = "stock"; A.productPage = 1; A.paintList(A.productQuery || ""); }
    };
    if (checkAll) checkAll.onchange = function () {
      A.productSel = A.productSel || {};
      /* تحديد الكل = كل نتائج الفلتر/البحث الحالية (مو الصفحة فقط) */
      var list = (A.products || []).slice();
      var q = String(A.productQuery || "").trim().toLowerCase();
      var view = A.productView || "all";
      var ids = list.filter(function (p) {
        var m = A.merged(p);
        if (view === "hidden" && !m.hidden) return false;
        if (view === "shown" && m.hidden) return false;
        if (view === "stock") {
          if (m.stock === "" || m.stock == null) return false;
          var sn = Number(m.stock);
          if (!(sn >= 0 && sn <= 2)) return false;
        }
        if (!q) return true;
        var blob = [m.nameAr, m.nameEn, m.brand, m.sku, m.cat, p.id].join(" ").toLowerCase();
        return blob.indexOf(q) >= 0;
      }).map(function (p) { return String(p.id); });
      if (checkAll.checked) {
        ids.forEach(function (id) { A.productSel[id] = true; });
      } else {
        ids.forEach(function (id) { delete A.productSel[id]; });
      }
      A.paintList(A.productQuery || "");
    };
    if (bClear) bClear.onclick = function () {
      A.productSel = {};
      A.paintList(A.productQuery || "");
    };
  };

  try { A.bindProductListClicks(); } catch (e) {}
})(window);
