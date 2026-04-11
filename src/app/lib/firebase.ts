/**
 * firebase.ts
 * Initializes the Firebase app, Auth, and Cloud Messaging (FCM).
 *
 * All exports are null when VITE_FIREBASE_API_KEY is not set (local dev without Firebase).
 *
 * Setup (one-time):
 *  1. Create project at https://console.firebase.google.com
 *  2. Add a Web App → copy the config object → paste values into .env
 *  3. Authentication → Sign-in methods → Enable "Email/Password" → toggle "Email link (passwordless)"
 *  4. Project Settings → Cloud Messaging → Web Push certificates → Generate VAPID key pair
 *  5. Fill VITE_FIREBASE_VAPID_KEY in .env
 *  6. In firebase-messaging-sw.js replace every __PLACEHOLDER__ with your Firebase config values
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getMessaging, type Messaging } from 'firebase/messaging';
import { getFirestore, type Firestore } from 'firebase/firestore';

const cfg = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            as string | undefined,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        as string | undefined,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         as string | undefined,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             as string | undefined,
};

export const hasFirebase = Boolean(cfg.apiKey);

export let firebaseApp:       FirebaseApp | null = null;
export let firebaseAuth:      Auth        | null = null;
export let firebaseMessaging: Messaging   | null = null;
export let firebaseDb:        Firestore   | null = null;

if (hasFirebase) {
  firebaseApp  = getApps().length ? getApps()[0] : initializeApp(cfg as Required<typeof cfg>);
  firebaseAuth = getAuth(firebaseApp);
  firebaseDb   = getFirestore(firebaseApp);

  // Messaging is browser-only and requires service-worker support
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      firebaseMessaging = getMessaging(firebaseApp);
    } catch {
      console.warn('[Firebase] Messaging not available in this environment.');
    }
  }
}
