const CACHE_NAME = 'drxcode-cache-v2';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/style.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: Pre-cache core files
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  return self.clients.claim();
});

// Fetch: Cache-first, with offline fallback
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const networkFetch = fetch(event.request)
        .then(networkResponse => {
          caches.open(CACHE_NAME).then(cache =>
            cache.put(event.request, networkResponse.clone())
          );
          return networkResponse;
        })
        .catch(() => {
          // If both fail, show offline.html for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          // Else return cached version or nothing
          return cachedResponse;
        });

      // Serve cached immediately, then update silently
      return cachedResponse || networkFetch;
    })
  );
});
