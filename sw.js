const cacheName = 'onyxPOS-v1.0,1';
const assets = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install & Cache Assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(assets))
  );
  self.skipWaiting();
});

// Cleanup Old Caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== cacheName).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

// Fetch Strategy: Network falling back to Cache (Best for PWAs)
self.addEventListener('fetch', e => {
  // Sirf http/https requests handle karne ke liye (chrome-extension aur local files skip karne ke liye)
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        // Agar network sahi chal raha hai, toh cache update karo
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(cacheName).then(cache => cache.put(e.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Agar network fail ho (offline ho), toh cache se do
        return caches.match(e.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Agar page cache mein bhi nahi hai (pheli baar khol rahe offline mein)
          if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
