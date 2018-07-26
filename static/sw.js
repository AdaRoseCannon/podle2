//This is the service worker with the combined offline experience (Offline page + Offline copy of pages)

const cacheName = 'pwabuilder-offline-v1.1';

const cacheOrigins = new Set([
  'https://feed-service.ada.is'
]);

//Install stage sets up the offline page in the cache and opens a new cache
self.addEventListener('install', function(event) {
  event.waitUntil(preLoad());
});

var preLoad = function(){
  console.log('[PWA Builder] Install Event processing');
  return caches.open(cacheName).then(function(cache) {
    console.log('[PWA Builder] Cached index and offline page during Install');
    return cache.addAll(['/index.html']);
  });
}

self.addEventListener('fetch', function(event) {
  const promise = cacheFirstOrFetchAndCache(event.request);
  event.respondWith(promise);
  event.waitUntil(promise);
});

async function cacheFirstOrFetchAndCache(request) {
  const cache = await caches.open(cacheName);
  const matching = await cache.match(request);
  if(matching && matching.status < 400) {
    console.log('[PWA Builder] page from cache '+request.url)
    return matching;
  }
  const response = await fetch(request);
  if(response.status < 400 &&
     (response.headers.get('content-type') || '').match(/^application\/json/) &&
     cacheOrigins.has(new URL(request.url).origin)
  ) {
    console.log('[PWA Builder] add page to offline '+response.url)
    cache.put(request, response.clone());
  }
  return response;
}
