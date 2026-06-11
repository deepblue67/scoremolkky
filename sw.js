// ═══════════════════════════════════════════════════════════
//  Mölkky Score — Service Worker
//  Version : V20260611_18H30
//  À mettre à jour à chaque nouvelle livraison (même valeur
//  que APP_VERSION dans index.html)
// ═══════════════════════════════════════════════════════════

const APP_VERSION = 'V20260611_18H30';
const CACHE_NAME  = 'molky-cache-' + APP_VERSION;

// Liste des ressources à mettre en cache au démarrage
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js',
];

// ── Install : mise en cache de toutes les ressources ─────────
self.addEventListener('install', event => {
  console.log('[Mölkky SW] Install — version', APP_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
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

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Mise à jour du cache avec la réponse fraîche
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Réseau indisponible → on sert depuis le cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            // Fallback ultime : renvoyer index.html pour les navigations
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});
