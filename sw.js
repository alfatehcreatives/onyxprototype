const CACHE_NAME = 'onyxpos-v5';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(['./', './index.html'])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null))),
    self.clients.claim()
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchReq = fetch(e.request).then((res) => {
        if (res.status === 200) {
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, res.clone()));
        }
        return res;
      });
      return cached || fetchReq;
    })
  );
});
