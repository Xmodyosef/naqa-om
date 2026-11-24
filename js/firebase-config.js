/* Naqa · Firebase (free Spark). Fill after creating the project.
   Empty apiKey = keep device PIN only. Never put the account password here. */
window.NAQA_FIREBASE = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
window.naqaFirebaseEnabled = function () {
  var c = window.NAQA_FIREBASE || {};
  return !!(c.apiKey && c.projectId && c.appId);
};
