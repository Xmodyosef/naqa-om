(function (w) {
  var A = w.NaqaAdmin;
  A.paintList = function (q) {
    A.editingId = null;
    var listView = document.getElementById("listView");
    var editView = document.getElementById("editView");
    if (!listView || !editView) return;
    listView.hidden = false;
    editView.hidden = true;
    q = (q || "").toLowerCase();
    var html = A.products.filter(function (p) {
      var m = A.merged(p);
      var blob = [m.nameAr, m.nameEn, m.brand, m.sku, p.id].join(" ").toLowerCase();
      return !q || blob.indexOf(q) >= 0;
    }).map(function (p) {
      var m = A.merged(p);
      var img = (m.imgs && m.imgs[0]) || "";
      var thumb = img ? '<img src="' + A.esc(img) + '" alt="">' : '<div class="ph"></div>';
      var stock = m.stock === "" || m.stock == null ? "—" : m.stock;
      var hid = m.hidden ? " · مخفي" : "";
      return '<article class="row" data-open="' + p.id + '">' + thumb
        + '<div><strong>' + A.esc(m.nameAr || m.nameEn) + '</strong>'
        + '<small>' + A.esc(m.brand || "") + ' · ' + A.esc(m.cat || "") + ' · SKU ' + A.esc(m.sku || "—") + '</small>'
        + '<small>السعر ' + A.esc(m.price) + ' ر.ع <span style="color:#9a7b72;font-size:11px">شامل الضريبة ٥٪</span> · المخزون ' + A.esc(stock) + hid + '</small></div>'
        + '<button type="button" class="edit-btn" data-open="' + p.id + '">تعديل كامل</button></article>';
    }).join("");
    document.getElementById("list").innerHTML = '<p class="note" id="vatAdminNote" style="color:#9a7b72;margin:0 0 10px">كل الأصناف · الأسعار شاملة ضريبة القيمة المضافة ٥٪</p>' + (html || '<p class="note">ما في نتائج</p>');
  };
  A.openEdit = function (id) {
    var p = A.products.find(function (x) { return x.id == id; });
    if (!p) return;
    A.editingId = p.id;
    var m = A.merged(p);
    document.getElementById("listView").hidden = true;
    document.getElementById("editView").hidden = false;
    var catOpts = A.CATS.map(function (c) {
      return '<option value="' + A.esc(c) + '"' + (m.cat === c ? " selected" : "") + ">" + A.esc(c) + "</option>";
    }).join("");
    var imgs = (m.imgs || []).join("\n");
    document.getElementById("editView").innerHTML =
      '<button type="button" class="back" id="backList">← رجوع للقائمة</button>'
      + '<div class="edit-card">'
      + '<div class="preview">' + ((m.imgs && m.imgs[0]) ? '<img src="' + A.esc(m.imgs[0]) + '" alt="">' : '<div class="ph big"></div>') + '</div>'
      + '<label>الاسم عربي<textarea id="f_nameAr" rows="2">' + A.esc(m.nameAr || "") + '</textarea></label>'
      + '<label>الاسم English<textarea id="f_nameEn" rows="2">' + A.esc(m.nameEn || "") + '</textarea></label>'
      + '<div class="grid2">'
      + '<label>الماركة<input id="f_brand" type="text" value="' + A.esc(m.brand || "") + '"></label>'
      + '<label>التصنيف<select id="f_cat">' + catOpts + '</select></label></div>'
      + '<label>SKU<input id="f_sku" type="text" value="' + A.esc(m.sku || "") + '"></label>'
      + '<div class="grid3">'
      + '<label>السعر ر.ع <span style="color:#9a7b72;font-size:11px;font-weight:600">شامل الضريبة ٥٪</span><input id="f_price" type="number" min="0" step="0.001" value="' + A.esc(m.price) + '"></label>'
      + '<label>قبل الخصم<input id="f_was" type="number" min="0" step="0.001" value="' + A.esc(m.was) + '"></label>'
      + '<label>الكمية<input id="f_stock" type="number" min="0" step="1" value="' + A.esc(m.stock) + '"></label></div>'
      + '<label class="hide-row"><input id="f_hidden" type="checkbox"' + (m.hidden ? " checked" : "") + '> إخفاء المنتج</label>'
      + '<label>الوصف عربي<textarea id="f_descAr" rows="4">' + A.esc(m.descAr || "") + '</textarea></label>'
      + '<label>الوصف English<textarea id="f_descEn" rows="4">' + A.esc(m.descEn || "") + '</textarea></label>'
      + '<label>الاستعمال عربي<textarea id="f_useAr" rows="4">' + A.esc(m.useAr || "") + '</textarea></label>'
      + '<label>الاستعمال English<textarea id="f_useEn" rows="4">' + A.esc(m.useEn || "") + '</textarea></label>'
      + '<label>يناسب (عربي)<input id="f_skinAr" type="text" value="' + A.esc(m.skinAr || "") + '"></label>'
      + '<label>Best for<input id="f_skinEn" type="text" value="' + A.esc(m.skinEn || "") + '"></label>'
      + '<label>صور (سطر لكل رابط)<textarea id="f_imgs" rows="5">' + A.esc(imgs) + '</textarea></label>'
      + '<button type="button" class="primary" id="saveEdit">حفظ هذا المنتج</button></div>';
    document.getElementById("backList").onclick = function () { A.paintList(document.getElementById("q").value.trim()); };
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
    A.setMsg("status", "انحفظ المنتج.");
    A.paintList(document.getElementById("q").value.trim());
  };
})(window);
