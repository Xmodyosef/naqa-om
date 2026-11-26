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


function refreshFaqLang() {
  var en = lang === "en";
  var t = document.getElementById("faqTitle");
  var lead = document.querySelector("#faqHome .faq-lead");
  if (t) t.textContent = en ? "FAQ" : "أسئلة شائعة";
  if (lead) lead.textContent = en
    ? "Quick answers before you order — authenticity, delivery, WhatsApp, and VAT."
    : "إجابات سريعة قبل الطلب — أصالة، توصيل، واتساب، والضريبة.";
  var items = document.querySelectorAll("#faqHome .faq-item");
  var ar = [
    ["هل المنتجات أصلية؟", "نعم. نقاء يبيع منتجات عناية ومكياج أصلية من ماركات معروفة، مع وصف واستخدام واضح لكل منتج."],
    ["هل يوجد توصيل داخل عُمان؟", "نعم. التوصيل لجميع ولايات السلطنة. فوق ٣٠ ر.ع شحن مجاني، وتحت ذلك رسوم ٢ ر.ع."],
    ["كيف أطلب؟", "أضيفي للسلة وأكملي الطلب، أو تواصلي واتساب لإتمام الطلب خلال دقائق."],
    ["هل الأسعار شاملة الضريبة؟", "نعم. الأسعار شاملة ضريبة القيمة المضافة ٥٪."],
    ["هل يتوفر الدفع عند الاستلام؟", "نعم. الدفع عند الاستلام متاح، مع خيار التحويل البنكي عند تفعيله."]
  ];
  var enQ = [
    ["Are products authentic?", "Yes. Naqa sells authentic skincare and makeup from known brands, with clear description and usage for each product."],
    ["Do you deliver in Oman?", "Yes. Delivery covers all governorates. Free shipping over 30 OMR; 2 OMR fee under that."],
    ["How do I order?", "Add items to cart and checkout, or message us on WhatsApp to finish in minutes."],
    ["Are prices VAT-inclusive?", "Yes. Displayed prices include 5% VAT."],
    ["Is cash on delivery available?", "Yes. Cash on delivery is available, plus bank transfer when enabled."]
  ];
  var src = en ? enQ : ar;
  items.forEach(function (el, i) {
    if (!src[i]) return;
    var s = el.querySelector("summary");
    var p = el.querySelector("p");
    if (s) s.textContent = src[i][0];
    if (p) p.textContent = src[i][1];
  });
}
function refreshSocialProof() {
  var en = lang === "en";
  var map = en
    ? { spProducts: ["products", "Authentic products"], spBrands: ["brands", "Brands"], spShip: ["Oman", "Delivery nationwide"], spOrder: ["WhatsApp", "Order in minutes"] }
    : { spProducts: ["منتج أصلي", null], spBrands: ["ماركة", null], spShip: ["عُمان", "توصيل لكل الولايات"], spOrder: ["واتساب", "طلب خلال دقائق"] };
  // keep numeric b/counts; only update span labels
  try {
    var root = document.getElementById("socialProof"); if (!root) return;
    var spans = root.querySelectorAll(".sp-item span");
    var labels = en
      ? ["Authentic products", "Brands", "Delivery nationwide", "Order in minutes"]
      : ["منتج أصلي", "ماركة", "توصيل لكل الولايات", "طلب خلال دقائق"];
    spans.forEach(function (s, i) { if (labels[i]) s.textContent = labels[i]; });
    var chips = document.querySelectorAll("#offersBar .offer-chip");
    if (chips.length >= 4) {
      if (en) {
        chips[0].textContent = "% Deals & offers";
        chips[1].textContent = "★ Bestsellers";
        chips[2].textContent = "Under 10 OMR";
        chips[3].textContent = "🌸 K-beauty";
      } else {
        chips[0].textContent = "٪ عروض وتخفيضات";
        chips[1].textContent = "★ الأكثر طلباً";
        chips[2].textContent = "تحت ١٠ ر.ع";
        chips[3].textContent = "🌸 عناية كورية";
      }
    }
  } catch (e) {}
}

function renderTrust() {
  var el = $("#trustRow"); if (!el) return;
  var items = lang === "en"
    ? [["✓", "100% authentic"], ["🇴🇲", "Oman delivery"], ["💬", "WhatsApp order"], ["🚚", "Free ship over 30 OMR"], ["⭐", "Real reviews"], ["✨", "Skin quiz"]]
    : [["✓", "أصلي ١٠٠٪"], ["🇴🇲", "توصيل عُمان"], ["💬", "طلب واتساب"], ["🚚", "مجاني فوق ٣٠ ر.ع"], ["⭐", "تقييمات حقيقية"], ["✨", "اختبار بشرة"]];
  el.innerHTML = items.map(function (x) {
    return '<div class="trust-item"><b>' + x[0] + "</b><span>" + x[1] + "</span></div>";
  }).join("");
  // social proof counts
  try {
    var n = (typeof products !== "undefined" && products) ? products.filter(function(p){return !p.hidden;}).length : 0;
    var brands = {};
    if (n) products.forEach(function(p){ if(p.brand) brands[p.brand]=1; });
    var bc = Object.keys(brands).length;
    var spP = document.getElementById("spProducts");
    var spB = document.getElementById("spBrands");
    if (spP && n) spP.textContent = "+" + n;
    if (spB && bc) spB.textContent = "+" + bc;
  } catch (e) {}
}

/* reviewHTML: use js/features/reviews.js */

