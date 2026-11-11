// Service Worker（contracts/service-worker.md、ADR 0003）。配布物を先に取っておいて返すことと、配り直した版に切り替わることだけをする。
const VERSION = '{{BUILD_VERSION}}';
const FILES = [/* {{FILES}} */];
const PREFIX = 'kyounoitte-';
const CACHE = PREFIX + VERSION;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES.map((url) => new Request(url, { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope);
  if (!url.pathname.startsWith(scope.pathname)) return;
  if (request.mode === 'navigate') {
    const index = new URL('./index.html', self.registration.scope).href;
    event.respondWith(
      caches
        .open(CACHE)
        .then((cache) => cache.match(index))
        .then((response) => response || fetch(request)),
    );
    return;
  }
  event.respondWith(
    caches
      .open(CACHE)
      .then((cache) => cache.match(request, { ignoreSearch: true }))
      .then((response) => response || fetch(request)),
  );
});
