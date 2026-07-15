// Team Buffalos — Service Worker
// UPDATE BUILD on every deploy to trigger auto-reload for all users
const BUILD = '20260715-146';
const CACHE = 'tb-' + BUILD;

// Install: activate immediately, don't wait for old tabs to close
self.addEventListener('install', () => self.skipWaiting());

// Activate: delete old caches, claim all open clients immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // HTML navigation: no-cache forces CDN to revalidate so users always get fresh HTML
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, {cache: 'no-cache'}).catch(() => caches.match(e.request))
    );
    return;
  }

  // Versioned assets (app.js?v=..., styles.css?v=...): cache-first
  // The version stamp in the URL ensures stale assets are never served
  if (url.search.startsWith('?v=')) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }))
    );
    return;
  }

  // Everything else (Firebase SDK, images, etc.): network only
  e.respondWith(fetch(e.request));
});
