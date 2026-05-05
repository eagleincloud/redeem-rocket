/**
 * PWA Service Worker Registration
 * Handles service worker registration, updates, and offline notifications
 */

interface PWAConfig {
  swPath?: string;
  enableNotifications?: boolean;
  enableAutoUpdate?: boolean;
}

let swRegistration: ServiceWorkerRegistration | null = null;
let updateCheckInterval: NodeJS.Timer | null = null;

/**
 * Register service worker
 */
export async function registerServiceWorker(config: PWAConfig = {}) {
  const {
    swPath = '/sw.js',
    enableNotifications = true,
    enableAutoUpdate = true,
  } = config;

  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: '/',
    });

    swRegistration = registration;
    console.log('[PWA] Service Worker registered successfully');

    // Listen for updates
    registration.addEventListener('updatefound', handleUpdateFound);

    // Check for updates periodically
    if (enableAutoUpdate) {
      startUpdateCheck(registration);
    }

    // Request notification permission
    if (enableNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }

    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Handle service worker updates
 */
function handleUpdateFound() {
  const registration = swRegistration;
  if (!registration) return;

  const newWorker = registration.installing;
  if (!newWorker) return;

  newWorker.addEventListener('statechange', () => {
    if (
      newWorker.state === 'installed' &&
      navigator.serviceWorker.controller
    ) {
      // New service worker is ready
      console.log('[PWA] Update available');

      // Show update notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Redeem Rocket Update', {
          body: 'A new version is available. Refresh to update.',
          icon: '/icon-192x192.png',
          badge: '/icon-96x96.png',
          tag: 'update-notification',
        });
      }

      // Emit event for UI to listen to
      window.dispatchEvent(
        new CustomEvent('pwa-update-available', {
          detail: { registration },
        })
      );
    }
  });
}

/**
 * Check for service worker updates periodically
 */
function startUpdateCheck(registration: ServiceWorkerRegistration) {
  // Check every hour
  updateCheckInterval = setInterval(() => {
    registration.update().catch((err) => {
      console.warn('[PWA] Update check failed:', err);
    });
  }, 60 * 60 * 1000);
}

/**
 * Stop checking for updates
 */
export function stopUpdateCheck() {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
    updateCheckInterval = null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker() {
  if (!swRegistration) {
    return;
  }

  try {
    const success = await swRegistration.unregister();
    if (success) {
      console.log('[PWA] Service Worker unregistered');
      swRegistration = null;
      stopUpdateCheck();
    }
  } catch (error) {
    console.error('[PWA] Failed to unregister Service Worker:', error);
  }
}

/**
 * Check if app is running in standalone mode (installed PWA)
 */
export function isStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Detect if device is online/offline
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onOnlineStatusChange(
  callback: (online: boolean) => void
): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Request install prompt (for browsers that support it)
 */
export function setupInstallPrompt(
  onPrompt?: (event: any) => void,
  onInstalled?: () => void
): () => void {
  let deferredPrompt: any = null;

  const handleBeforeInstallPrompt = (e: Event) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    // Stash the event for later use
    deferredPrompt = e;
    console.log('[PWA] Install prompt available');

    if (onPrompt) {
      onPrompt(e);
    }
  };

  const handleAppInstalled = () => {
    console.log('[PWA] App installed');
    deferredPrompt = null;
    if (onInstalled) {
      onInstalled();
    }
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);

  // Return cleanup function
  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', handleAppInstalled);
  };
}

/**
 * Show install prompt if available
 */
export async function showInstallPrompt(): Promise<boolean> {
  // This would need to be called with the deferred prompt from beforeinstallprompt event
  // Implementation depends on storing deferredPrompt in your app
  return false;
}

/**
 * Enable offline mode indicators
 */
export function setupOfflineIndicator() {
  const handleOnline = () => {
    document.body.classList.remove('offline');
    console.log('[PWA] Back online');
  };

  const handleOffline = () => {
    document.body.classList.add('offline');
    console.log('[PWA] Offline');

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('You are offline', {
        body: 'Some features may be limited. Changes will sync when back online.',
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
      });
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Check initial state
  if (!navigator.onLine) {
    handleOffline();
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Queue action for offline execution
 */
export function queueOfflineAction(
  storeName: string,
  action: {
    type: 'create' | 'update' | 'delete';
    data: Record<string, any>;
  }
) {
  if (!('indexedDB' in window)) {
    console.warn('IndexedDB not supported');
    return;
  }

  const request = indexedDB.open('RedeemRocket', 1);

  request.onerror = () => {
    console.error('Failed to open IndexedDB');
  };

  request.onsuccess = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;

    if (!db.objectStoreNames.contains(storeName)) {
      console.warn(`Store ${storeName} not found`);
      return;
    }

    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    const actionWithTimestamp = {
      ...action,
      queuedAt: new Date().toISOString(),
      id: `${action.data.id || 'new'}-${Date.now()}`,
    };

    store.add(actionWithTimestamp);

    console.log(`[PWA] Queued offline action: ${storeName}`, actionWithTimestamp);
  };
}
