/* Naqa hero: original product photos only, reverse autoplay (180), CSS+JS. */
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
    var curated = (typeof NAQA_BANNER_HEROES !== "undefined" && NAQA_BANNER_HEROES)
      ? (NAQA_BANNER_HEROES[id] || []) : [];
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
      var more = [];
      try { more = catalogList(id, 12) || []; } catch (e) { more = []; }
      more.forEach(function (p) {
        if (candidates.length >= 5 || !p || p.hidden || candidates.some(function (x) { return x.product.id === p.id; })) return;
        var images = typeof pimgs === "function" ? (pimgs(p) || []) : [];
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
      /* Original product photo only — never hero-cutouts */
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
    '<div class="hero-swipe-track is-auto is-rev" id="heroSwipeTrack" tabindex="0" role="group" aria-label="' +
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
  slides.forEach(function (s) {
    s.style.flex = "0 0 100%";
    s.style.width = "100%";
    s.style.minWidth = "100%";
  });
  track.classList.add("is-auto", "is-rev");

  if (!force && root.__naqaHeroUiBound) return;
  root.__naqaHeroUiBound = true;

  var startX = 0, dx = 0, dragging = false, pointerId = null, suppress = 0;

  function n() { return slides.length || 1; }
  function idx() { return Number(root.dataset.naqaIdx || 0) || 0; }
  function hold(ms) {
    root.dataset.naqaHoldUntil = String(Date.now() + (ms || 1800));
    track.classList.add("is-paused");
    clearTimeout(root.__naqaResumeT);
    root.__naqaResumeT = setTimeout(function () {
      track.classList.remove("is-paused");
    }, ms || 1800);
  }
  function setIdx(i, animate) {
    i = ((i % n()) + n()) % n();
    root.dataset.naqaIdx = String(i);
    /* JS drives transform; pause CSS animation while we snap */
    track.classList.add("is-paused");
    track.style.transition = animate ? "transform .45s cubic-bezier(.22,.61,.36,1)" : "none";
    track.style.transform = "translate3d(" + (-i * 100) + "%,0,0)";
    slides.forEach(function (s, j) {
      if (j === i) s.setAttribute("aria-current", "true");
      else s.removeAttribute("aria-current");
    });
  }
  setIdx(idx(), false);

  track.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerId = e.pointerId;
    dragging = true;
    startX = e.clientX;
    dx = 0;
    hold(5000);
    track.style.transition = "none";
    try { track.setPointerCapture(e.pointerId); } catch (err) {}
  }, { passive: true });
  track.addEventListener("pointermove", function (e) {
    if (!dragging || e.pointerId !== pointerId) return;
    dx = e.clientX - startX;
    if (Math.abs(dx) < 3) return;
    var w = root.clientWidth || 1;
    track.style.transform = "translate3d(" + ((-idx() * 100) + (dx / w) * 100) + "%,0,0)";
  }, { passive: true });
  function endDrag(e) {
    if (!dragging) return;
    if (e && pointerId != null && e.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    /* Reverse swipe feel (180): finger right → previous visual still natural */
    if (Math.abs(dx) > 34) {
      suppress = Date.now() + 400;
      setIdx(idx() + (dx < 0 ? 1 : -1), true);
    } else {
      setIdx(idx(), true);
    }
    hold(1600);
    dx = 0;
  }
  track.addEventListener("pointerup", endDrag, { passive: true });
  track.addEventListener("pointercancel", endDrag, { passive: true });
  track.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); setIdx(idx() + 1, true); hold(1600); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setIdx(idx() - 1, true); hold(1600); }
  });
  track.addEventListener("click", function (e) {
    if (Date.now() < suppress) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  root.__naqaSetIdx = setIdx;
  root.__naqaHold = hold;
}
window.__naqaBindHeroEnhanced = __naqaBindHeroEnhanced;
function bindHeroSwipe(force) { __naqaBindHeroEnhanced(force); }

/* Forever autoplay — reverse direction (180°). Survives re-renders. */
(function naqaHeroAutoForever() {
  if (window.__naqaHeroAutoForever) return;
  window.__naqaHeroAutoForever = true;

  function tick() {
    try {
      var root = document.getElementById("heroSwipe");
      var track = document.getElementById("heroSwipeTrack");
      if (!root || !track) return;
      if (root.hidden) {
        /* Only stay parked off-home; unhide if slides exist on home */
        if (track.querySelector(".hero-slide") && document.body.classList.contains("home-photo")) {
          root.hidden = false;
          root.removeAttribute("aria-hidden");
        } else {
          return;
        }
      }
      if (document.hidden) return;
      var holdUntil = Number(root.dataset.naqaHoldUntil || 0);
      if (Date.now() < holdUntil) return;

      var slides = track.querySelectorAll(".hero-slide");
      var count = slides.length;
      if (count < 2) return;

      track.style.display = "flex";
      track.style.width = "100%";
      Array.prototype.forEach.call(slides, function (s) {
        s.style.flex = "0 0 100%";
        s.style.minWidth = "100%";
        s.style.width = "100%";
      });

      /* 180: step backward through the strip */
      var i = Number(root.dataset.naqaIdx || 0) || 0;
      i = (i - 1 + count) % count;
      root.dataset.naqaIdx = String(i);
      track.classList.add("is-paused"); /* JS owns the transform during step */
      track.style.transition = "transform .45s cubic-bezier(.22,.61,.36,1)";
      track.style.transform = "translate3d(" + (-i * 100) + "%,0,0)";
      Array.prototype.forEach.call(slides, function (s, j) {
        if (j === i) s.setAttribute("aria-current", "true");
        else s.removeAttribute("aria-current");
      });
    } catch (e) {}
  }

  setInterval(tick, 2800);
  setTimeout(tick, 2200);
  setTimeout(tick, 5000);
  setTimeout(tick, 8000);
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
  setTimeout(function () { go(false); }, 1000);
})();
