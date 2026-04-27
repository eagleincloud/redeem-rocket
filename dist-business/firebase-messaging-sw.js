/**
 * Firebase Cloud Messaging — background message handler (Service Worker)
 *
 * ⚠️  IMPORTANT: Replace every __PLACEHOLDER__ below with your actual
 *     Firebase config values from:
 *     Firebase Console → Project Settings → Your Apps → SDK setup and configuration
 *
 * These must match the VITE_FIREBASE_* values in your .env file.
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyCej8JuvoqaTL-_61zNYmxGEvxxA9yjAJQ',
  authDomain:        'redeemrocketlocal.firebaseapp.com',
  projectId:         'redeemrocketlocal',
  storageBucket:     'redeemrocketlocal.firebasestorage.app',
  messagingSenderId: '758621386346',
  appId:             '1:758621386346:web:21cbec71a93e861166bc13',
});

const messaging = firebase.messaging();

// ── Background message handler ────────────────────────────────────────────────
// Receives push messages when the tab is in the background or closed.

messaging.onBackgroundMessage(payload => {
  const {
    title = 'Redeem Rocket',
    body  = '',
    icon  = '/logo.png',
  } = payload.notification ?? {};

  self.registration.showNotification(title, {
    body,
    icon,
    badge:  '/logo.png',
    tag:    payload.collapseKey ?? 'rr-notification',
    data:   payload.data,
    requireInteraction: false,
  });
});

// ── Notification click handler ────────────────────────────────────────────────

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const url = event.notification.data?.url ?? '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        // Focus an existing window if possible
        for (const client of list) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) return clients.openWindow(url);
      }),
  );
});
