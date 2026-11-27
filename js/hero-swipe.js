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
        if (images[0] && candidates.length < 3) {
          var cut = "media/hero-cutouts/p" + productId + ".webp";
          candidates.push({ product: p, image: cut, fallback: images[0] });
        }
      }
    });

    if (candidates.length < 3) {
      var fallback = [];
      try { fallback = catalogList(id, 8) || []; } catch (e) { fallback = []; }
      fallback.forEach(function (p) {
        if (candidates.length >= 3 || !p || p.hidden || candidates.some(function (x) { return x.product.id === p.id; })) return;
        var images = typeof pimgs === "function" ? pimgs(p) || [] : [];
        if (images[0]) {
          var cut2 = "media/hero-cutouts/p" + p.id + ".webp";
          candidates.push({ product: p, image: cut2, fallback: images[0] });
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
        '<span class="hero-slide-copy"><strong>' + esc(title) + '</strong>' +
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

function bindHeroSwipe() {
  var root = document.getElementById("heroSwipe");
  var track = document.getElementById("heroSwipeTrack");
  if (!root || !track || root.__naqaHeroBound) return;

  var slides = Array.prototype.slice.call(track.querySelectorAll(".hero-slide"));
  if (!slides.length) return;
  root.__naqaHeroBound = true;

  var startX = 0;
  var startY = 0;
  var pointerId = null;
  var moved = false;
  var suppressClickUntil = 0;
  var raf = 0;

  function currentIndex() {
    var width = track.clientWidth || 1;
    return Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / width)));
  }
  function go(index) {
    var width = track.clientWidth || 1;
    var next = Math.max(0, Math.min(slides.length - 1, index));
    var reduce = false;
    try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    track.scrollTo({ left: next * width, behavior: reduce ? "auto" : "smooth" });
  }
  function paint() {
    raf = 0;
    var active = currentIndex();
    slides.forEach(function (slide, index) {
      if (index === active) slide.setAttribute("aria-current", "true");
      else slide.removeAttribute("aria-current");
    });
  }

  track.addEventListener("scroll", function () {
    if (!raf) raf = requestAnimationFrame(paint);
  }, { passive: true });
  track.addEventListener("keydown", function (event) {
    var index = currentIndex();
    if (event.key === "ArrowRight") { event.preventDefault(); go(index + 1); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); go(index - 1); }
    else if (event.key === "Home") { event.preventDefault(); go(0); }
    else if (event.key === "End") { event.preventDefault(); go(slides.length - 1); }
  });
  track.addEventListener("pointerdown", function (event) {
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    moved = false;
  }, { passive: true });
  track.addEventListener("pointermove", function (event) {
    if (pointerId !== event.pointerId) return;
    var dx = Math.abs(event.clientX - startX);
    var dy = Math.abs(event.clientY - startY);
    if (dx > 12 && dx > dy) moved = true;
  }, { passive: true });
  track.addEventListener("pointerup", function (event) {
    if (pointerId !== event.pointerId) return;
    if (moved) suppressClickUntil = Date.now() + 450;
    pointerId = null;
  }, { passive: true });
  track.addEventListener("pointercancel", function () {
    pointerId = null;
    moved = false;
  }, { passive: true });
  track.addEventListener("click", function (event) {
    if (Date.now() >= suppressClickUntil) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickUntil = 0;
  }, true);
  paint();
}

(function installNaqaHero() {
  /* Redefine on window for any stale callers; do NOT call renderHomeCatalogs again (flash). */
  function install() {
    try {
      if (typeof bindHeroSwipe === "function") bindHeroSwipe();
    } catch (e) {}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
