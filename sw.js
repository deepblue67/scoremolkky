// ═══════════════════════════════════════════════════════════
//  Mölkky Score — Service Worker
//  Version : V20260619_2008
//  À mettre à jour à chaque nouvelle livraison (même valeur
//  que APP_VERSION dans index.html)
// ═══════════════════════════════════════════════════════════

const APP_VERSION = 'V20260619_2008';
const CACHE_NAME  = 'molky-cache-' + APP_VERSION;

// Liste des ressources à mettre en cache au démarrage
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './fonts.css',
  './styles.css',
  './constants.js',
  './formatters.js',
  './components.js',
  './game-components.js',
  './game-state.js',
  './dialogs.js',
  './setup-screen.js',
  './rules.js',
  './storage.js',
  './app.js',
  './vendor/react.production.min.js',
  './vendor/react-dom.production.min.js',
  './fonts/fredoka-one-400.ttf',
  './fonts/nunito-400.ttf',
  './fonts/nunito-600.ttf',
  './fonts/nunito-700.ttf',
  './fonts/nunito-800.ttf',
  './fonts/nunito-900.ttf',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// ── Install : mise en cache de toutes les ressources ─────────
self.addEventListener('install', event => {
  console.log('[Mölkky SW] Install — version', APP_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(
        ASSETS_TO_CACHE.map(asset =>
          cache.add(asset).catch(err => {
            console.warn('[Mölkky SW] Ressource non mise en cache :', asset, err);
          })
        )
      ))
      .then(() => self.skipWaiting())   // active immédiatement
  );
});

// ── Activate : supprime les anciens caches ───────────────────
self.addEventListener('activate', event => {
  console.log('[Mölkky SW] Activate — nettoyage des anciens caches');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[Mölkky SW] Suppression ancien cache :', key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch : network-first, fallback sur le cache ─────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isLocalRequest = requestUrl.origin === self.location.origin;
  const isNavigation = event.request.mode === 'navigate';

  if (isNavigation || isLocalRequest) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => cachedResponse || fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
            }
            return networkResponse;
          })
        )
        .catch(() => isNavigation ? caches.match('./index.html') : undefined)
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
