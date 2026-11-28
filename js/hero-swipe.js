/* Naqa hero v2: product-led slides. Same markup as catalogs.js first paint — no FOUC re-render. */
function heroSwipeHTML() {
  var en = typeof lang !== "undefined" && lang === "en";
  var catalogs = ["hot", "eoy", "korean", "u10", "sheglam"];
  var allProducts = typeof products !== "undefined" && Array.isArray(products) ? products : [];
  var byId = {};
  allProducts.forEach(function (p) { if (p && p.id != null) byId[String(p.id)] = p; });
  var slides = [];

  catalogs.forEach(function (id) {
    var c = typeof catalogById === "function" ? catalogById(id) : null;
    if (!c || !c.cover || typeof catalogList !== "function") return;

    /* Never advertise an empty or fully hidden campaign. */
    var available = [];
    try { available = catalogList(id, 1) || []; } catch (e) { available = []; }
    if (!available.length) return;

    var candidates = [];
    var curated = typeof NAQA_BANNER_HEROES !== "undefined" && NAQA_BANNER_HEROES
      ? NAQA_BANNER_HEROES[id] || [] : [];
    curated.forEach(function (productId) {
      var p = byId[String(productId)];
      if (p && !p.hidden && typeof pimgs === "function") {
        var images = pimgs(p) || [];
        if (images[0] && candidates.length < 5) {
          var pic = naqaHeroImage(productId, images[0]);
          candidates.push({ product: p, image: pic.image, fallback: pic.fallback });
        }
      }
    });

    if (candidates.length < 5) {
      var fallback = [];
      try { fallback = catalogList(id, 12) || []; } catch (e) { fallback = []; }
      fallback.forEach(function (p) {
        if (candidates.length >= 5 || !p || p.hidden || candidates.some(function (x) { return x.product.id === p.id; })) return;
        var images = typeof pimgs === "function" ? pimgs(p) || [] : [];
        if (images[0]) {
          var pic2 = naqaHeroImage(p.id, images[0]);
          candidates.push({ product: p, image: pic2.image, fallback: pic2.fallback });
        }
      });
    }
    if (!candidates.length) return;

    var title = en ? (c.en || c.ar || id) : (c.ar || c.en || id);
    var subtitle = en ? (c.subEn || "") : (c.subAr || "");
    var art = candidates.map(function (item, index) {
      var name = typeof pname === "function" ? pname(item.product) : (item.product.nameAr || item.product.nameEn || title);
      var loading = slides.length === 0 ? "eager" : "lazy";
      var priority = slides.length === 0 && index === 0 ? ' fetchpriority="high"' : "";
      var fb = item.fallback ? (' onerror="this.onerror=null;this.src=\'' + esc(item.fallback) + '\'"') : '';
      return '<img src="' + esc(item.image) + '" alt="' + esc(name) + '" loading="' + loading +
        '" decoding="async" width="520" height="520"' + priority + ' draggable="false"' + fb + '>';
    }).join("");

    slides.push(
      '<button type="button" class="hero-slide" data-tone="' + esc(c.tone || "all") +
        '" data-open-catalog="' + esc(c.id) + '" aria-label="' + esc(title) + '">' +
        '<span class="hero-slide-art" aria-hidden="true">' + art + '</span>' +
        '<span class="hero-slide-copy"><span class="hero-kicker">' + (en ? "Naqa" : "نقاء") + '</span><strong>' + esc(title) + '</strong>' +
        (subtitle ? '<small>' + esc(subtitle) + '</small>' : '') +
        '<em>' + (en ? "Explore collection" : "اكتشفي المجموعة") + '</em></span>' +
      '</button>'
    );
  });

  if (!slides.length) return "";
  var label = en ? "Featured collections" : "المجموعات المميزة";
  var hint = en ? "Swipe to browse. Use arrow keys to move." : "اسحب لاستعراض المجموعات، أو استخدم الأسهم للتنقل";
  return '<section class="hero-swipe" id="heroSwipe" role="region" aria-roledescription="' +
    (en ? "carousel" : "عارض") + '" aria-label="' + esc(label) + '">' +
    '<div class="hero-swipe-track" id="heroSwipeTrack" tabindex="0" role="group" aria-label="' +
    esc(hint) + '" aria-live="off">' + slides.join("") + '</div></section>';
}

function bindHeroSwipe(force) {
  var root = document.getElementById("heroSwipe");
  var track = document.getElementById("heroSwipeTrack");
  if (!root || !track) return;
  /* Keep a live autoplay — re-render often calls bind again. */
  if (!force && root.__naqaHeroBound && root.__naqaHeroTimer) return;
  if (root.__naqaHeroTimer) {
    try { clearInterval(root.__naqaHeroTimer); } catch (e) {}
    root.__naqaHeroTimer = 0;
  }
  root.__naqaHeroBound = true;

  var slides = Array.prototype.slice.call(track.querySelectorAll(".hero-slide"));
  if (!slides.length) return;

  /* Transform carousel — works on iOS where scrollLeft autoplay often fails. */
  track.style.display = "flex";
  track.style.width = "100%";
  track.style.overflow = "visible";
  track.style.scrollSnapType = "none";
  track.style.willChange = "transform";
  slides.forEach(function (slide) {
    slide.style.flex = "0 0 100%";
    slide.style.width = "100%";
    slide.style.minWidth = "100%";
  });

  var index = 0;
  var resumeAt = 0;
  var dragging = false;
  var startX = 0;
  var startY = 0;
  var dx = 0;
  var suppressClickUntil = 0;
  var pointerId = null;

  function motionOff() {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }
  function paint() {
    slides.forEach(function (slide, i) {
      if (i === index) slide.setAttribute("aria-current", "true");
      else slide.removeAttribute("aria-current");
    });
  }
  function show(i, animate) {
    var count = slides.length;
    index = ((i % count) + count) % count;
    if (animate && !motionOff()) {
      track.style.transition = "transform .55s cubic-bezier(.22,.61,.36,1)";
    } else {
      track.style.transition = "none";
    }
    track.style.transform = "translate3d(" + (-index * 100) + "%,0,0)";
    paint();
  }
  show(0, false);

  root.__naqaHeroTimer = setInterval(function () {
    if (Date.now() < resumeAt || document.hidden || motionOff() || dragging || slides.length < 2) return;
    show(index + 1, true);
  }, 3000);

  track.addEventListener("pointerdown", function (event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerId = event.pointerId;
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    dx = 0;
    resumeAt = Date.now() + 5000;
    track.style.transition = "none";
    try { track.setPointerCapture(event.pointerId); } catch (e) {}
  }, { passive: true });
  track.addEventListener("pointermove", function (event) {
    if (!dragging || pointerId !== event.pointerId) return;
    dx = event.clientX - startX;
    var dy = event.clientY - startY;
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    var w = root.clientWidth || 1;
    track.style.transform = "translate3d(" + ((-index * 100) + (dx / w) * 100) + "%,0,0)";
  }, { passive: true });
  function endDrag(event) {
    if (!dragging) return;
    if (event && pointerId != null && event.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    if (Math.abs(dx) > 40) {
      suppressClickUntil = Date.now() + 450;
      show(index + (dx < 0 ? 1 : -1), true);
    } else {
      show(index, true);
    }
    resumeAt = Date.now() + 1600;
    dx = 0;
  }
  track.addEventListener("pointerup", endDrag, { passive: true });
  track.addEventListener("pointercancel", endDrag, { passive: true });
  track.addEventListener("keydown", function (event) {
    if (event.key === "ArrowRight") { event.preventDefault(); show(index + 1, true); resumeAt = Date.now() + 2000; }
    else if (event.key === "ArrowLeft") { event.preventDefault(); show(index - 1, true); resumeAt = Date.now() + 2000; }
    else if (event.key === "Home") { event.preventDefault(); show(0, true); }
    else if (event.key === "End") { event.preventDefault(); show(slides.length - 1, true); }
  });
  track.addEventListener("click", function (event) {
    if (Date.now() >= suppressClickUntil) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickUntil = 0;
  }, true);
  document.addEventListener("visibilitychange", function () {
    resumeAt = document.hidden ? Date.now() + 600000 : Date.now() + 800;
  });
}

(function installNaqaHero() {
  function install(force) {
    try {
      if (typeof bindHeroSwipe === "function") bindHeroSwipe(!!force);
    } catch (e) {}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { install(true); }, { once: true });
  } else {
    install(true);
  }
  setTimeout(function () { install(true); }, 0);
  /* One late pass if boot painted after us; do not keep resetting. */
  setTimeout(function () { install(false); }, 1500);
})();
