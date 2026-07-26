import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { app, db, firebaseConfig } from '@/src/firebase/config';

// firebase/messaging touches browser-only globals at module scope, so it's only ever
// require()'d on web (never imported statically, which would pull it into native bundles too).
type MessagingModule = typeof import('firebase/messaging');

const VAPID_KEY = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Web push only: iOS Safari requires the site be added to the Home Screen (installed as a
 * PWA) before notification permission can even be granted — a regular browser tab can't
 * receive push on iOS. Android Chrome and desktop browsers work in a normal tab.
 */
export function isWebPushSupported(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    typeof Notification !== 'undefined' &&
    'serviceWorker' in navigator
  );
}

export function getWebPushPermission(): NotificationPermission | 'unsupported' {
  if (!isWebPushSupported()) return 'unsupported';
  return Notification.permission;
}

async function registerTokenNow(uid: string, teamId: string): Promise<void> {
  if (!db || !app || !VAPID_KEY || Platform.OS !== 'web') return;
  const { getMessaging, getToken, isSupported }: MessagingModule = require('firebase/messaging');
  if (!(await isSupported())) return;

  const swParams = new URLSearchParams({
    apiKey: firebaseConfig.apiKey ?? '',
    authDomain: firebaseConfig.authDomain ?? '',
    projectId: firebaseConfig.projectId ?? '',
    storageBucket: firebaseConfig.storageBucket ?? '',
    messagingSenderId: firebaseConfig.messagingSenderId ?? '',
    appId: firebaseConfig.appId ?? '',
  });
  const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${swParams.toString()}`);
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) return;

  await setDoc(doc(db, 'pushTokens', token), {
    token,
    uid,
    teamId,
    createdAt: new Date().toISOString(),
  });
}

/** Safe to call on every app load — only (re)registers if permission was already granted, never prompts. */
export async function registerWebPushToken(uid: string, teamId: string): Promise<void> {
  if (!isWebPushSupported() || Notification.permission !== 'granted') return;
  await registerTokenNow(uid, teamId);
}

/** Called from an explicit user tap (e.g. a Settings button) — this is what actually prompts. */
export async function requestWebPushPermission(uid: string, teamId: string): Promise<boolean> {
  if (!isWebPushSupported()) return false;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;
  await registerTokenNow(uid, teamId);
  return true;
}
