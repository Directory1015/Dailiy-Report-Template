// sw.js v9
var CACHE = 'dsr-v9';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/comet.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }));
  self.skipWaiting();
});
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});
self.addEventListener('fetch', function(e){
  var url = new URL(e.request.url);
  var matchList = ASSETS.concat(['./']).map(function(p){ return p.replace('./','/'); });
  var isAsset = matchList.some(function(p){ return url.pathname.endsWith(p); });
  if (isAsset) {
    e.respondWith(caches.match(e.request).then(function(r){ return r || fetch(e.request); }));
  } else {
    e.respondWith(
      fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return res;
      }).catch(function(){ return caches.match(e.request); })
    );
  }
});
