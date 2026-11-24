const CACHE_NAME = 'LD-Holding-v4';
const PRECACHE = ['./index.html', './manifest.json', './icon.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isPage = request.mode === 'navigate'
    || request.destination === 'document'
    || url.pathname.endsWith('.html');

  if (isPage) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(cached => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'LD Holding', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'LD Holding';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: './icon.png',
      badge: './badge.png',
      tag: data.tag || 'ld-holding',
      renotify: true,
      data: { url: data.url || './index.html' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(
    (event.notification.data && event.notification.data.url) || './index.html',
    self.location.href
  ).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
      for (const win of windows) {
        if (win.url.startsWith(self.registration.scope) && 'focus' in win) return win.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
