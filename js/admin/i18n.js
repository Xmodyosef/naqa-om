(function (w) {
  var A = w.NaqaAdmin;
  A.I18N = {
    ar: {
      title: "لوحة تحكم نقاء",
      langBtn: "English",
      tab_home: "الرئيسية",
      tab_orders: "الطلبات",
      tab_products: "المنتجات",
      tab_reviews: "التقييمات",
      tab_customers: "العملاء",
      tab_finance: "المالية",
      tab_settings: "الإعدادات",
      pinLead: "رمز الدخول مشفّر على هذا الجهاز. بعد ٥ محاولات خاطئة يُقفل ١٥ دقيقة. الجلسة تنتهي بعد ٣٠ دقيقة سكون.",
      pinNote: "بعد الدخول: رئيسية · طلبات · منتجات · تقييمات · عملاء · مالية · إعدادات.",
      pinPh: "٤ أرقام أو أكثر",
      pinGo: "دخول",
      pinShort: "الرمز ٤ أرقام على الأقل.",
      pinBad: "الرمز غير صحيح.",
      pinLocked: "اللوحة مقفلة مؤقتاً. جرّبي بعد قليل.",
      pinLeft: "محاولات متبقية",
      saveLocal: "حفظ على جهازي",
      publish: "نشر للكل",
      st_new: "جديد",
      st_prep: "جاري التجهيز",
      st_ship: "جاري التوصيل",
      st_delivered: "تم التوصيل",
      st_cancel: "ملغي",
      all: "الكل",
      setTitle: "الحساب والنشر",
      setPin: "رمز الدخول مشفّر على الجهاز. ما ينرسل لأي سيرفر.",
      setTok: "لا تلصقي رمز GitHub إلا وأنتِ وحدك، ولحظة النشر فقط. ما ينحفظ. الطلبات ما تنشر.",
      setTokLabel: "رمز GitHub (contents:write) · يُمسح بعد النشر",
      setWa: "واتساب المتجر",
      setPinBtn: "تغيير رمز الدخول",
      setOut: "خروج",
      setOutAsk: "خروج من لوحة التحكم؟",
      setNewPin: "رمز جديد (٤ أرقام على الأقل)",
      setPinOk: "تم تغيير الرمز.",
      savedDev: "انحفظ على الجهاز.",
      savedOrders: "انحفظ سجل الطلبات.",
      saved: "انحفظ.",
      needTok: "انحفظ محلياً. الصقي رمز GitHub في الإعدادات ثم انشري. الرمز ما ينحفظ.",
      needTok2: "يلزم رمز GitHub للنشر، وما ينحفظ على الجهاز.",
      publishing: "جاري النشر…",
      published: "اننشرت المنتجات والتقييمات والمخزون. الطلبات ما اننشرت. الرمز انمسح.",
      publishedProducts: "اننشرت المنتجات والمخزون.",
      ordersStay: "الطلبات بقيت على جهازك، ما اننشرت.",
      reviewsOk: "اننشرت التقييمات المعتمدة.",
      publishFail: "فشل النشر.",
      payCod: "دفع عند الاستلام · غير مدفوع",
      payPending: "تحويل بنكي · بانتظار التأكيد",
      payConfirmed: "التحويل مؤكد · الرسوم انحذفت",
      confirmPay: "تأكيد الدفع",
      confirmedMsg: "انأكد التحويل وانحذفت الرسوم.",
      deleted: "انحذف",
      statusTo: "حالة",
      payLine: "الدفع",
      total: "المجموع",
      vatInc: "شامل الضريبة ٥٪",
      vatOf: "منها",
      omr: "ر.ع",
      note: "ملاحظة",
      productLink: "رابط المنتج",
      wa: "واتساب",
      del: "حذف",
      /* products */
      p_edit: "تعديل كامل",
      p_price: "السعر",
      p_stock: "المخزون",
      p_hidden: "مخفي",
      p_vatNote: "كل الأصناف · الأسعار شاملة ضريبة القيمة المضافة ٥٪",
      p_empty: "ما في نتائج",
      p_back: "← رجوع للقائمة",
      p_nameAr: "الاسم عربي",
      p_nameEn: "الاسم English",
      p_brand: "الماركة",
      p_cat: "التصنيف",
      p_sku: "SKU",
      p_priceLab: "السعر ر.ع",
      p_was: "قبل الخصم",
      p_qty: "الكمية",
      p_hide: "إخفاء المنتج",
      p_descAr: "الوصف عربي",
      p_descEn: "الوصف English",
      p_useAr: "الاستعمال عربي",
      p_useEn: "الاستعمال English",
      p_skinAr: "يناسب (عربي)",
      p_skinEn: "Best for",
      p_imgs: "صور (سطر لكل رابط)",
      p_save: "حفظ هذا المنتج",
      p_saved: "انحفظ المنتج.",
      p_invTitle: "المخزون المركزي",
      p_invNote: "الكمية هنا تنشر مع المنتجات. الزبائن يشوفون نفاد المخزون بعد «نشر للكل». عند تجهيز الطلب تُخصم الكمية تلقائياً.",
      p_low: "منخفض",
      p_out: "نفد",
      p_search: "ابحثي عن منتج…",
      /* dashboard */
      d_sales: "مبيعات (بدون ملغي)",
      d_orders: "طلبات فعّالة",
      d_new: "جديد",
      d_prep: "جاري التجهيز",
      d_ship: "جاري التوصيل",
      d_done: "تم التوصيل",
      d_low: "مخزون منخفض (≤٣)",
      d_hidden: "منتجات مخفية",
      d_recent: "آخر الطلبات",
      d_top: "الأكثر مبيعاً",
      d_lowTitle: "تنبيه مخزون",
      d_noRecent: "ما في طلبات حديثة. اطلبي من المتجر على نفس الجهاز.",
      d_noTop: "لما توصل طلبات بمنتجات، يظهر هنا الأكثر مبيعاً.",
      d_noLow: "ما في مخزون منخفض.",
      d_pcs: "قطعة",
      d_left: "متبقي",
      d_note: "الأرقام من الطلبات على الجهاز. المخزون المنشور يظهر للزبائن بعد النشر.",
      /* customers */
      c_title: "العملاء",
      c_note: "مجمّعين من الطلبات — بحث ونسخ وواتساب.",
      c_search: "ابحثي عن زبونة…",
      c_copy: "نسخ قائمة العملاء",
      c_wa: "واتساب القائمة",
      c_empty: "ما في عملاء بعد. أول طلب غير ملغي يظهر هنا.",
      c_noRes: "ما في نتائج للبحث.",
      c_orders: "طلب",
      c_last: "آخر طلب",
      /* finance */
      f_copy: "نسخ التقرير",
      f_wa: "واتساب التقرير",
      f_todaySales: "مبيعات اليوم ر.ع",
      f_todayOrders: "طلبات اليوم",
      f_totalSales: "إجمالي المبيعات (بدون ملغي)",
      f_active: "طلبات فعّالة",
      f_avg: "متوسط قيمة الطلب",
      f_delivered: "تم التوصيل",
      f_ship: "جاري التوصيل",
      f_prep: "جاري التجهيز",
      f_new: "جديد",
      f_cancel: "ملغي",
      f_areas: "أعلى المناطق",
      f_prods: "أعلى المنتجات إيراداً",
      f_note: "الأرقام من سجل الطلبات على الجهاز.",
      f_noAreas: "ما في بيانات مناطق بعد.",
      f_noProds: "ما في تفصيل منتجات في الطلبات بعد.",
      f_orderN: "طلب",
      /* reviews */
      r_title: "تقييمات الزبونات",
      r_note: "الزبونة ترسل الكلام والصورة على واتساب. أنتِ توافقين هنا. الرقم ما ينحفظ. بعدين «نشر للكل».",
      r_sku: "SKU المنتج",
      r_nick: "اللقب",
      r_stars: "النجوم",
      r_ar: "النص العربي",
      r_en: "English text",
      r_photo: "صورة اختيارية",
      r_add: "إضافة التقييم",
      r_empty: "لا تقييمات منشورة بعد.",
      r_show: "إظهار",
      r_hide: "إخفاء",
      r_badSku: "SKU غير موجود.",
      r_need: "اللقب والنص مطلوبان.",
      r_added: "انضاف على جهازك. اضغطي «نشر للكل» عشان يظهر في المتجر.",
      r_photoFail: "الصورة ما انفتحت.",
      storeLink: "← المتجر"
    },
    en: {
      title: "Naqa admin",
      langBtn: "عربي",
      tab_home: "Home",
      tab_orders: "Orders",
      tab_products: "Products",
      tab_reviews: "Reviews",
      tab_customers: "Customers",
      tab_finance: "Finance",
      tab_settings: "Settings",
      pinLead: "The entry code is hashed on this device. After 5 wrong tries it locks for 15 minutes. The session ends after 30 minutes idle.",
      pinNote: "After entry: Home · Orders · Products · Reviews · Customers · Finance · Settings.",
      pinPh: "4 digits or more",
      pinGo: "Enter",
      pinShort: "The code needs at least 4 digits.",
      pinBad: "Wrong code.",
      pinLocked: "Admin is temporarily locked. Try again later.",
      pinLeft: "attempts left",
      saveLocal: "Save on this device",
      publish: "Publish",
      st_new: "New",
      st_prep: "Preparing",
      st_ship: "Out for delivery",
      st_delivered: "Delivered",
      st_cancel: "Cancelled",
      all: "All",
      setTitle: "Account and publishing",
      setPin: "The entry code is hashed on this device. It is never sent to a server.",
      setTok: "Paste the GitHub token only while alone, and only to publish. It is not saved. Orders are not published.",
      setTokLabel: "GitHub token (contents:write) · cleared after publish",
      setWa: "Store WhatsApp",
      setPinBtn: "Change entry code",
      setOut: "Log out",
      setOutAsk: "Leave the admin?",
      setNewPin: "New code (at least 4 digits)",
      setPinOk: "Code changed.",
      savedDev: "Saved on this device.",
      savedOrders: "Order log saved.",
      saved: "Saved.",
      needTok: "Saved locally. Paste the GitHub token in Settings, then publish. It is not stored.",
      needTok2: "A GitHub token is required to publish, and it is not saved on the device.",
      publishing: "Publishing…",
      published: "Products, stock and reviews published. Orders were not. The token was cleared.",
      publishedProducts: "Products and stock published.",
      ordersStay: "Orders stayed on this device. They were not published.",
      reviewsOk: "Approved reviews published.",
      publishFail: "Publish failed.",
      payCod: "Cash on delivery · unpaid",
      payPending: "Bank transfer · awaiting confirmation",
      payConfirmed: "Transfer confirmed · fees removed",
      confirmPay: "Confirm payment",
      confirmedMsg: "Transfer confirmed and fees removed.",
      deleted: "Deleted",
      statusTo: "Status",
      payLine: "Payment",
      total: "Total",
      vatInc: "incl. 5% VAT",
      vatOf: "of which",
      omr: "OMR",
      note: "Note",
      productLink: "Product link",
      wa: "WhatsApp",
      del: "Delete",
      p_edit: "Full edit",
      p_price: "Price",
      p_stock: "Stock",
      p_hidden: "Hidden",
      p_vatNote: "All items · prices include 5% VAT",
      p_empty: "No results",
      p_back: "← Back to list",
      p_nameAr: "Name Arabic",
      p_nameEn: "Name English",
      p_brand: "Brand",
      p_cat: "Category",
      p_sku: "SKU",
      p_priceLab: "Price OMR",
      p_was: "Was",
      p_qty: "Qty",
      p_hide: "Hide product",
      p_descAr: "Description Arabic",
      p_descEn: "Description English",
      p_useAr: "How to use Arabic",
      p_useEn: "How to use English",
      p_skinAr: "Best for (Arabic)",
      p_skinEn: "Best for",
      p_imgs: "Images (one URL per line)",
      p_save: "Save this product",
      p_saved: "Product saved.",
      p_invTitle: "Central stock",
      p_invNote: "Quantities publish with products. Customers see out-of-stock after Publish. Stock drops automatically when an order is set to Preparing.",
      p_low: "Low",
      p_out: "Out",
      p_search: "Search products…",
      d_sales: "Sales (excl. cancelled)",
      d_orders: "Active orders",
      d_new: "New",
      d_prep: "Preparing",
      d_ship: "Out for delivery",
      d_done: "Delivered",
      d_low: "Low stock (≤3)",
      d_hidden: "Hidden products",
      d_recent: "Recent orders",
      d_top: "Best sellers",
      d_lowTitle: "Stock alerts",
      d_noRecent: "No recent orders. Place a store order on this device.",
      d_noTop: "Top sellers appear once orders include products.",
      d_noLow: "No low stock.",
      d_pcs: "pcs",
      d_left: "left",
      d_note: "Figures come from orders on this device. Published stock is what customers see after Publish.",
      c_title: "Customers",
      c_note: "From orders — search, copy, WhatsApp.",
      c_search: "Search a customer…",
      c_copy: "Copy customer list",
      c_wa: "WhatsApp list",
      c_empty: "No customers yet. The first non-cancelled order appears here.",
      c_noRes: "No search results.",
      c_orders: "orders",
      c_last: "Last order",
      f_copy: "Copy report",
      f_wa: "WhatsApp report",
      f_todaySales: "Today sales OMR",
      f_todayOrders: "Today orders",
      f_totalSales: "Total sales (excl. cancelled)",
      f_active: "Active orders",
      f_avg: "Average order value",
      f_delivered: "Delivered",
      f_ship: "Out for delivery",
      f_prep: "Preparing",
      f_new: "New",
      f_cancel: "Cancelled",
      f_areas: "Top areas",
      f_prods: "Top products by revenue",
      f_note: "Figures from the order log on this device.",
      f_noAreas: "No area data yet.",
      f_noProds: "No product lines in orders yet.",
      f_orderN: "orders",
      r_title: "Customer reviews",
      r_note: "Customers send text and a photo on WhatsApp. You approve here. Phone numbers are never stored. Then Publish.",
      r_sku: "Product SKU",
      r_nick: "Nickname",
      r_stars: "Stars",
      r_ar: "Arabic text",
      r_en: "English text",
      r_photo: "Optional photo",
      r_add: "Add review",
      r_empty: "No published reviews yet.",
      r_show: "Show",
      r_hide: "Hide",
      r_badSku: "SKU not found.",
      r_need: "Nickname and text are required.",
      r_added: "Saved on this device. Tap Publish to show it in the store.",
      r_photoFail: "Could not open the photo.",
      storeLink: "← Store"
    }
  };
  A.lang = localStorage.getItem("naqa_admin_lang") === "en" ? "en" : "ar";
  A.t = function (k) {
    var pack = A.I18N[A.lang] || A.I18N.ar;
    return pack[k] != null ? pack[k] : (A.I18N.ar[k] || k);
  };
  A.statusLabel = function (k) { return A.t("st_" + k); };
  A.payState = function (o) {
    if (!o) return "cod";
    if (o.paymentStatus === "confirmed") return "confirmed";
    if (o.payment === "transfer" || o.payment === "paid") return "pending";
    return "cod";
  };
  A.payText = function (o) {
    var s = A.payState(o);
    if (s === "confirmed") return A.t("payConfirmed");
    if (s === "pending") return A.t("payPending");
    return A.t("payCod");
  };
  A.confirmPayment = function (id) {
    A.orders.forEach(function (o) {
      if (String(o.id) !== String(id)) return;
      if (A.payState(o) !== "pending") return;
      var sub = Number(o.subtotal);
      if (!isFinite(sub)) sub = Number(o.total) || 0;
      o.payment = "transfer";
      o.paid = true;
      o.paymentStatus = "confirmed";
      o.delivery = 0;
      o.codFee = 0;
      o.shipping = 0;
      o.total = sub;
      o.vat = Math.round(sub * 0.05 / 1.05 * 1000) / 1000;
      o.paymentLabel = A.payText(o);
    });
    A.saveOrders();
  };
  /* —— stock (central via published overrides) —— */
  A.applyStockDelta = function (order, sign) {
    if (!order || !Array.isArray(order.items)) return;
    order.items.forEach(function (it) {
      var id = it.id;
      if (id == null) return;
      var p = A.products.find(function (x) { return String(x.id) === String(id); });
      if (!p) return;
      var m = A.merged(p);
      var base = m.stock;
      if (base === "" || base == null || isNaN(Number(base))) return;
      var next = Math.max(0, Number(base) + sign * (Number(it.qty) || 0));
      var o = A.overrides[id] || A.overrides[String(id)] || {};
      o = Object.assign({}, o, { stock: next });
      A.overrides[id] = o;
      A.overrides[String(id)] = o;
    });
    try { localStorage.setItem(A.KEY, JSON.stringify(A.overrides)); } catch (e) {}
  };
  A.deductStockForOrder = function (order) {
    if (!order || order.stockDeducted) return;
    A.applyStockDelta(order, -1);
    order.stockDeducted = true;
  };
  A.restoreStockForOrder = function (order) {
    if (!order || !order.stockDeducted) return;
    A.applyStockDelta(order, +1);
    order.stockDeducted = false;
  };
  /* —— auth —— */
  A.PIN_HASH = "naqa_admin_pin_hash";
  A.PIN_FAIL = "naqa_admin_pin_fail";
  A.SESSION = "naqa_admin_session";
  A.MAX_FAIL = 5;
  A.LOCK_MS = 15 * 60 * 1000;
  A.SESSION_MS = 30 * 60 * 1000;
  A.hashPin = function (pin) {
    if (w.crypto && w.crypto.subtle) {
      var data = new TextEncoder().encode("naqa-om|v1|" + String(pin));
      return w.crypto.subtle.digest("SHA-256", data).then(function (buf) {
        return Array.from(new Uint8Array(buf)).map(function (b) {
          return b.toString(16).padStart(2, "0");
        }).join("");
      });
    }
    /* fallback for very old webviews */
    var s = "naqa-om|v1|" + String(pin), h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Promise.resolve("x" + Math.abs(h).toString(16));
  };
  A.lockInfo = function () {
    try {
      var raw = JSON.parse(localStorage.getItem(A.PIN_FAIL) || "null");
      if (!raw) return { fails: 0, until: 0 };
      return { fails: Number(raw.fails) || 0, until: Number(raw.until) || 0 };
    } catch (e) { return { fails: 0, until: 0 }; }
  };
  A.setLockInfo = function (fails, until) {
    localStorage.setItem(A.PIN_FAIL, JSON.stringify({ fails: fails, until: until || 0 }));
  };
  A.isLocked = function () {
    var info = A.lockInfo();
    return info.until && Date.now() < info.until;
  };
  A.touchSession = function () {
    localStorage.setItem(A.SESSION, String(Date.now()));
  };
  A.sessionOk = function () {
    var t = Number(localStorage.getItem(A.SESSION) || 0);
    return t && (Date.now() - t) < A.SESSION_MS;
  };
  A.clearSession = function () {
    localStorage.removeItem(A.SESSION);
  };
  A.applyChrome = function () {
    var en = A.lang === "en";
    document.documentElement.lang = en ? "en" : "ar";
    document.documentElement.dir = en ? "ltr" : "rtl";
    document.title = A.t("title");
    var h1 = document.querySelector(".admin-top h1");
    if (h1) h1.textContent = A.t("title");
    document.querySelectorAll("#tabs button").forEach(function (b) {
      var k = b.getAttribute("data-tab");
      if (k) b.textContent = A.t("tab_" + k);
    });
    var lead = document.getElementById("pinLead");
    if (lead) lead.textContent = A.t("pinLead");
    var note = document.getElementById("pinNote");
    if (note) note.textContent = A.t("pinNote");
    var pinInput = document.getElementById("pinInput");
    if (pinInput) pinInput.placeholder = A.t("pinPh");
    var pinGo = document.getElementById("pinGo");
    if (pinGo) pinGo.textContent = A.t("pinGo");
    var save = document.getElementById("saveLocal");
    if (save) save.textContent = A.t("saveLocal");
    var pub = document.getElementById("publish");
    if (pub) pub.textContent = A.t("publish");
    var langBtn = document.getElementById("adminLang");
    if (langBtn) langBtn.textContent = A.t("langBtn");
    var store = document.querySelector(".admin-top a.store");
    if (store) store.textContent = A.t("storeLink");
    var q = document.getElementById("q");
    if (q) q.placeholder = A.t("p_search");
  };
  A.setLang = function (next) {
    A.lang = next === "en" ? "en" : "ar";
    localStorage.setItem("naqa_admin_lang", A.lang);
    A.applyChrome();
    if (document.getElementById("tools") && !document.getElementById("tools").hidden && A.setTab) {
      var on = document.querySelector("#tabs button.on");
      A.setTab(on ? on.getAttribute("data-tab") : "home");
    }
  };
  try { localStorage.removeItem(A.TOKEN); } catch (e) {}
})(window);
