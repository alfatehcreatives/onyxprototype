// --- ONYXPOS SERVICE WORKER ARCHITECTURE ---
const CACHE_NAME = 'onyxpos-cache-v4';

// Assets required for absolute offline standalone operation
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap',
  'https://fonts.gstatic.com/s/plusjakartasans/v8/L0x5DFM85vpxU99R3_vVfT91pW8.woff2',
  'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQ0SJI898O547008U-7521yE.woff2'
];

// 1. INSTALLATION EVENT: Pre-cache core shells and premium assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        // Force immediate activation to take control of open tabs
        return self.skipWaiting();
      })
  );
});

// 2. ACTIVATION EVENT: Wipe stale caches when deploying updates
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Instantly claim clients so the page doesn't require a reload to work offline
      return self.clients.claim();
    })
  );
});

// 3. FETCH EVENT: Cache-first fallback to Network strategy (Optimal for offline-centric webapps)
self.addEventListener('fetch', (event) => {
  // Only intercept HTTP/HTTPS requests (ignores browser extensions like chrome-extension://)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache immediately
        // Also fetch from network in background to silently update cache (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => { /* Silent network failure is expected offline */ });
          
        return cachedResponse;
      }

      // If not in cache, fallback to live network fetch
      return fetch(event.request)
        .then((response) => {
          // If response is valid, save a clone to the cache database dynamically
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Absolute offline fallback for html page navigation
          if (event.request.mode === 'navigate') {
            return caches.match('./onyx.html');
          }
        });
    })
  );
});

// 4. CLIENT NOTIFICATIONS SYSTEM: Receive messages from page shell
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});