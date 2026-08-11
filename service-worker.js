const CACHE_NAME = 'seimei-vb-tracker-v1-4-15d-serve-effect-report-integration-build-20260811';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './vendor/localforage.min.js',
  './vendor/LICENSE-localForage.txt',
  './vendor/jspdf.umd.min.js',
  './vendor/jspdf.plugin.autotable.min.js',
  './fonts/NotoSansJP-Regular.ttf',
  './fonts/NotoSansJP-Bold.ttf',
  './fonts/OFL-NotoSansJP.txt',
  './vendor/LICENSE-jsPDF.txt',
  './vendor/LICENSE-jsPDF-AutoTable.txt',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
