const CACHE_NAME = "macro-tracker-v4";

// On install, skip waiting immediately
self.addEventListener("install", () => self.skipWaiting());

// On activate, clear ALL old caches and take control
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first strategy: always try network, fall back to cache
self.addEventListener("fetch", (e) => {
  // Only handle GET requests for our own pages
  if (e.request.method !== "GET") return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Cache a copy of the fresh response
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return response;
      })
      .catch(() =>
        // Network failed — serve from cache as fallback
        caches.match(e.request)
      )
  );
});
