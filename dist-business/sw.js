// Service Worker for Redeem Rocket
// Handles offline support, caching, and background sync

const CACHE_NAME = 'redeem-rocket-v1';
const OFFLINE_FALLBACK_PAGE = '/offline.html';

// Assets to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/app/dashboard',
  '/offline.html',
  '/manifest.json',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[ServiceWorker] Failed to cache some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip API requests - these should fail gracefully in app
  if (request.url.includes('/api/') || request.url.includes('supabase')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'Offline - API unavailable',
          }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // Cache first strategy for static assets
  if (
    request.method === 'GET' &&
    (request.destination === 'image' ||
      request.destination === 'font' ||
      request.destination === 'style' ||
      request.destination === 'script')
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).then((response) => {
            // Cache successful responses
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          })
        );
      })
    );
    return;
  }

  // Network first strategy for HTML pages
  if (request.method === 'GET' && request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful HTML responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fall back to cached version
          return caches
            .match(request)
            .then((response) => {
              return response || caches.match(OFFLINE_FALLBACK_PAGE);
            });
        })
    );
    return;
  }

  // Default: Network first for other requests
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);

  if (event.tag === 'sync-leads') {
    event.waitUntil(syncLeads());
  } else if (event.tag === 'sync-campaigns') {
    event.waitUntil(syncCampaigns());
  }
});

// Sync leads to server when back online
async function syncLeads() {
  try {
    const db = await openIndexedDB();
    const leads = await getAllFromIndexedDB(db, 'pending-leads');

    for (const lead of leads) {
      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead),
        });

        if (response.ok) {
          await deleteFromIndexedDB(db, 'pending-leads', lead.id);
        }
      } catch (err) {
        console.error('[ServiceWorker] Failed to sync lead:', err);
      }
    }
  } catch (err) {
    console.error('[ServiceWorker] Sync leads failed:', err);
    throw err;
  }
}

// Sync campaigns to server when back online
async function syncCampaigns() {
  try {
    const db = await openIndexedDB();
    const campaigns = await getAllFromIndexedDB(db, 'pending-campaigns');

    for (const campaign of campaigns) {
      try {
        const response = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campaign),
        });

        if (response.ok) {
          await deleteFromIndexedDB(db, 'pending-campaigns', campaign.id);
        }
      } catch (err) {
        console.error('[ServiceWorker] Failed to sync campaign:', err);
      }
    }
  } catch (err) {
    console.error('[ServiceWorker] Sync campaigns failed:', err);
    throw err;
  }
}

// IndexedDB helpers
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RedeemRocket', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-leads')) {
        db.createObjectStore('pending-leads', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-campaigns')) {
        db.createObjectStore('pending-campaigns', { keyPath: 'id' });
      }
    };
  });
}

function getAllFromIndexedDB(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteFromIndexedDB(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Message handling for client communication
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CACHE_URL') {
    const urlToCache = event.data.url;
    caches.open(CACHE_NAME).then((cache) => {
      cache.add(urlToCache);
    });
  }
});
