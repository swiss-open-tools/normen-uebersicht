// Service Worker: App-Dateien cache-first, Daten network-first (damit neue Einträge sofort ankommen,
// offline aber der letzte Stand verfügbar bleibt).
const CACHE = 'normen-uebersicht-v1';
const ASSETS = ['./', 'index.html', 'styles.css', 'js/app.js', 'js/core.js', 'manifest.webmanifest', 'icon.svg', 'data/normen.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const put = (res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res; };
  if (url.pathname.endsWith('/data/normen.json')) {
    e.respondWith(fetch(e.request).then(put).catch(() => caches.match(e.request, { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then(put)));
});
