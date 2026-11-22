/* Naqa accessibility helpers — focus, escape, live region, dialogs */
(function () {
  "use strict";

  function $(s) { return document.querySelector(s); }
  function aT(ar, en) {
    return (typeof lang !== "undefined" && lang === "en") ? en : ar;
  }
  function announce(msg) {
    var el = $("#a11yLive");
    if (!el || !msg) return;
    el.textContent = "";
    setTimeout(function () { el.textContent = String(msg); }, 30);
  }
  window.naqaAnnounce = announce;

  var lastFocus = null;

  function focusable(root) {
    if (!root) return [];
    return Array.prototype.slice.call(
      root.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
      )
    ).filter(function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
  }

  function trapKey(e, root) {
    if (e.key !== "Tab" || !root) return;
    var list = focusable(root);
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function markDialog(el, open, label) {
    if (!el) return;
    if (open) {
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-modal", "true");
      if (label) el.setAttribute("aria-label", label);
    } else {
      el.removeAttribute("aria-modal");
    }
  }

  // Patch cart open/close if present
  var _openCart = window.openCart;
  var _closeCart = window.closeCart;
  window.openCart = function () {
    lastFocus = document.activeElement;
    if (typeof _openCart === "function") _openCart();
    else {
      var o = $("#overlay"), d = $("#drawer");
      if (o) o.classList.add("show");
      if (d) d.classList.add("show");
    }
    document.body.classList.add("drawer-open");
    var drawer = $("#drawer");
    markDialog(drawer, true, aT("سلة التسوق", "Shopping cart"));
    var btn = $("#cartBtn");
    if (btn) btn.setAttribute("aria-expanded", "true");
    setTimeout(function () {
      var close = $("#closeCart");
      if (close) close.focus();
      else {
        var f = focusable(drawer)[0];
        if (f) f.focus();
      }
    }, 40);
  };
  window.closeCart = function () {
    if (typeof _closeCart === "function") _closeCart();
    else {
      var o = $("#overlay"), d = $("#drawer");
      if (o) o.classList.remove("show");
      if (d) d.classList.remove("show");
    }
    document.body.classList.remove("drawer-open");
    var drawer = $("#drawer");
    if (drawer) drawer.setAttribute("aria-modal", "false");
    var btn = $("#cartBtn");
    if (btn) btn.setAttribute("aria-expanded", "false");
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  };

  var _openSheet = window.openSheet;
  window.openSheet = async function (id, mode, reset) {
    lastFocus = document.activeElement;
    if (typeof _openSheet === "function") await _openSheet(id, mode, reset);
    var sheet = $("#sheet");
    markDialog(sheet, true, aT("تفاصيل المنتج", "Product details"));
    setTimeout(function () {
      var back = $("#closeSheet");
      if (back) back.focus();
    }, 50);
  };
  var _closeSheet = window.closeSheet;
  window.closeSheet = function (fromRoute) {
    if (typeof _closeSheet === "function") _closeSheet(fromRoute);
    var sheet = $("#sheet");
    if (sheet) sheet.setAttribute("aria-modal", "false");
    if (lastFocus && lastFocus.focus && !document.getElementById("drawer")?.classList.contains("show")) {
      try { lastFocus.focus(); } catch (e) {}
    }
  };

  var _openCheckout = window.openCheckout;
  var _closeCheckout = window.closeCheckout;
  window.openCheckout = function () {
    lastFocus = document.activeElement;
    if (typeof _openCheckout === "function") _openCheckout();
    else {
      var m = $("#checkoutModal");
      if (m) m.classList.add("show");
    }
    var m = $("#checkoutModal");
    markDialog(m, true, aT("إتمام الطلب", "Checkout"));
    setTimeout(function () {
      var n = $("#coName");
      if (n) n.focus();
    }, 40);
  };
  window.closeCheckout = function () {
    if (typeof _closeCheckout === "function") _closeCheckout();
    else {
      var m = $("#checkoutModal");
      if (m) m.classList.remove("show");
    }
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  };

  var _openLightbox = window.openLightbox;
  var _closeLightbox = window.closeLightbox;
  window.openLightbox = function (src) {
    lastFocus = document.activeElement;
    if (typeof _openLightbox === "function") _openLightbox(src);
    var lb = $("#lightbox");
    markDialog(lb, true, aT("تكبير الصورة", "Image preview"));
    var img = $("#lbImg");
    if (img && src) {
      img.alt = aT("صورة المنتج مكبرة", "Enlarged product image");
    }
    setTimeout(function () {
      var c = $("#lbClose");
      if (c) c.focus();
    }, 30);
  };
  window.closeLightbox = function () {
    if (typeof _closeLightbox === "function") _closeLightbox();
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  };

  // Escape + focus trap
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if ($("#lightbox") && $("#lightbox").classList.contains("show")) {
        e.preventDefault();
        closeLightbox();
        return;
      }
      if ($("#checkoutModal") && $("#checkoutModal").classList.contains("show")) {
        e.preventDefault();
        closeCheckout();
        return;
      }
      if ($("#sheet") && $("#sheet").classList.contains("show")) {
        e.preventDefault();
        closeSheet();
        return;
      }
      if ($("#drawer") && $("#drawer").classList.contains("show")) {
        e.preventDefault();
        closeCart();
        return;
      }
    }
    if ($("#lightbox")?.classList.contains("show")) trapKey(e, $("#lightbox"));
    else if ($("#checkoutModal")?.classList.contains("show")) trapKey(e, $("#checkoutModal"));
    else if ($("#sheet")?.classList.contains("show")) trapKey(e, $("#sheetCard") || $("#sheet"));
    else if ($("#drawer")?.classList.contains("show")) trapKey(e, $("#drawer"));
  });

  // Static chrome labels (also refreshed on lang change)
  function refreshChromeA11y() {
    var map = [
      ["#search", "aria-label", aT("بحث عن منتج", "Search products")],
      ["#langBtn", "aria-label", aT("تبديل اللغة إلى الإنجليزية", "Switch language to Arabic")],
      ["#wishBtn", "aria-label", aT("المفضلة", "Wishlist")],
      ["#cartBtn", "aria-label", aT("السلة", "Cart")],
      ["#closeCart", "aria-label", aT("إغلاق السلة", "Close cart")],
      ["#lbClose", "aria-label", aT("إغلاق الصورة", "Close image")],
      ["#waFloat", "aria-label", aT("تواصل واتساب", "WhatsApp contact")],
      ["#shipBarWrap", "aria-label", aT("معلومات التوصيل", "Shipping info")],
      ["#concernBar", "aria-label", aT("اهتمامات البشرة", "Skin concerns")],
      ["#sortSel", "aria-label", aT("ترتيب المنتجات", "Sort products")],
      ["#priceBar", "aria-label", aT("تصفية بالسعر", "Price filter")],
      ["#cats", "aria-label", aT("تصنيفات المنتجات", "Product categories")],
      ["#barGo", "aria-label", aT("فتح السلة", "Open cart")],
    ];
    map.forEach(function (row) {
      var el = $(row[0]);
      if (el) el.setAttribute(row[1], row[2]);
    });
    var cartBtn = $("#cartBtn");
    if (cartBtn && !cartBtn.hasAttribute("aria-expanded")) {
      cartBtn.setAttribute("aria-expanded", "false");
      cartBtn.setAttribute("aria-controls", "drawer");
    }
    var wish = $("#wishBtn");
    if (wish) wish.setAttribute("aria-pressed", (typeof wishView !== "undefined" && wishView) ? "true" : "false");
  }
  window.refreshChromeA11y = refreshChromeA11y;

  // Announce cart adds
  var _addToCart = window.addToCart;
  if (typeof _addToCart === "function") {
    window.addToCart = function () {
      var r = _addToCart.apply(this, arguments);
      try {
        if (arguments[2]) return r; // quiet
        var id = arguments[0];
        var p = (typeof products !== "undefined") ? products.find(function (x) { return x.id === id; }) : null;
        var name = p && typeof pname === "function" ? pname(p) : "";
        announce(aT("تمت إضافة " + name + " إلى السلة", "Added " + name + " to cart"));
      } catch (e) {}
      return r;
    };
  }

  document.addEventListener("DOMContentLoaded", refreshChromeA11y);
  // deferred scripts: also run after short delay
  setTimeout(refreshChromeA11y, 0);
  setTimeout(refreshChromeA11y, 300);

  // Hook applyLang if it exists later
  var tries = 0;
  var hook = setInterval(function () {
    tries++;
    if (typeof applyLang === "function" && !applyLang.__a11y) {
      var orig = applyLang;
      window.applyLang = function () {
        orig.apply(this, arguments);
        refreshChromeA11y();
      };
      window.applyLang.__a11y = true;
      clearInterval(hook);
    }
    if (tries > 40) clearInterval(hook);
  }, 100);
})();
