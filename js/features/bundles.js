var BUNDLES = [
  { id: "b-oily", ar: "روتين البشرة الدهنية", en: "Oily skin routine", concern: "oily", cat: "عناية", need: "oily", n: 4 },
  { id: "b-glow", ar: "باقة الإشراقة", en: "Glow set", concern: "spot", cat: "عناية", need: "spot", n: 4 },
  { id: "b-sens", ar: "عناية حساسة", en: "Sensitive care", concern: "sens", cat: "عناية", need: "sens", n: 4 },
  { id: "b-lips", ar: "إطلالة شفاه", en: "Lips look", concern: "", cat: "شفاه", need: "", n: 3 }
];

function buildBundleItems(b) {
  return products.filter(function (p) {
    if (b.cat && p.cat !== b.cat) return false;
    if (b.need && !(p.concerns && p.concerns.indexOf(b.need) >= 0)) return false;
    return true;
  }).slice(0, b.n);
}

function renderBundles() {
  var el = $("#bundles"); if (!el) return;
  if (query || currentCat !== "all" || currentBrand || currentConcern || wishView) { el.hidden = true; return; }
  el.hidden = false;
  var title = lang === "en" ? "Ready sets" : "باقات جاهزة";
  var html = '<div class="brands-head"><h3>' + title + "</h3></div><div class=\"bundle-row\">";
  BUNDLES.forEach(function (b) {
    var items = buildBundleItems(b);
    if (items.length < 2) return;
    var sum = items.reduce(function (s, p) { return s + p.price; }, 0);
    var name = lang === "en" ? b.en : b.ar;
    var thumbs = items.slice(0, 3).map(function (p) {
      var imgs = pimgs(p);
      return imgs[0] ? '<img src="' + imgs[0] + '" alt="' + esc(pname(p)) + '" loading="lazy">' : "<span>" + (p.em || "✨") + "</span>";
    }).join("");
    html += '<div class="bundle-card">'
      + '<div class="bundle-thumbs">' + thumbs + "</div>"
      + "<b>" + esc(name) + "</b>"
      + '<span class="bundle-meta">' + items.length + (lang === "en" ? " items · " : " منتجات · ") + money(sum) + "</span>"
      + '<div class="bundle-actions">'
      + '<button type="button" class="btn-add" data-bundle="' + b.id + '">' + (lang === "en" ? "Add set" : "أضيفي الباقة") + "</button>"
      + '<button type="button" class="btn-qv" data-concern-go="' + (b.concern || "") + '">' + (lang === "en" ? "Browse" : "تصفّحي") + "</button>"
      + "</div></div>";
  });
  html += "</div>";
  el.innerHTML = html;
}

function addBundle(id) {
  var b = BUNDLES.find(function (x) { return x.id === id; }); if (!b) return;
  buildBundleItems(b).forEach(function (p) { addToCart(p.id, 1, true); });
  if (typeof toast === "function") toast(lang === "en" ? "Set added" : "انضافت الباقة");
  openCart();
}

function renderTrust() {
  var el = $("#trustRow"); if (!el) return;
  var items = lang === "en"
    ? [["✓", "100% authentic"], ["🇴🇲", "Oman delivery"], ["💬", "WhatsApp order"], ["🚚", "Free ship over 30 OMR"], ["✨", "Skin quiz"]]
    : [["✓", "أصلي ١٠٠٪"], ["🇴🇲", "توصيل عُمان"], ["💬", "طلب واتساب"], ["🚚", "مجاني فوق ٣٠ ر.ع"], ["✨", "اختبار بشرة"]];
  el.innerHTML = items.map(function (x) {
    return '<div class="trust-item"><b>' + x[0] + "</b><span>" + x[1] + "</span></div>";
  }).join("");
}

function reviewHTML(p) {
  return "";
}

