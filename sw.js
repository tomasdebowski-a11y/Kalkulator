// Offline režim pro Bolusový kalkulátor
// Při každé úpravě aplikace zvyšte číslo verze.
const CACHE = 'bolus-v7';
const FILES = ['./', './index.html', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Nejdřív síť (aby se načetla nejnovější verze), při výpadku nebo pomalém spojení uložená kopie.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const network = fetch(e.request).then(r => {
      if (r && r.ok) cache.put(e.request, r.clone());
      return r;
    });
    if (!cached) return network;
    const timeout = new Promise(res => setTimeout(() => res(cached), 3000));
    return Promise.race([network.catch(() => cached), timeout]);
  })());
});
