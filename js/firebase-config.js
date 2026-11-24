/* Naqa · Firebase (free Spark).
   Empty apiKey = keep the device PIN.
   Never put a password here.
   NAQA_ADMIN_EMAILS: only these emails may open the panel.
   Anyone else who signs in with Google is signed out immediately. */
window.NAQA_FIREBASE = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
window.NAQA_ADMIN_EMAILS = [
  /* "you@gmail.com" */
];
window.naqaFirebaseEnabled = function () {
  var c = window.NAQA_FIREBASE || {};
  return !!(c.apiKey && c.projectId && c.appId);
};
