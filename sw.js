// Offline režim pro Bolusový kalkulátor
// Při každé úpravě aplikace zvyšte číslo verze.
const CACHE = 'bolus-v27';
const FILES = ['./', './index.html', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'no-cache' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Rychlé otevření: aplikace se ukáže hned z uložené kopie a na pozadí se stáhne čerstvá.
// Nová verze aplikace se nainstaluje sama (změna tohoto souboru) a stránka se po ní jednou obnoví.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Jen vlastní soubory aplikace. Data ze sledování (Firebase) jdou vždy přímo ze sítě.
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const network = fetch(new Request(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }))
      .then(r => { if (r && r.ok) cache.put(e.request, r.clone()); return r; });
    if (cached) { e.waitUntil(network.catch(() => {})); return cached; }
    return network;
  })());
});
