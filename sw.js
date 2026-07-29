const VERSION = '3.1.5d';
const BUILD = '2026.07.29.01';
const CACHE_NAME = 'cue-timer-v3-1-5d';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
];
const OPTIONAL_ASSETS = [
  './cue_timer_v3_1_5d_program_only_presets.html',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        await cache.addAll(CORE_ASSETS.map(url => new Request(url, {cache:'reload'})));
        await Promise.allSettled(OPTIONAL_ASSETS.map(async url => {
          const request = new Request(url, {cache:'reload'});
          const response = await fetch(request);
          if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
          await cache.put(request, response);
        }));
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => (key.startsWith('seimei-program-timer-') || key.startsWith('cue-timer-')) && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'GET_VERSION' && event.ports?.[0]) {
    event.ports[0].postMessage({version:VERSION, build:BUILD, cacheName:CACHE_NAME});
  }
  if (event.data?.type === 'CLEAR_CACHES') {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))));
  }
});

async function networkFirst(request){
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, {cache:'no-store'});
    if (response?.ok) cache.put(request, response.clone());
    return markResponseSource(response, 'network');
  } catch (error) {
    const fallback=(await caches.match(request)) || (await caches.match('./index.html'));
    return fallback ? markResponseSource(fallback, 'cache') : Response.error();
  }
}

function markResponseSource(response, source){
  const headers=new Headers(response.headers);
  headers.set('X-CueTimer-Source',source);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

async function cacheFirst(request){
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response?.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  if (request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/cue_timer_v3_1_5d_program_only_presets.html')) {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(cacheFirst(request));
});
