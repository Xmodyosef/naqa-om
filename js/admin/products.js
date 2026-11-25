(function (w) {
  var A = w.NaqaAdmin;
  var MAX_IMGS = 5;

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
    A.paintList("");
    try { history.replaceState({ naqa: "tab", tab: "products" }, "", "#/products"); } catch (e) {}
    return true;
  };

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var max = 1000;
        var s = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * s));
        c.height = Math.max(1, Math.round(img.height * s));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("photo"));
      };
      img.src = url;
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
        + '<img src="' + A.esc(src) + '" alt="" loading="lazy">'
        + '<div class="img-gal-actions">'
        + (i > 0 ? '<button type="button" data-img-main="' + i + '">★</button>' : "")
        + (i > 0 ? '<button type="button" data-img-up="' + i + '">‹</button>' : "")
        + (i < imgs.length - 1 ? '<button type="button" data-img-down="' + i + '">›</button>' : "")
        + '<button type="button" data-img-del="' + i + '">✕</button>'
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
  };

  function bindImgTools() {
    var gal = document.getElementById("imgGal");
    if (gal && !gal._bound) {
      gal._bound = true;
      gal.addEventListener("click", function (e) {
        var main = e.target.closest("[data-img-main]");
        var up = e.target.closest("[data-img-up]");
        var down = e.target.closest("[data-img-down]");
        var del = e.target.closest("[data-img-del]");
        if (main) {
          var i = +main.getAttribute("data-img-main");
          var t = A._editImgs.splice(i, 1)[0];
          A._editImgs.unshift(t);
          A.paintImgGallery();
          return;
        }
        if (up) {
          var iu = +up.getAttribute("data-img-up");
          if (iu > 0) {
            var a = A._editImgs[iu - 1];
            A._editImgs[iu - 1] = A._editImgs[iu];
            A._editImgs[iu] = a;
            A.paintImgGallery();
          }
          return;
        }
        if (down) {
          var id = +down.getAttribute("data-img-down");
          if (id < A._editImgs.length - 1) {
            var b = A._editImgs[id + 1];
            A._editImgs[id + 1] = A._editImgs[id];
            A._editImgs[id] = b;
            A.paintImgGallery();
          }
          return;
        }
        if (del) {
          var ix = +del.getAttribute("data-img-del");
          A._editImgs.splice(ix, 1);
          A.paintImgGallery();
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
        Promise.all(files.map(fileToDataUrl)).then(function (urls) {
          A._editImgs = normImgs((A._editImgs || []).concat(urls));
          A.paintImgGallery();
          A.setMsg("status", A.t("p_imgsAdded"));
        }).catch(function () {
          A.setMsg("status", A.t("p_imgsFail"));
        });
      });
    }
    var addUrl = document.getElementById("btnImgUrl");
    if (addUrl) addUrl.onclick = function () {
      var inp = document.getElementById("f_imgUrl");
      var u = inp ? inp.value.trim() : "";
      if (!u) return;
      if ((A._editImgs || []).length >= MAX_IMGS) {
        A.setMsg("status", A.t("p_imgsMax"));
        return;
      }
      A._editImgs = normImgs((A._editImgs || []).concat([u]));
      if (inp) inp.value = "";
      A.paintImgGallery();
    };
  }

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
    q = ""; /* product search disabled — use filters/pagination only */
    var low = 0, out = 0;
    A.products.forEach(function (p) {
      var m = A.merged(p);
      if (m.stock === "" || m.stock == null) return;
      var n = Number(m.stock);
      if (n <= 0) out++;
      else if (n <= 3) low++;
    });
    var inv = '<div class="panel" style="margin-bottom:10px"><h2>' + A.t("p_invTitle") + '</h2>'
      + '<p class="note">' + A.t("p_invNote") + '</p>'
      + '<small>' + A.t("p_low") + ': <b>' + low + '</b> · ' + A.t("p_out") + ': <b>' + out + '</b></small></div>';
    var view = A.productView || "all";
    var matched = A.products.filter(function (p) {
      var m = A.merged(p);
      if (view === "hidden" && !m.hidden) return false;
      if (view === "shown" && m.hidden) return false;
      var blob = [m.nameAr, m.nameEn, m.brand, m.sku, p.id].join(" ").toLowerCase();
      return !q || blob.indexOf(q) >= 0;
    });
    var per = 50;
    var pages = Math.max(1, Math.ceil(matched.length / per));
    var page = A.productPage || 1;
    if (page < 1) page = 1;
    if (page > pages) page = pages;
    A.productPage = page;
    var slice = matched.slice((page - 1) * per, page * per);
    var html = slice.map(function (p) {
      var m = A.merged(p);
      var img = (m.imgs && m.imgs[0]) || "";
      var thumb = img ? '<img src="' + A.esc(img) + '" alt="">' : '<div class="ph"></div>';
      var stock = m.stock === "" || m.stock == null ? "—" : m.stock;
      var stockN = Number(m.stock);
      var stockCls = (m.stock !== "" && m.stock != null && stockN <= 0) ? ' style="color:#b05c6e;font-weight:800"' : (m.stock != null && m.stock !== "" && stockN <= 3 ? ' style="color:#c9a227;font-weight:800"' : "");
      var hid = m.hidden ? " · " + A.t("p_hidden") : "";
      var vol = m.vol || m.volume || m.size || m.unit || "";
      var title = String(m.nameAr || m.nameEn || "").replace(/\s+/g, " ").trim();
      var taxTxt = A.taxLabel ? A.taxLabel(m) : (A.t("tax_vat5") || "");
      return '<article class="prod-card row' + (m.hidden ? " is-hidden" : "") + '" data-open="' + p.id + '">'
        + '<div class="prod-thumb">' + thumb + '</div>'
        + '<div class="prod-body">'
        +   '<div class="prod-title">' + A.esc(title) + '</div>'
        +   '<div class="prod-meta">'
        +     (m.brand ? '<span>' + A.esc(m.brand) + '</span>' : '')
        +     (m.cat ? '<span>' + A.esc(m.cat) + '</span>' : '')
        +     (vol ? '<span>' + A.esc(vol) + '</span>' : '')
        +     '<span>SKU ' + A.esc(m.sku || "—") + '</span>'
        +   '</div>'
        +   '<div class="prod-price-row">'
        +     '<span class="prod-price">' + A.esc(m.price) + ' <small>' + A.t("omr") + '</small></span>'
        +     (taxTxt ? '<span class="prod-tax">' + A.esc(taxTxt) + '</span>' : '')
        +     '<span class="prod-stock"' + stockCls + '>' + A.t("p_stock") + ' ' + A.esc(stock) + '</span>'
        +     (hid ? '<span class="prod-hid">' + A.esc(hid.replace(/^ · /, "")) + '</span>' : '')
        +   '</div>'
        + '</div>'
        + '<div class="prod-actions">'
        +   '<button type="button" class="edit-btn" data-open="' + p.id + '">' + A.t("p_edit") + '</button>'
        + '</div>'
        + '</article>';
    }).join("");
    var pager = "";
    if (matched.length) {
      pager = '<div class="pager" id="prodPager">'
        + '<button type="button" data-page="' + (page - 1) + '"' + (page <= 1 ? " disabled" : "") + ">" + A.t("pagePrev") + "</button>"
        + '<span>' + page + " / " + pages + " · " + matched.length + "</span>"
        + '<button type="button" data-page="' + (page + 1) + '"' + (page >= pages ? " disabled" : "") + ">" + A.t("pageNext") + "</button>"
        + "</div>";
    }
    document.getElementById("list").innerHTML = inv + (html || '<p class="note">' + A.t("p_empty") + '</p>') + pager;
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

    A._editImgs = normImgs(m.imgs || []);

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
  };


  A.toggleHide = function (id) {
    if (A.requireAuth && !A.requireAuth("status")) return;

    var p = A.products.find(function (x) { return String(x.id) === String(id); });
    if (!p) return;
    var key = String(id);
    var existing = A.overrides[id] || A.overrides[key] || {};
    var next = Object.assign({}, existing);
    if (next.hidden) delete next.hidden;
    else next.hidden = true;
    if (Object.keys(next).length) {
      A.overrides[key] = next;
      if (A.overrides[id] && String(id) !== key) delete A.overrides[id];
    } else {
      delete A.overrides[key];
      delete A.overrides[id];
    }
    try { localStorage.setItem(A.KEY, JSON.stringify(A.overrides)); } catch (e) {
      A.setMsg("status", A.t("p_imgsFull"));
      return;
    }
    if (A.paintList) A.paintList("");
    if (A.publishLive) A.publishLive();
    else A.setMsg("status", A.t("p_saved"));
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
      imgs: normImgs(A._editImgs),
      hidden: !!(document.getElementById("f_hidden") && document.getElementById("f_hidden").checked)
    };
    if (next.price != null && (isNaN(next.price) || next.price < 0)) { A.setMsg("status", A.t("p_priceBad")); return; }
    if (next.was != null && (isNaN(next.was) || next.was < 0)) { A.setMsg("status", A.t("p_priceBad")); return; }
    if (next.stock != null && (isNaN(next.stock) || next.stock < 0)) { A.setMsg("status", A.t("p_stockBad")); return; }
    if (next.price == null || isNaN(next.price)) delete next.price;
    if (next.was == null || isNaN(next.was)) delete next.was;
    if (next.stock == null || isNaN(next.stock)) delete next.stock;
    if (next.taxMode === "vat5") delete next.taxMode;
    if (next.taxCustom == null || isNaN(next.taxCustom) || next.taxMode !== "custom") delete next.taxCustom;
    if (!next.imgs.length) delete next.imgs;
    if (!next.hidden) delete next.hidden;
    Object.keys(next).forEach(function (k) { if (next[k] === "" || next[k] === undefined) delete next[k]; });
    var ok = String(A.editingId);
    if (Object.keys(next).length) {
      A.overrides[ok] = next;
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
    A.closeEdit(false);
    if (A.publishLive) A.publishLive();
    else A.setMsg("status", A.t("p_saved"));
  };

  A.materializeProductImages = function (token) {
    var jobs = [];
    Object.keys(A.overrides || {}).forEach(function (id) {
      var o = A.overrides[id];
      if (!o || !Array.isArray(o.imgs)) return;
      o.imgs.forEach(function (src, i) {
        if (typeof src !== "string" || src.indexOf("data:image") !== 0) return;
        var parts = src.split(",");
        var b64 = parts[1];
        if (!b64) return;
        var path = "media/products/p" + id + "-" + i + "-" + Date.now().toString(36) + ".jpg";
        jobs.push(
          A.ghPutB64(path, b64, token, "chore: product image " + id).then(function (res) {
            if (!res.ok) throw new Error("img");
            o.imgs[i] = path;
          })
        );
      });
    });
    return Promise.all(jobs).then(function () {
      try { localStorage.setItem(A.KEY, JSON.stringify(A.overrides)); } catch (e) {}
    });
  };
})(window);
