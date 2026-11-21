function featuresBoot() {
  tagConcerns();
  renderTrust();
  renderConcernBar();
  renderBrandsGrid();
  renderBundles();
  var n = wishlist.length, wb = $("#wishBadge");
  if (wb) { wb.hidden = !n; wb.textContent = n; }
}

document.addEventListener("click", function (e) {
  if (e.target.closest("#heroQuiz") || e.target.closest("#openQuizBtn")) {
    e.preventDefault();
    openQuiz();
    return;
  }
  if (e.target.closest("#quizBackdrop") || e.target.closest("#quizClose") || e.target.closest("#quizClose2")) {
    closeQuiz();
    return;
  }
  var opt = e.target.closest(".quiz-opt");
  if (opt && opt.dataset && opt.dataset.qkey) {
    quizAns[opt.dataset.qkey] = opt.dataset.qval;
    quizStep += 1;
    paintQuiz();
    return;
  }
  var qp = e.target.closest(".quiz-p");
  if (qp && qp.dataset.open) {
    closeQuiz();
    if (typeof openSheet === "function") openSheet(+qp.dataset.open, "full");
    return;
  }
  if (e.target.closest("#quizApply")) {
    closeQuiz();
    var prod = $("#products");
    if (prod) prod.scrollIntoView({ behavior: "smooth" });
    return;
  }
  var idsBtn = e.target.closest("[data-add-ids]");
  if (idsBtn) {
    idsBtn.getAttribute("data-add-ids").split(",").forEach(function (id) {
      if (id) addToCart(+id, 1, true);
    });
    if (typeof toast === "function") toast(lang === "en" ? "Routine added" : "انضاف الروتين");
    return;
  }
  var step = e.target.closest(".routine [data-open]");
  if (step) {
    closeQuiz();
    if (typeof openSheet === "function") openSheet(+step.getAttribute("data-open"), "full");
    return;
  }
  var price = e.target.closest("#priceBar [data-price]");
  if (price) {
    currentPrice = price.getAttribute("data-price") || "all";
    render();
    return;
  }
  var chip = e.target.closest("#concernBar [data-concern]");
  if (chip) {
    currentConcern = chip.getAttribute("data-concern") || "";
    render();
    return;
  }
  var go = e.target.closest("[data-concern-go]");
  if (go) {
    currentConcern = go.getAttribute("data-concern-go") || "";
    currentCat = "all";
    render();
    var prod2 = $("#products");
    if (prod2) prod2.scrollIntoView({ behavior: "smooth" });
    return;
  }
  var bundle = e.target.closest("[data-bundle]");
  if (bundle) addBundle(bundle.getAttribute("data-bundle"));
});
