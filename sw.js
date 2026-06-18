const CACHE_NAME = "agrolinc-v1";

const urlsToCache = [
  "./",
  "./index.html",
  "./agroideas.html",
  "./blog.html",
  "./ruta.html",
  "./css/index.css",
  "./js/map.js",
  "./js/data.js",
  "./js/agroideas.js",
  "./js/blog.js",
  "./js/index.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});