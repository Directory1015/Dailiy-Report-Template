// sw.js — cache static assets and enable offline
const CACHE = 'dsr-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/comet.png'
  // add more files here if you split CSS/JS later
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for listed assets; network-first for everything else
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const isAsset = ASSETS.some(p => url.pathname.endsWith(p.replace('./','/')));
  if (isAsset) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  } else {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
