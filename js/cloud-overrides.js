/* Naqa · product overrides via Firebase Firestore (no GitHub token).
   Doc: naqa/overrides  { map: { "123": { price, stock, hidden, ... } }, updatedAt }
   Rules: public read; write only when signed in (admin). */
(function (w) {
  "use strict";

  var DOC_PATH = { col: "naqa", id: "overrides" };
  /* Firestore soft limit ~1 MiB/doc. Base64 photos in overrides blow this. */
  var MAX_DOC_CHARS = 900000;

  function fs() {
    try {
      if (!w.firebase || !firebase.apps || !firebase.apps.length) return null;
      if (!firebase.firestore) return null;
      return firebase.firestore();
    } catch (e) {
      return null;
    }
  }

  function ensureApp() {
    try {
      if (!w.NAQA_FIREBASE) return false;
      if (!w.firebase || !firebase.apps) return false;
      if (!firebase.apps.length) firebase.initializeApp(w.NAQA_FIREBASE);
      return true;
    } catch (e) {
      return false;
    }
  }

  function currentUser() {
    try {
      if (!firebase.auth) return null;
      return firebase.auth().currentUser || null;
    } catch (e) {
      return null;
    }
  }

  /** Keep only fields safe for public cloud doc (no data:image, no huge blobs). */
  function sanitizeMap(map) {
    var out = {};
    if (!map || typeof map !== "object") return out;
    Object.keys(map).forEach(function (id) {
      var o = map[id];
      if (!o || typeof o !== "object") return;
      var n = {};
      Object.keys(o).forEach(function (k) {
        var v = o[k];
        if (v === undefined || v === null || v === "") return;
        if (typeof v === "function") return;
        if (k === "imgs") {
          if (!Array.isArray(v)) return;
          var urls = v.filter(function (u) {
            return typeof u === "string" && /^https?:\/\//i.test(u.trim());
          }).map(function (u) { return u.trim(); }).slice(0, 5);
          if (urls.length) n.imgs = urls;
          return;
        }
        if (typeof v === "number" && !isFinite(v)) return;
        if (typeof v === "boolean" || typeof v === "number" || typeof v === "string") {
          n[k] = v;
          return;
        }
        /* skip nested objects/arrays except simple primitives above */
      });
      if (Object.keys(n).length) out[String(id)] = n;
    });
    return out;
  }

  function errText(err) {
    if (!err) return "unknown";
    var code = err.code || "";
    var msg = err.message || String(err);
    if (code) return code + (msg ? ": " + msg : "");
    return msg || "unknown";
  }

  /** Load overrides map from cloud → Promise<object|null> */
  w.naqaLoadCloudOverrides = function () {
    if (!ensureApp()) return Promise.resolve(null);
    var db = fs();
    if (!db) return Promise.resolve(null);
    return db.collection(DOC_PATH.col).doc(DOC_PATH.id).get().then(function (snap) {
      if (!snap.exists) return {};
      var d = snap.data() || {};
      var map = d.map || d.data || d.overrides || {};
      return (map && typeof map === "object") ? map : {};
    }).catch(function () { return null; });
  };

  /** Save full overrides map (admin, must be signed in) */
  w.naqaSaveCloudOverrides = function (map) {
    if (!ensureApp()) return Promise.reject(new Error("no-firebase"));
    var db = fs();
    if (!db) return Promise.reject(new Error("no-firestore"));
    var user = currentUser();
    if (!user) return Promise.reject(new Error("not-signed-in"));

    var clean = sanitizeMap(map);
    var payload = {
      map: clean,
      updatedAt: Date.now(),
      updatedBy: String(user.uid || "")
    };
    if (!payload.updatedBy) return Promise.reject(new Error("not-signed-in"));

    var size = 0;
    try { size = JSON.stringify(payload).length; } catch (e) {
      return Promise.reject(new Error("bad-map"));
    }
    if (size > MAX_DOC_CHARS) {
      return Promise.reject(new Error("too-large:" + size));
    }

    /* Refresh token then write — avoids stale auth edge cases */
    return user.getIdToken(true).then(function () {
      try {
        if (firebase.firestore.FieldValue && firebase.firestore.FieldValue.serverTimestamp) {
          payload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        }
      } catch (e) {}
      return db.collection(DOC_PATH.col).doc(DOC_PATH.id).set(payload, { merge: false });
    });
  };

  /* —— Admin hooks —— */
  var A = w.NaqaAdmin = w.NaqaAdmin || {};

  A.loadOverridesCloud = function () {
    return w.naqaLoadCloudOverrides().then(function (map) {
      if (!map) return false;
      /* Cloud wins for shared fields; keep local data:image imgs if present */
      var local = A.overrides || {};
      var merged = Object.assign({}, map);
      Object.keys(local).forEach(function (id) {
        var L = local[id];
        var C = merged[id];
        if (!L) return;
        if (L.imgs && Array.isArray(L.imgs) && L.imgs.some(function (u) {
          return typeof u === "string" && u.indexOf("data:image") === 0;
        })) {
          merged[id] = Object.assign({}, C || {}, L);
        }
      });
      A.overrides = merged;
      try { localStorage.setItem(A.KEY || "naqa_overrides", JSON.stringify(A.overrides)); } catch (e) {}
      return true;
    }).catch(function () { return false; });
  };

  A.syncOverridesCloud = function () {
    if (A.requireAuth && !A.requireAuth("status")) {
      return Promise.resolve(false);
    }
    var map = A.overrides || {};
    try { localStorage.setItem(A.KEY || "naqa_overrides", JSON.stringify(map)); } catch (e) {}

    return w.naqaSaveCloudOverrides(map).then(function () {
      if (A.setMsg) A.setMsg("status", A.lang === "en" ? "Saved to your account ✓" : "انحفظ على حسابك ✓");
      return true;
    }).catch(function (err) {
      var code = (err && err.message) || "";
      var fcode = (err && err.code) || "";
      var ar = A.lang !== "en";
      var detail = errText(err);
      try { console.warn("[naqa] cloud sync failed", err); } catch (e) {}

      if (code === "not-signed-in" || fcode === "permission-denied" && !currentUser()) {
        if (A.setMsg) A.setMsg("status", ar ? "ادخلي بحسابك أولاً." : "Sign in first.");
      } else if (code === "no-firestore" || code === "no-firebase") {
        if (A.setMsg) A.setMsg("status", ar
          ? "انحفظ على الجهاز. فعّلي Firestore لاحقاً للمزامنة."
          : "Saved on device. Enable Firestore for sync.");
      } else if (code.indexOf("too-large") === 0) {
        if (A.setMsg) A.setMsg("status", ar
          ? "انحفظ على الجهاز. الصور المرفوعة كبيرة للمزامنة — استخدمي روابط صور (https) بدل الرفع المحلي."
          : "Saved on device. Local photos are too large for cloud — use https image URLs.");
      } else if (fcode === "permission-denied") {
        if (A.setMsg) A.setMsg("status", ar
          ? "انحفظ على الجهاز. Firestore رفض الكتابة (قواعد/صلاحية). تأكدي من نشر Rules وأنكِ مسجّلة دخول."
          : "Saved on device. Firestore permission denied — check Rules + sign-in.");
      } else if (fcode === "unavailable" || fcode === "deadline-exceeded") {
        if (A.setMsg) A.setMsg("status", ar
          ? "انحفظ على الجهاز. الشبكة أو Firestore غير متاحين مؤقتاً."
          : "Saved on device. Network/Firestore temporarily unavailable.");
      } else {
        if (A.setMsg) A.setMsg("status", ar
          ? "انحفظ على الجهاز (المزامنة فشلت: " + (fcode || code || "خطأ") + ")."
          : "Saved on device (cloud failed: " + (fcode || code || "error") + ").");
      }
      try { if (A._lastCloudErr !== undefined) A._lastCloudErr = detail; } catch (e) {}
      return false;
    });
  };

  /* Replace GitHub publish with cloud save */
  A.publishLive = function () {
    return A.syncOverridesCloud();
  };
  A.publish = function () {
    if (A.editingId != null && document.getElementById("editView") && !document.getElementById("editView").hidden && A.saveEdit) {
      A.saveEdit({ skipPublish: true });
    }
    try { localStorage.setItem(A.KEY || "naqa_overrides", JSON.stringify(A.overrides || {})); } catch (e) {}
    if (A.saveOrders) A.saveOrders();
    return A.syncOverridesCloud().then(function (ok) {
      if (A.setMsg) {
        A.setMsg("settingsStatus", ok
          ? (A.lang === "en" ? "Synced to account ✓" : "تمت المزامنة مع الحساب ✓")
          : (A.lang === "en" ? "Saved on this device" : "انحفظ على هذا الجهاز"));
      }
    });
  };

  /* Storefront: apply cloud overrides after boot */
  w.naqaBootCloudOverridesForStore = function () {
    if (typeof mergeOverrides !== "function") return;
    w.naqaLoadCloudOverrides().then(function (map) {
      if (!map || !Object.keys(map).length) return;
      try {
        mergeOverrides(map);
        if (typeof render === "function") render();
      } catch (e) {}
    });
  };
})(window);
