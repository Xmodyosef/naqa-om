(function (w) {
  var A = w.NaqaAdmin;
  A.paintStatusBar = function () {
    var bar = document.getElementById("statusBar");
    if (!bar) return;
    var counts = { all: A.orders.length };
    A.STATUS_ORDER.forEach(function (k) { counts[k] = 0; });
    A.orders.forEach(function (o) {
      o.status = A.normalizeStatus(o.status);
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    var parts = [{ id: "all", label: "الكل" }].concat(A.STATUS_ORDER.map(function (k) {
      return { id: k, label: A.STATUS[k] };
    }));
    bar.innerHTML = parts.map(function (p) {
      return '<button type="button" data-filter="' + p.id + '"' + (A.orderFilter === p.id ? ' class="on"' : "") + ">"
        + p.label + " (" + (counts[p.id] || 0) + ")</button>";
    }).join("");
  };
  A.paintOrders = function () {
    try {
      var btn = document.querySelector('#tabs button[data-tab="orders"]');
      if (btn) btn.textContent = A.orders.length ? ("الطلبات (" + A.orders.length + ")") : "الطلبات";
    } catch (e) {}
    A.orders.forEach(function (o) { o.status = A.normalizeStatus(o.status); });
    A.paintStatusBar();
    var tools = document.getElementById("ordersTools");
    if (tools && !tools._ready) {
      tools._ready = true;
      tools.innerHTML =
        '<button type="button" class="mini" id="copyAllOrders">نسخ كل الطلبات</button>'
        + '<button type="button" class="mini" id="copyNewOrders">نسخ الجديدة فقط</button>'
        + '<button type="button" class="mini" id="waOrdersReport" style="background:#25D366;color:#fff">واتساب الملخص</button>';
      tools.addEventListener("click", function (e) {
        var t = e.target;
        if (t.id === "copyAllOrders") A.copyText(A.buildOrdersReport("all"), "orderStatus");
        if (t.id === "copyNewOrders") A.copyText(A.buildOrdersReport("new"), "orderStatus");
        if (t.id === "waOrdersReport") A.waShareText(A.buildOrdersReport(A.orderFilter === "all" ? "new" : A.orderFilter));
      });
    }
    var box = document.getElementById("ordersList");
    if (!box) return;
    var list = A.orders.filter(function (o) {
      return A.orderFilter === "all" || A.normalizeStatus(o.status) === A.orderFilter;
    });
    if (!A.orders.length) {
      box.innerHTML = '<p class="note">ما في طلبات بعد. اطلبي من المتجر على نفس الجهاز عشان تنحفظ هنا تلقائي.</p>';
      return;
    }
    if (!list.length) {
      box.innerHTML = '<p class="note">ما في طلبات بهالحالة.</p>';
      return;
    }
    box.innerHTML = list.map(function (o) {
      var st = A.normalizeStatus(o.status);
      var items = "";
      if (Array.isArray(o.items) && o.items.length) {
        items = '<ul class="items">' + o.items.map(function (it) {
          var thumb = it.img ? ('<img src="' + A.esc(it.img) + '" alt="" style="width:40px;height:40px;object-fit:contain;border-radius:8px;background:#f6f1ee;margin-left:8px">') : "";
          return '<li>' + thumb + '<strong>' + A.esc(it.name || it.nameAr || "") + '</strong><small>SKU ' + A.esc(it.sku || "—") + ' · ×' + A.esc(it.qty) + ' · ' + A.esc(it.line != null ? it.line : it.price) + ' ر.ع</small>'
            + (it.link ? ('<div><a href="' + A.esc(it.link) + '" target="_blank" rel="noopener">رابط المنتج</a></div>') : "") + "</li>";
        }).join("") + "</ul>";
      } else if (o.itemsText) {
        items = '<pre class="note" style="white-space:pre-wrap">' + A.esc(o.itemsText) + "</pre>";
      }
      var when = o.at ? new Date(o.at).toLocaleString("ar-OM") : "";
      var phoneDigits = String(o.phone || "").replace(/\D/g, "").replace(/^968/, "");
      var statusBtns = A.STATUS_ORDER.map(function (k) {
        return '<button type="button" class="mini' + (st === k ? " on" : (k === "cancel" ? " ghost" : "")) + '" data-st="' + k + '" data-oid="' + A.esc(o.id) + '">' + A.STATUS[k] + "</button>";
      }).join("");
      return '<article class="order" data-oid="' + A.esc(o.id) + '">'
        + '<strong>' + A.esc(o.id) + ' <span class="badge ' + A.esc(st) + '">' + A.esc(A.STATUS[st] || st) + "</span></strong>"
        + "<small>" + A.esc(when) + "</small>"
        + "<small>" + A.esc(o.name || "—") + " · " + A.esc(o.phone || "—") + " · " + A.esc(o.area || "—") + "</small>"
        + "<small>المجموع: <b>" + A.esc(o.total != null ? Number(o.total).toFixed(3) : "—") + " ر.ع</b></small>"
        + "<small>الدفع: <b>" + A.esc(o.paymentLabel || (o.paid ? "مدفوع مسبقاً" : (o.payment === "cod" ? "دفع عند الاستلام" : "—"))) + "</b>"
        + (o.subtotal != null ? (" · فرعي " + A.esc(Number(o.subtotal).toFixed(3))) : "")
        + (o.shipping != null ? (" · توصيل " + A.esc(Number(o.shipping).toFixed(3)) + " ر.ع") : "")
        + "</small>"
        + (o.note ? ("<small>ملاحظة: " + A.esc(o.note) + "</small>") : "")
        + items + '<div class="actions">' + statusBtns
        + (phoneDigits ? ('<a class="mini" style="background:#25D366;display:inline-block;color:#fff;text-decoration:none;text-align:center" href="https://wa.me/968' + A.esc(phoneDigits) + '" target="_blank" rel="noopener">واتساب</a>') : "")
        + '<button type="button" class="mini ghost" data-del="' + A.esc(o.id) + '">حذف</button></div></article>';
    }).join("");
  };
})(window);
