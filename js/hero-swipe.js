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

  var slides = Array.prototype.slice.call(track.querySelectorAll(".hero-slide"));
  if (!slides.length) return;

  /* Layout once — autoplay is a separate forever timer. */
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

  if (!force && root.__naqaHeroUiBound) return;
  root.__naqaHeroUiBound = true;

  var startX = 0;
  var startY = 0;
  var dx = 0;
  var dragging = false;
  var pointerId = null;
  var suppressClickUntil = 0;

  function idx() {
    return Number(root.dataset.naqaIdx || 0) || 0;
  }
  function setIdx(i, animate) {
    var n = slides.length;
    i = ((i % n) + n) % n;
    root.dataset.naqaIdx = String(i);
    track.style.transition = animate
      ? "transform .5s cubic-bezier(.22,.61,.36,1)"
      : "none";
    track.style.transform = "translate3d(" + (-i * 100) + "%,0,0)";
    slides.forEach(function (slide, j) {
      if (j === i) slide.setAttribute("aria-current", "true");
      else slide.removeAttribute("aria-current");
    });
  }
  if (root.dataset.naqaIdx == null) setIdx(0, false);
  else setIdx(idx(), false);

  function hold(ms) {
    root.dataset.naqaHold = "1";
    clearTimeout(root.__naqaHoldT);
    root.__naqaHoldT = setTimeout(function () {
      root.dataset.naqaHold = "0";
    }, ms || 1800);
  }

  track.addEventListener("pointerdown", function (event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerId = event.pointerId;
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    dx = 0;
    hold(6000);
    track.style.transition = "none";
    try { track.setPointerCapture(event.pointerId); } catch (e) {}
  }, { passive: true });
  track.addEventListener("pointermove", function (event) {
    if (!dragging || pointerId !== event.pointerId) return;
    dx = event.clientX - startX;
    var w = root.clientWidth || 1;
    var i = idx();
    track.style.transform = "translate3d(" + ((-i * 100) + (dx / w) * 100) + "%,0,0)";
  }, { passive: true });
  function endDrag(event) {
    if (!dragging) return;
    if (event && pointerId != null && event.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    if (Math.abs(dx) > 36) {
      suppressClickUntil = Date.now() + 400;
      setIdx(idx() + (dx < 0 ? 1 : -1), true);
    } else {
      setIdx(idx(), true);
    }
    hold(1600);
    dx = 0;
  }
  track.addEventListener("pointerup", endDrag, { passive: true });
  track.addEventListener("pointercancel", endDrag, { passive: true });
  track.addEventListener("keydown", function (event) {
    if (event.key === "ArrowRight") { event.preventDefault(); setIdx(idx() + 1, true); hold(2000); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); setIdx(idx() - 1, true); hold(2000); }
    else if (event.key === "Home") { event.preventDefault(); setIdx(0, true); }
    else if (event.key === "End") { event.preventDefault(); setIdx(slides.length - 1, true); }
  });
  track.addEventListener("click", function (event) {
    if (Date.now() >= suppressClickUntil) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickUntil = 0;
  }, true);
}

/* One global autoplay — survives re-renders and re-binds. */
(function naqaHeroAutoForever() {
  if (window.__naqaHeroAutoForever) return;
  window.__naqaHeroAutoForever = true;
  setInterval(function () {
    try {
      var root = document.getElementById("heroSwipe");
      var track = document.getElementById("heroSwipeTrack");
      if (!root || !track || document.hidden) return;
      if (root.dataset.naqaHold === "1") return;
      try {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      } catch (e) {}
      var slides = track.querySelectorAll(".hero-slide");
      var n = slides.length;
      if (n < 2) return;
      if (track.style.display !== "flex") {
        track.style.display = "flex";
        track.style.width = "100%";
        Array.prototype.forEach.call(slides, function (s) {
          s.style.flex = "0 0 100%";
          s.style.minWidth = "100%";
        });
      }
      var i = (Number(root.dataset.naqaIdx || 0) + 1) % n;
      root.dataset.naqaIdx = String(i);
      track.style.transition = "transform .5s cubic-bezier(.22,.61,.36,1)";
      track.style.transform = "translate3d(" + (-i * 100) + "%,0,0)";
      Array.prototype.forEach.call(slides, function (s, j) {
        if (j === i) s.setAttribute("aria-current", "true");
        else s.removeAttribute("aria-current");
      });
    } catch (e) {}
  }, 2800);
})();

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
  setTimeout(function () { install(false); }, 800);
  setTimeout(function () { install(false); }, 2000);
})();
