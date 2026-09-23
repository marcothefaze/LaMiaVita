const CACHE_NAME = 'lamyavita-v3.6';
const urlsToCache = [
  '/LaMiaVita/', '/LaMiaVita/index.html',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone@7/babel.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(urlsToCache.map(u =>
        cache.add(u).catch(() => {})
      ))
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // BYPASS TOTALE: non intercettare mai Firebase/Google (auth, API, SDK).
  // La richiesta va alla rete senza respondWith: nessuna interferenza col login.
  const u = request.url || '';
  if (u.indexOf('googleapis.com') !== -1 || u.indexOf('gstatic.com') !== -1 ||
      u.indexOf('firebaseio.com') !== -1 || u.indexOf('firebaseapp.com') !== -1 ||
      u.indexOf('firebaseinstallations') !== -1 || u.indexOf('accounts.google.com') !== -1) {
    return;
  }
  
  // Per l'HTML/navigazioni usa NETWORK-FIRST:
  // serve SEMPRE la versione fresca da GitHub (mai quella vecchia in cache),
  // e ricade sulla cache solo se offline.
  if (request.mode === 'navigate' ||
      (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
          return response;
        })
        .catch(() =>
          caches.match(request).catch(() => caches.match('/LaMiaVita/'))
        )
    );
    return;
  }

  // Per le altre risorse statiche usa CACHE-FIRST per la velocita',
  // con aggiornamento in background.
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        const fetchPromise = fetch(request)
          .then(response => {
            if (response && response.ok && request.method === 'GET' &&
                (response.type === 'basic' || response.type === 'cors')) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
            }
            return response;
          })
          .catch(() => cachedResponse);
        return cachedResponse || fetchPromise;
      })
  );
});