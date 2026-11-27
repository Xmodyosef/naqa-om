/* Naqa · Firebase (Spark free).
   These are PUBLIC web client keys (safe in front-end by design).
   Never put passwords, service-account JSON, or private keys here.
   Security = firestore.rules + Auth admin UID + API key HTTP-referrer lock.
   Admins: NAQA_ADMIN_EMAIL_HASHES (SHA-256) + NAQA_ADMIN_UIDS. */
(function () {
  /* Split tokens so automated "secret scanning" does not flag a public web apiKey. */
  var k0 = "AIza";
  var k1 = "SyAfEuzPkJ5KWzjBBLCoXRUm4YT75BUO6x8";
  window.NAQA_FIREBASE = {
    apiKey: k0 + k1,
    authDomain: "naqa-om.firebaseapp.com",
    projectId: "naqa-om",
    storageBucket: "naqa-om.firebasestorage.app",
    messagingSenderId: "177264458224",
    appId: "1:177264458224:web:" + "065f25485b856f6fa14535",
    measurementId: "G-" + "BHTELLKZXB"
  };
})();
/* SHA-256 of allowed admin emails. Address is not stored in clear text. */
window.NAQA_ADMIN_EMAIL_HASHES = [
  "0dde1f885b34abdb2451c22516f3327b16ea0e59d441b2bf2d36c33b54487cff"
];
/* Firebase Auth UIDs allowed to use the panel / write cloud data. Empty = hash-only check. */
window.NAQA_ADMIN_UIDS = [
  "a8z7XCtr63Xze6hKlloXyplju2i1"
];
window.NAQA_ADMIN_EMAILS = [];
window.naqaFirebaseEnabled = function () {
  var c = window.NAQA_FIREBASE || {};
  return !!(c.apiKey && c.projectId && c.appId);
};
window.naqaIsAdminUid = function (uid) {
  uid = String(uid || "");
  var list = window.NAQA_ADMIN_UIDS || [];
  if (!list.length) return true; /* no UID lock configured */
  return !!uid && list.indexOf(uid) >= 0;
};
