/* Naqa scroll lock — stops background/body scroll under modals (iOS scroll bleed) */
(function (w) {
  "use strict";
  var depth = 0;
  var y = 0;
  var touchGuard = null;

  function isScrollableTarget(el) {
    var node = el;
    while (node && node !== document.body && node !== document.documentElement) {
      if (node.nodeType === 1) {
        var st = w.getComputedStyle(node);
        var oy = st.overflowY;
        if ((oy === "auto" || oy === "scroll" || oy === "overlay") && node.scrollHeight > node.clientHeight + 1) {
          return true;
        }
        if (node.classList && (
          node.classList.contains("modal-card") ||
          node.classList.contains("drawer-body") ||
          node.classList.contains("sheet-card") ||
          node.classList.contains("carousel-track") ||
          node.id === "sheetCard" ||
          node.id === "cartBody" ||
          node.id === "quizBody"
        )) return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  function onTouchMove(e) {
    if (!depth) return;
    if (isScrollableTarget(e.target)) return;
    e.preventDefault();
  }

  function lock() {
    if (depth === 0) {
      y = w.scrollY || document.documentElement.scrollTop || 0;
      document.documentElement.classList.add("naqa-scroll-lock");
      document.body.classList.add("naqa-scroll-lock");
      document.body.style.position = "fixed";
      document.body.style.top = -y + "px";
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      if (!touchGuard) {
        touchGuard = onTouchMove;
        document.addEventListener("touchmove", touchGuard, { passive: false });
      }
    }
    depth++;
  }

  function unlock() {
    if (depth === 0) return;
    depth--;
    if (depth === 0) {
      document.documentElement.classList.remove("naqa-scroll-lock");
      document.body.classList.remove("naqa-scroll-lock");
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (touchGuard) {
        document.removeEventListener("touchmove", touchGuard);
        touchGuard = null;
      }
      w.scrollTo(0, y);
    }
  }

  function forceUnlock() {
    depth = 1;
    unlock();
    depth = 0;
  }

  w.naqaScrollLock = { lock: lock, unlock: unlock, forceUnlock: forceUnlock, depth: function () { return depth; } };
})(window);
