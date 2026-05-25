const V = 'zc-v4';
const FILES = ['./', './index.html', './manifest.json'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => { if (r && r.status === 200) { const c = r.clone(); caches.open(V).then(ca => ca.put(e.request, c)); } return r; })
      .catch(() => caches.match(e.request).then(c => c || caches.match('./index.html')))
  );
});
