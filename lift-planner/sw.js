/* Service worker: keeps a copy of the whole app on the phone so it opens with
 * no signal, and uploads saved jobs when a connection comes back.
 * Change VERSION on every release so phones pick up the new files. */
const VERSION = 'v1.0.0';
const CACHE = 'lift-planner-' + VERSION;
const ASSETS = [
  './',
  'index.html',
  'app.css',
  'manifest.webmanifest',
  'js/db.js',
  'js/calc.js',
  'js/model.js',
  'js/sync.js',
  'js/markup.js',
  'js/report.js',
  'js/app.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

importScripts('js/db.js', 'js/sync.js');

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('lift-planner-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

// Offline first: answer from the saved copy, use the network only for anything not saved.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(caches.match('index.html', { cacheName: CACHE }).then((r) => r || fetch(req)));
    return;
  }
  event.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
});

// Android Chrome fires this when the phone is back online, even if the app is closed.
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-jobs') event.waitUntil(self.LiftSync.syncAll());
});
