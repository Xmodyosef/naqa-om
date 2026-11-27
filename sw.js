/* Naqa — retire any old shell cache. No page re-cache. No force-navigate (avoids flash). */
self.addEventListener("install", function (e) {
  self.skipWaiting();
});
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }).then(function () {
      return self.registration.unregister();
    })
  );
});
self.addEventListener("fetch", function () { /* network only */ });
