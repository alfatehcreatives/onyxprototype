const CACHE_NAME = 'alfateh_ledger-v2.01.9';
const assets = [
  './',
  './index.html',
  './manifest.json',
  './icon192.png',
  './icon512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(assets)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Sirf http/https requests
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      // Network se fetch karo
      const fetchReq = fetch(e.request).then(res => {
        if (res.status === 200) {
          // YAHAN CLONE USE KAREIN
          const responseClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseClone));
        }
        return res;
      });

      // Agar cache mein hai toh wahan se do, warna network se
      return cachedResponse || fetchReq;
    })
  );
});
