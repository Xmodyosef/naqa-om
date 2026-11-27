/* Naqa home hero: curated, swipe-only, accessible. Loaded after store.min.js. */
function heroSwipeHTML() {
  var ids = ["hot", "eoy", "korean", "u10", "sheglam"];
  var en = typeof lang !== "undefined" && lang === "en";
  var slides = [];

  ids.forEach(function (id) {
    var c = typeof catalogById === "function" ? catalogById(id) : null;
    if (!c || !c.cover || typeof catalogList !== "function") return;

    /* Never advertise an empty or fully hidden campaign. */
    var available = [];
    try { available = catalogList(id, 1) || []; } catch (e) { available = []; }
    if (!available.length) return;

    var label = en ? (c.en || c.ar || id) : (c.ar || c.en || id);
    var first = slides.length === 0;
    var loading = first ? "eager" : "lazy";
    var priority = first ? ' fetchpriority="high"' : "";
    var index = slides.length + 1;

    slides.push(
      '<button type="button" class="hero-slide" data-open-catalog="' + esc(c.id) + '"' +
        ' aria-label="' + esc(label) + '" aria-roledescription="' + (en ? "slide" : "شريحة") + '"' +
        ' data-hero-index="' + (index - 1) + '">' +
        '<img src="' + esc(c.cover) + '" alt="' + esc(label) + '"' +
          ' loading="' + loading + '" decoding="async" width="1920" height="780"' + priority +
          ' draggable="false">' +
      '</button>'
    );
  });

  if (!slides.length) return "";

  var label = en ? "Featured campaigns" : "الحملات المميزة";
  var hint = en ? "Swipe to browse campaigns. Use the arrow keys to move." : "اسحب لاستعراض الحملات، أو استخدم الأسهم للتنقل";
  return '<section class="hero-swipe" id="heroSwipe" role="region" aria-roledescription="' +
    (en ? "carousel" : "عارض") + '" aria-label="' + esc(label) + '">' +
    '<div class="hero-swipe-track" id="heroSwipeTrack" tabindex="0" role="group" aria-label="' +
      esc(hint) + '" aria-live="off">' + slides.join("") + '</div>' +
  '</section>';
}

function bindHeroSwipe() {
  var root = document.getElementById("heroSwipe");
  var track = document.getElementById("heroSwipeTrack");
  if (!root || !track || root.__bound) return;

  var slides = Array.prototype.slice.call(track.querySelectorAll(".hero-slide"));
  if (!slides.length) return;
  root.__bound = true;

  if (slides.length === 1) {
    track.classList.add("is-static");
    slides[0].setAttribute("aria-current", "true");
    return;
  }

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
    if (raf) return;
    raf = requestAnimationFrame(paint);
  }, { passive: true });

  track.addEventListener("keydown", function (event) {
    var index = currentIndex();
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      go(0);
    } else if (event.key === "End") {
      event.preventDefault();
      go(slides.length - 1);
    }
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

/* store.min.js boots before this file; repaint once so the new hero rules take effect. */
(function installNaqaHero() {
  function install() {
    if (typeof renderHomeCatalogs === "function" && document.getElementById("shelves")) {
      renderHomeCatalogs();
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
