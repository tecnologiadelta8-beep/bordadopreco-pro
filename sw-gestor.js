// Service Worker - PWA do Gestor JDC
const CACHE_NAME = 'jdc-gestor-v3';
const ASSETS = [
  './login.html',
  './admin.html',
  './auth.js',
  './icon-192.png',
  './icon-512.png',
  './manifest-gestor.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Nunca intercepta CDN / API (Supabase, jsDelivr, unpkg)
  if (url.origin !== self.location.origin) {
    return;
  }

  // HTML e JS de gestão: sempre tenta rede primeiro (evita cache velho sem Supabase)
  const isHtmlOrConfig =
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('supabase-config.js') ||
    url.pathname.endsWith('admin-gestao.html') ||
    url.pathname.endsWith('notificacoes-gestor.js');

  if (isHtmlOrConfig) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('./admin.html') || caches.match('./login.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
