/* service-worker.js by Daniele Lolli (UncleDan) feat. Claude AI - Release 26.0b20 - 2026-11-27 15-37-45 */
/* =====================================================================
   Service worker - Classificazione Baskin EISI (PWA)
   Cache-first per il funzionamento completamente offline.
   Aggiornare CACHE_NAME ad ogni rilascio (deve coincidere con APP_VERSION
   in js/app.js): invalida la vecchia cache e dichiara la versione del file.
   ===================================================================== */
const CACHE_NAME = 'classificazione-baskin-eisi-v26.0b20';

/* /, /beta/ (e il vecchio /pwa/) stanno sulla stessa origine: la cache è
   distinta per percorso, così una versione non cancella quella dell'altra. */
const CACHE = CACHE_NAME + '@' + self.registration.scope;

const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/data.js',
  './js/logos.js',
  './js/seg.js',
  './js/percorsi-data.js',
  './js/xlsx.js',
  './js/ctl.js',
  './js/app.js',
  './js/elenchi.js',
  './js/nativo.js',
  './js/percorsi.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/logos/logo-baskin.svg',
  './icons/logos/logo-eisi.svg',
  './img/doc/traiettoria-parabolica.png',
  './img/doc/caduta-verticale.png',
  './img/doc/scivolo-foto.jpg',
  './img/doc/scivolo-schema.png',
  './img/doc/percorso-a.png',
  './img/doc/percorso-b.png',
  './img/doc/percorso-c.png'
];

self.addEventListener('install', (event)=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
      .then(()=> self.skipWaiting())
  );
});

self.addEventListener('activate', (event)=>{
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith('classificazione-baskin-eisi-') && k !== CACHE &&
        (k.endsWith('@' + self.registration.scope) || !k.includes('@')))   // stesso percorso o cache vecchio stile
        .map(k => caches.delete(k)))
    ).then(()=> self.clients.claim())
  );
});

self.addEventListener('fetch', (event)=>{
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;
  // service-worker.js va sempre letto dalla rete (verifica aggiornamenti)
  if(url.pathname.endsWith('/service-worker.js')) return;
  event.respondWith(
    caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true })).then(hit => hit || fetch(req).then(res => {
      if(res && res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(()=> req.mode === 'navigate' ? caches.open(CACHE).then(c => c.match('./index.html')) : undefined))
  );
});
