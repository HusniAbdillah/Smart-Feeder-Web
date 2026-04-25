const CACHE_NAME = "smart-feeder-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/1.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  // We don't cache API calls to ThingSpeak to avoid stale real-time data
  if (event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchRes) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Cache newly fetched assets
          if (event.request.method === "GET") {
            cache.put(event.request.url, fetchRes.clone());
          }
          return fetchRes;
        });
      });
    }).catch(() => {
      // Offline fallback for navigation
      if (event.request.mode === "navigate") {
        return caches.match("/");
      }
    })
  );
});
