/* Service Worker for Productivity Hub */
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `phub-${CACHE_VERSION}`;
const CORE_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/logo.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// HTML navigation fallback: network → cache → offline.html
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone()).catch(()=>{});
        return fresh;
      } catch (_) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(req)) || (await cache.match('./index.html')) || (await cache.match('./offline.html'));
      }
    })());
    return;
  }

  // Assets: cache-first, then network fallback with runtime put
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      cache.put(req, fresh.clone()).catch(()=>{});
      return fresh;
    } catch (_) {
      return new Response('', { status: 504, statusText: 'offline' });
    }
  })());
});

