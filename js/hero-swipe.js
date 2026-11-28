/* Naqa hero: five products, transform carousel, forever autoplay. */
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
          candidates.push({ product: p, image: images[0] });
        }
      }
    });
    if (candidates.length < 5) {
      var fallback = [];
      try { fallback = catalogList(id, 12) || []; } catch (e) { fallback = []; }
      fallback.forEach(function (p) {
        if (candidates.length >= 5 || !p || p.hidden || candidates.some(function (x) { return x.product.id === p.id; })) return;
        var images = typeof pimgs === "function" ? pimgs(p) || [] : [];
        if (images[0]) candidates.push({ product: p, image: images[0] });
      });
    }
    if (!candidates.length) return;

    var title = en ? (c.en || c.ar || id) : (c.ar || c.en || id);
    var subtitle = en ? (c.subEn || "") : (c.subAr || "");
    var art = candidates.map(function (item, index) {
      var name = typeof pname === "function" ? pname(item.product) : (item.product.nameAr || item.product.nameEn || title);
      var loading = slides.length === 0 ? "eager" : "lazy";
      var priority = slides.length === 0 && index === 0 ? ' fetchpriority="high"' : "";
      return '<img src="' + esc(item.image) + '" alt="' + esc(name) + '" loading="' + loading +
        '" decoding="async" width="520" height="520"' + priority + ' draggable="false">';
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
  var hint = en ? "Swipe to browse." : "اسحبي لاستعراض المجموعات";
  return '<section class="hero-swipe" id="heroSwipe" role="region" aria-roledescription="' +
    (en ? "carousel" : "عارض") + '" aria-label="' + esc(label) + '">' +
    '<div class="hero-swipe-track" id="heroSwipeTrack" tabindex="0" role="group" aria-label="' +
    esc(hint) + '" aria-live="off">' + slides.join("") + '</div></section>';
}

function __naqaBindHeroEnhanced(force) {
  var root = document.getElementById("heroSwipe");
  var track = document.getElementById("heroSwipeTrack");
  if (!root || !track) return;

  root.hidden = false;
  root.removeAttribute("aria-hidden");

  var slides = Array.prototype.slice.call(track.querySelectorAll(".hero-slide"));
  if (!slides.length) return;

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

  function setIdx(i, animate) {
    var n = slides.length;
    i = ((i % n) + n) % n;
    root.dataset.naqaIdx = String(i);
    window.__naqaHeroIdx = i;
    track.style.transition = animate ? "transform .48s cubic-bezier(.22,.61,.36,1)" : "none";
    track.style.transform = "translate3d(" + (-i * 100) + "%,0,0)";
    slides.forEach(function (slide, j) {
      if (j === i) slide.setAttribute("aria-current", "true");
      else slide.removeAttribute("aria-current");
    });
  }

  var start = (window.__naqaHeroIdx != null)
    ? Number(window.__naqaHeroIdx)
    : Number(root.dataset.naqaIdx || 0);
  setIdx(start || 0, false);

  if (!force && root.__naqaHeroUiBound) return;
  root.__naqaHeroUiBound = true;

  var startX = 0, dx = 0, dragging = false, pointerId = null, suppressClickUntil = 0;

  function hold(ms) {
    root.dataset.naqaHoldUntil = String(Date.now() + (ms || 1600));
  }

  track.addEventListener("pointerdown", function (event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerId = event.pointerId;
    dragging = true;
    startX = event.clientX;
    dx = 0;
    track.style.transition = "none";
    try { track.setPointerCapture(event.pointerId); } catch (e) {}
  }, { passive: true });
  track.addEventListener("pointermove", function (event) {
    if (!dragging || pointerId !== event.pointerId) return;
    dx = event.clientX - startX;
    if (Math.abs(dx) < 4) return;
    hold(2500);
    var w = root.clientWidth || 1;
    var i = Number(root.dataset.naqaIdx || 0);
    track.style.transform = "translate3d(" + ((-i * 100) + (dx / w) * 100) + "%,0,0)";
  }, { passive: true });
  function endDrag(event) {
    if (!dragging) return;
    if (event && pointerId != null && event.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    var i = Number(root.dataset.naqaIdx || 0);
    if (Math.abs(dx) > 36) {
      suppressClickUntil = Date.now() + 400;
      setIdx(i + (dx < 0 ? 1 : -1), true);
    } else {
      setIdx(i, true);
    }
    hold(1400);
    dx = 0;
  }
  track.addEventListener("pointerup", endDrag, { passive: true });
  track.addEventListener("pointercancel", endDrag, { passive: true });
  track.addEventListener("keydown", function (event) {
    var i = Number(root.dataset.naqaIdx || 0);
    if (event.key === "ArrowRight") { event.preventDefault(); setIdx(i + 1, true); hold(1600); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); setIdx(i - 1, true); hold(1600); }
  });
  /* Only kill the click after a real swipe — never block open-catalog taps */
  track.addEventListener("click", function (event) {
    if (Date.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}
window.__naqaBindHeroEnhanced = __naqaBindHeroEnhanced;
function bindHeroSwipe(force) { __naqaBindHeroEnhanced(force); }

(function naqaHeroAutoForever() {
  if (window.__naqaHeroAutoForever) return;
  window.__naqaHeroAutoForever = true;
  setInterval(function () {
    try {
      var root = document.getElementById("heroSwipe");
      var track = document.getElementById("heroSwipeTrack");
      if (!root || !track || root.hidden || document.hidden) return;
      var holdUntil = Number(root.dataset.naqaHoldUntil || 0);
      if (Date.now() < holdUntil) return;
      try {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      } catch (e) {}
      var slides = track.querySelectorAll(".hero-slide");
      var n = slides.length;
      if (n < 2) return;
      track.style.display = "flex";
      track.style.width = "100%";
      Array.prototype.forEach.call(slides, function (s) {
        s.style.flex = "0 0 100%";
        s.style.minWidth = "100%";
        s.style.width = "100%";
      });
      var cur = (window.__naqaHeroIdx != null)
        ? Number(window.__naqaHeroIdx)
        : Number(root.dataset.naqaIdx || 0);
      var i = (cur + 1) % n;
      window.__naqaHeroIdx = i;
      root.dataset.naqaIdx = String(i);
      track.style.transition = "transform .48s cubic-bezier(.22,.61,.36,1)";
      track.style.transform = "translate3d(" + (-i * 100) + "%,0,0)";
      Array.prototype.forEach.call(slides, function (s, j) {
        if (j === i) s.setAttribute("aria-current", "true");
        else s.removeAttribute("aria-current");
      });
    } catch (e) {}
  }, 2600);
})();

(function installNaqaHero() {
  function go(force) {
    try { bindHeroSwipe(!!force); } catch (e) {}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { go(true); }, { once: true });
  } else {
    go(true);
  }
  setTimeout(function () { go(true); }, 0);
  setTimeout(function () { go(false); }, 900);
})();
