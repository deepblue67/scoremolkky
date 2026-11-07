// ═══════════════════════════════════════════════════════════
//  Mölkky Score — Service Worker
//  Version : V20261107_1305
//  Mise à jour automatique par `npm run build` (même valeur
//  que APP_VERSION dans index.html et app.js)
//
//  Stratégie :
//   - en ligne  : réseau d'abord (on reçoit toujours la dernière
//                 version), le cache est rafraîchi au passage ;
//   - réseau lent (> 3 s) ou hors ligne : on sert le cache.
// ═══════════════════════════════════════════════════════════

const APP_VERSION = 'V20261107_1305';
const CACHE_NAME  = 'molky-cache-' + APP_VERSION;
const NETWORK_TIMEOUT_MS = 3000;

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
  './transfer.js',
  './guide-screen.js',
  './app.js',
  './vendor/react.production.min.js',
  './vendor/react-dom.production.min.js',
  './fonts/barlow-latin-400-normal.woff2',
  './fonts/barlow-latin-500-normal.woff2',
  './fonts/barlow-latin-600-normal.woff2',
  './fonts/barlow-latin-700-normal.woff2',
  './fonts/barlow-condensed-latin-500-normal.woff2',
  './fonts/barlow-condensed-latin-600-normal.woff2',
  './fonts/barlow-condensed-latin-700-normal.woff2',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// ── Install : mise en cache complète, ou rien ────────────────
// `cache: 'reload'` contourne le cache HTTP du navigateur : on est sûr
// de stocker les fichiers de CETTE version et pas une copie périmée.
// `addAll` est atomique : si un fichier manque, l'installation échoue
// et l'ancienne version (complète) reste en service.
self.addEventListener('install', event => {
  console.log('[Mölkky SW] Install — version', APP_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(
        ASSETS_TO_CACHE.map(asset => new Request(asset, { cache: 'reload' }))
      ))
      .then(() => self.skipWaiting())
  );
});

// ── Activate : supprime les anciens caches ───────────────────
self.addEventListener('activate', event => {
  console.log('[Mölkky SW] Activate — nettoyage des anciens caches');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('molky-cache-') && key !== CACHE_NAME)
          .map(key => {
            console.log('[Mölkky SW] Suppression ancien cache :', key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim())
  );
});

function fromCache(request, isNavigation) {
  return caches.open(CACHE_NAME)
    .then(cache => cache.match(request, { ignoreSearch: true })
      .then(hit => hit || (isNavigation ? cache.match('./index.html') : undefined)));
}

// ── Fetch : réseau d'abord (avec délai max), sinon cache ─────
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // ressources externes : navigateur

  const isNavigation = request.mode === 'navigate';

  event.respondWith(new Promise(resolve => {
    let settled = false;
    const finish = response => {
      if (settled) return;
      settled = true;
      resolve(response);
    };
    const fallback = () => fromCache(request, isNavigation).then(cached => {
      if (cached) finish(cached);
      return cached;
    });

    // Réseau trop lent (fond du jardin…) : on répond avec le cache.
    const timer = setTimeout(fallback, NETWORK_TIMEOUT_MS);

    fetch(request)
      .then(response => {
        clearTimeout(timer);
        if (response && response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        finish(response);
      })
      .catch(() => {
        clearTimeout(timer);
        fallback().then(cached => {
          if (!cached) finish(Response.error());
        });
      });
  }));
});
