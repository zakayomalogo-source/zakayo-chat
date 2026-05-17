/* ═══════════════════════════════════════
   ZAKAYO CHAT — SERVICE WORKER v2.1
   Offline-first caching strategy
═══════════════════════════════════════ */

const CACHE_NAME = 'zakayo-chat-v2.1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,300&display=swap'
];

// ── INSTALL: Cache all assets ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS.filter(a => !a.startsWith('https://fonts')));
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: Clean old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: Network first, cache fallback ──
self.addEventListener('fetch', event => {
  // Skip non-GET and browser-extension requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Return cached version when offline
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // For navigation requests, return the app shell
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// ── BACKGROUND SYNC (future) ──
self.addEventListener('sync', event => {
  if (event.tag === 'sync-messages') {
    console.log('[SW] Background sync: messages');
  }
});

// ── PUSH NOTIFICATIONS (future) ──
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification('Zakayo Chat', {
      body: data.body || 'Ujumbe mpya umefika!',
      icon: data.icon || './icon.png',
      badge: './badge.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || './' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || './'));
});
