/* Naqa · Firebase (Spark free). Public web keys only — never put a password here.
   Only emails in NAQA_ADMIN_EMAILS may open the admin panel. */
window.NAQA_FIREBASE = {
  apiKey: "AIzaSyAfEuzPkJ5KWzjBBLCoXRUm4YT75BUO6x8",
  authDomain: "naqa-om.firebaseapp.com",
  projectId: "naqa-om",
  storageBucket: "naqa-om.firebasestorage.app",
  messagingSenderId: "177264458224",
  appId: "1:177264458224:web:065f25485b856f6fa14535",
  measurementId: "G-BHTELLKZXB"
};
window.NAQA_ADMIN_EMAILS = [
  "hotmail.yosef@gmail.com"
];
window.naqaFirebaseEnabled = function () {
  var c = window.NAQA_FIREBASE || {};
  return !!(c.apiKey && c.projectId && c.appId);
};
