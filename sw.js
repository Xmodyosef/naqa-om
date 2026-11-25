/* Naqa — retire the old shell cache. Do not cache pages again. */
self.addEventListener("install", function (e) {
  self.skipWaiting();
});
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }).then(function () {
      return self.registration.unregister();
    }).then(function () {
      return self.clients.matchAll({ type: "window" });
    }).then(function (clients) {
      clients.forEach(function (c) {
        if (c.url && c.navigate) c.navigate(c.url);
      });
    })
  );
});
self.addEventListener("fetch", function () {});
