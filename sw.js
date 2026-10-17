// Pritisak service worker
const CACHE = 'pritisak-v7.1.0';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Stranica: prvo mreža (da nove verzije stignu odmah), keš kao rezerva offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const cl = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', cl)); return res; })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // Ostalo (ikone, Chart.js, fontovi): prvo keš, pa mreža
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) {
        const cl = res.clone();
        caches.open(CACHE).then(c => c.put(req, cl));
      }
      return res;
    }).catch(() => cached))
  );
});
