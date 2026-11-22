/* Naqa lightweight service worker — cache shell only */
const CACHE = 'naqa-shell-v20261123u';
const SHELL = [
  './',
  './index.html',
  './css/store.min.css?v=20261123u',
  './js/store.min.js?v=20261123u',
  './data/products.min.js?v=20261123u',
  './logo.svg',
  './manifest.webmanifest',
  './media/icons/icon-192.png',
  './media/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // network-first for HTML navigations
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // cache-first for static assets
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => hit);
    })
  );
});
