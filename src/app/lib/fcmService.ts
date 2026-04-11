/**
 * fcmService.ts
 * Firebase Cloud Messaging — browser push notifications.
 *
 * Usage:
 *   import { initFcm, onForegroundMessage } from '@/app/lib/fcmService';
 *
 *   // After user logs in:
 *   await initFcm(userId);
 *
 *   // Listen for in-app notifications while the page is open:
 *   const unsub = onForegroundMessage(payload => showToast(payload));
 *
 * Background messages are handled by public/firebase-messaging-sw.js.
 */

import {
  getToken,
  onMessage,
  type MessagePayload,
} from 'firebase/messaging';
import { firebaseMessaging } from './firebase';
import { supabase } from './supabase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

// ── Token registration ────────────────────────────────────────────────────────

/**
 * Requests notification permission, obtains the FCM token, and
 * persists it to Supabase so the server can send push messages.
 *
 * Safe to call multiple times — only upserts if the token changed.
 *
 * @param userId  The authenticated user's ID (from app_users / biz_users)
 * @param userType 'app' | 'biz'
 */
export async function initFcm(
  userId: string,
  userType: 'app' | 'biz' = 'app',
): Promise<string | null> {
  if (!firebaseMessaging || !VAPID_KEY) {
    console.info('[FCM] Not initialized — set VITE_FIREBASE_* and VITE_FIREBASE_VAPID_KEY');
    return null;
  }

  // Register the service worker (must be at /firebase-messaging-sw.js)
  let swReg: ServiceWorkerRegistration | undefined;
  try {
    swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    await navigator.serviceWorker.ready;
  } catch (err) {
    console.warn('[FCM] Service worker registration failed:', err);
    return null;
  }

  // Request notification permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.info('[FCM] Notification permission denied by user.');
    return null;
  }

  // Obtain / refresh FCM token
  let token: string;
  try {
    token = await getToken(firebaseMessaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
  } catch (err) {
    console.warn('[FCM] Failed to get token:', err);
    return null;
  }

  // Cache in localStorage to detect changes between sessions
  const storageKey = `fcm_token_${userId}`;
  const cached = localStorage.getItem(storageKey);
  if (cached === token) return token; // No change

  localStorage.setItem(storageKey, token);

  // Persist to Supabase
  if (supabase) {
    try {
      await supabase.from('fcm_tokens').upsert(
        {
          user_id:   userId,
          user_type: userType,
          token,
          platform:  'web',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,platform' },
      );
    } catch {
      // Non-critical — notifications still work via this session's token
    }
  }

  return token;
}

// ── Foreground message listener ───────────────────────────────────────────────

export type FcmPayload = MessagePayload;

/**
 * Subscribe to messages received while the app is in the foreground.
 * (Background messages are handled by the service worker.)
 *
 * Returns an unsubscribe function — call it in useEffect cleanup.
 */
export function onForegroundMessage(
  handler: (payload: FcmPayload) => void,
): () => void {
  if (!firebaseMessaging) return () => {};
  return onMessage(firebaseMessaging, handler);
}

// ── Notification display helper ───────────────────────────────────────────────

export interface NotificationDisplay {
  title: string;
  body:  string;
  icon?: string;
  url?:  string;
}

/**
 * Show a styled in-app notification toast from an FCM payload.
 * Injects a small DOM element that auto-removes after 5 s.
 */
export function showFcmToast(payload: FcmPayload): void {
  const { title = 'Redeem Rocket', body = '' } = payload.notification ?? {};
  const url = payload.data?.url as string | undefined;

  const el = document.createElement('div');
  el.setAttribute('data-fcm-toast', '');
  el.style.cssText = `
    position:fixed; bottom:20px; right:20px; z-index:99999;
    background:#1e293b; color:#f1f5f9;
    border-radius:14px; padding:14px 18px;
    max-width:340px; box-shadow:0 8px 32px rgba(0,0,0,0.35);
    display:flex; gap:12px; align-items:flex-start;
    animation:fcmSlideIn 0.3s ease; cursor:${url ? 'pointer' : 'default'};
    border-left:4px solid #7c3aed;
  `;

  const iconEl = document.createElement('span');
  iconEl.textContent = '🔔';
  iconEl.style.fontSize = '20px';

  const textEl = document.createElement('div');
  const titleEl = document.createElement('div');
  titleEl.textContent = title;
  titleEl.style.cssText = 'font-weight:700;font-size:14px;margin-bottom:4px;';
  const bodyEl = document.createElement('div');
  bodyEl.textContent = body;
  bodyEl.style.cssText = 'font-size:13px;color:#94a3b8;line-height:1.4;';

  textEl.appendChild(titleEl);
  textEl.appendChild(bodyEl);
  el.appendChild(iconEl);
  el.appendChild(textEl);

  if (url) el.addEventListener('click', () => window.location.assign(url));

  const style = document.createElement('style');
  style.textContent = `@keyframes fcmSlideIn{from{transform:translateX(120%);opacity:0}to{transform:none;opacity:1}}`;
  document.head.appendChild(style);
  document.body.appendChild(el);

  setTimeout(() => {
    el.style.animation = 'fcmSlideIn 0.3s ease reverse';
    setTimeout(() => el.remove(), 300);
  }, 5000);
}
