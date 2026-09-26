/* Reelbook service worker: caches the app shell so it works offline on set. */
const CACHE = 'reelbook-v2';
const ASSETS = [
  './', './index.html', './css/styles.css', './manifest.webmanifest', './icons/icon.svg',
  './js/native.js', './js/data.js', './js/ui.js', './js/store.js', './js/sun.js', './js/components.js',
  './js/views/prep.js', './js/views/roll.js', './js/views/wrap.js', './js/app.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

/* Network first (so updates arrive), falling back to cache when offline. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
