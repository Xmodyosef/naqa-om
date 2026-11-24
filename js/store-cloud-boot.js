/* After store boot: pull live price/stock/hide from Firestore (public read). */
(function () {
  function run() {
    if (typeof window.naqaBootCloudOverridesForStore === "function") {
      window.naqaBootCloudOverridesForStore();
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(run, 400); });
  } else {
    setTimeout(run, 400);
  }
  /* retry once — store.min may boot late */
  setTimeout(run, 1500);
})();
