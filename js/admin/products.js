(function (w) {
  var A = w.NaqaAdmin;

  function endEditMode() {
    try { document.body.classList.remove("naqa-editing"); } catch (e) {}
    if (window.naqaScrollLock) try { naqaScrollLock.unlock(); } catch (e) {}
  }

  function startEditMode() {
    try { document.body.classList.add("naqa-editing"); } catch (e) {}
    if (window.naqaScrollLock) try { naqaScrollLock.lock(); } catch (e) {}
  }

  A.paintList = function (q) {
    A.editingId = null;
    var listView = document.getElementById("listView");
    var editView = document.getElementById("editView");
    if (!listView || !editView) return;
    listView.hidden = false;
    editView.hidden = true;
    editView.innerHTML = "";
    endEditMode();
    q = (q || "").toLowerCase();
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
    var html = A.products.filter(function (p) {
      var m = A.merged(p);
      var blob = [m.nameAr, m.nameEn, m.brand, m.sku, p.id].join(" ").toLowerCase();
      return !q || blob.indexOf(q) >= 0;
    }).map(function (p) {
      var m = A.merged(p);
      var img = (m.imgs && m.imgs[0]) || "";
      var thumb = img ? '<img src="' + A.esc(img) + '" alt="">' : '<div class="ph"></div>';
      var stock = m.stock === "" || m.stock == null ? "—" : m.stock;
      var stockN = Number(m.stock);
      var stockCls = (m.stock !== "" && m.stock != null && stockN <= 0) ? ' style="color:#b05c6e;font-weight:800"' : (m.stock != null && m.stock !== "" && stockN <= 3 ? ' style="color:#c9a227;font-weight:800"' : "");
      var hid = m.hidden ? " · " + A.t("p_hidden") : "";
      return '<article class="row" data-open="' + p.id + '">' + thumb
        + '<div><strong>' + A.esc(m.nameAr || m.nameEn) + '</strong>'
        + '<small>' + A.esc(m.brand || "") + ' · ' + A.esc(m.cat || "") + ' · SKU ' + A.esc(m.sku || "—") + '</small>'
        + '<small>' + A.t("p_price") + ' ' + A.esc(m.price) + ' ' + A.t("omr") + ' <span style="color:#9a7b72;font-size:11px">' + A.t("vatInc") + '</span> · ' + A.t("p_stock") + ' <span' + stockCls + '>' + A.esc(stock) + '</span>' + hid + '</small></div>'
        + '<button type="button" class="edit-btn" data-open="' + p.id + '">' + A.t("p_edit") + '</button></article>';
    }).join("");
    document.getElementById("list").innerHTML = inv + '<p class="note" id="vatAdminNote" style="color:#9a7b72;margin:0 0 10px">' + A.t("p_vatNote") + '</p>' + (html || '<p class="note">' + A.t("p_empty") + '</p>');
  };

  A.openEdit = function (id) {
    var p = A.products.find(function (x) { return x.id == id; });
    if (!p) return;
    A.editingId = p.id;
    var m = A.merged(p);
    document.getElementById("listView").hidden = true;
    var editView = document.getElementById("editView");
    editView.hidden = false;
    startEditMode();

    var catOpts = A.CATS.map(function (c) {
      return '<option value="' + A.esc(c) + '"' + (m.cat === c ? " selected" : "") + ">" + A.esc(c) + "</option>";
    }).join("");
    var imgs = (m.imgs || []).join("\n");
    var title = m.nameAr || m.nameEn || A.t("p_edit");

    /* Full-screen sheet: sticky head + scrollable body + sticky foot (Salla/Zid mobile) */
    editView.innerHTML =
      '<div class="edit-sheet-head">'
      + '<button type="button" class="back" id="backList">' + A.t("p_back") + '</button>'
      + '<h2>' + A.esc(title) + '</h2>'
      + '</div>'
      + '<div class="edit-sheet-body" id="editSheetBody">'
      + '<div class="edit-card">'
      + '<div class="preview">' + ((m.imgs && m.imgs[0]) ? '<img src="' + A.esc(m.imgs[0]) + '" alt="">' : '<div class="ph big"></div>') + '</div>'
      + '<label>' + A.t("p_nameAr") + '<textarea id="f_nameAr" rows="2">' + A.esc(m.nameAr || "") + '</textarea></label>'
      + '<label>' + A.t("p_nameEn") + '<textarea id="f_nameEn" rows="2">' + A.esc(m.nameEn || "") + '</textarea></label>'
      + '<div class="grid2">'
      + '<label>' + A.t("p_brand") + '<input id="f_brand" type="text" value="' + A.esc(m.brand || "") + '"></label>'
      + '<label>' + A.t("p_cat") + '<select id="f_cat">' + catOpts + '</select></label></div>'
      + '<label>' + A.t("p_sku") + '<input id="f_sku" type="text" value="' + A.esc(m.sku || "") + '"></label>'
      + '<div class="grid3">'
      + '<label>' + A.t("p_priceLab") + ' <span style="color:#9a7b72;font-size:11px;font-weight:600">' + A.t("vatInc") + '</span><input id="f_price" type="number" min="0" step="0.001" value="' + A.esc(m.price) + '"></label>'
      + '<label>' + A.t("p_was") + '<input id="f_was" type="number" min="0" step="0.001" value="' + A.esc(m.was) + '"></label>'
      + '<label>' + A.t("p_qty") + '<input id="f_stock" type="number" min="0" step="1" value="' + A.esc(m.stock) + '"></label></div>'
      + '<label class="hide-row"><input id="f_hidden" type="checkbox"' + (m.hidden ? " checked" : "") + '> ' + A.t("p_hide") + '</label>'
      + '<label>' + A.t("p_descAr") + '<textarea id="f_descAr" rows="4">' + A.esc(m.descAr || "") + '</textarea></label>'
      + '<label>' + A.t("p_descEn") + '<textarea id="f_descEn" rows="4">' + A.esc(m.descEn || "") + '</textarea></label>'
      + '<label>' + A.t("p_useAr") + '<textarea id="f_useAr" rows="4">' + A.esc(m.useAr || "") + '</textarea></label>'
      + '<label>' + A.t("p_useEn") + '<textarea id="f_useEn" rows="4">' + A.esc(m.useEn || "") + '</textarea></label>'
      + '<label>' + A.t("p_skinAr") + '<input id="f_skinAr" type="text" value="' + A.esc(m.skinAr || "") + '"></label>'
      + '<label>' + A.t("p_skinEn") + '<input id="f_skinEn" type="text" value="' + A.esc(m.skinEn || "") + '"></label>'
      + '<label>' + A.t("p_imgs") + '<textarea id="f_imgs" rows="5">' + A.esc(imgs) + '</textarea></label>'
      + '</div></div>'
      + '<div class="edit-sheet-foot">'
      + '<button type="button" class="primary" id="saveEdit">' + A.t("p_save") + '</button>'
      + '</div>';

    var bodyEl = document.getElementById("editSheetBody");
    if (bodyEl) bodyEl.scrollTop = 0;

    document.getElementById("backList").onclick = function () {
      A.paintList(document.getElementById("q").value.trim());
    };
    document.getElementById("saveEdit").onclick = function () { A.saveEdit(); };
  };

  A.saveEdit = function () {
    if (A.editingId == null) return;
    var next = {
      nameAr: A.val("f_nameAr"), nameEn: A.val("f_nameEn"), brand: A.val("f_brand"), cat: A.val("f_cat"), sku: A.val("f_sku"),
      price: A.val("f_price") === "" ? undefined : Number(A.val("f_price")),
      was: A.val("f_was") === "" ? undefined : Number(A.val("f_was")),
      stock: A.val("f_stock") === "" ? undefined : Number(A.val("f_stock")),
      descAr: A.val("f_descAr"), descEn: A.val("f_descEn"), useAr: A.val("f_useAr"), useEn: A.val("f_useEn"),
      skinAr: A.val("f_skinAr"), skinEn: A.val("f_skinEn"),
      imgs: A.val("f_imgs").split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 5),
      hidden: !!(document.getElementById("f_hidden") && document.getElementById("f_hidden").checked)
    };
    if (next.price == null || isNaN(next.price)) delete next.price;
    if (next.was == null || isNaN(next.was)) delete next.was;
    if (next.stock == null || isNaN(next.stock)) delete next.stock;
    if (!next.imgs.length) delete next.imgs;
    if (!next.hidden) delete next.hidden;
    Object.keys(next).forEach(function (k) { if (next[k] === "" || next[k] === undefined) delete next[k]; });
    if (Object.keys(next).length) A.overrides[A.editingId] = next;
    else delete A.overrides[A.editingId];
    localStorage.setItem(A.KEY, JSON.stringify(A.overrides));
    A.setMsg("status", A.t("p_saved"));
    A.paintList(document.getElementById("q").value.trim());
  };
})(window);
