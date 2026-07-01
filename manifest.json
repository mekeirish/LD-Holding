// sw.js
const CACHE_NAME = 'LD-Holding-v2';

// Installation : précache des assets critiques
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/icon.png'
      ]);
    })
  );
  // Force l'activation immédiate sans attendre la fermeture des autres onglets
  self.skipWaiting();
});

// Activation : nettoyer les anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  // Prendre le contrôle de toutes les pages immédiatement
  self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Ne pas intercepter les appels vers Firebase et les CDN dynamiques
  if (url.includes('firebaseio.com') || 
      url.includes('googleapis.com') || 
      url.includes('gstatic.com') ||
      url.includes('ntfy.sh')) {
    return;
  }

  // Pour les navigations (index.html) : Network First
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Pour les autres assets : Cache First avec mise à jour en fond
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        return response;
      });
      return cached || fetchPromise;
    })
  );
});