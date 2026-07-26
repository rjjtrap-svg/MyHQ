import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
// @ts-ignore -- getReactNativePersistence exists at runtime in the RN build but isn't
// always present in the published type defs for every firebase version.
import { getReactNativePersistence, getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Team accounts, shared deal visibility, and photo/OCR all require a real backend,
 * so unlike the original solo mode, Firebase is now required for the app to be usable.
 * Until real Firebase project keys are added to `.env`, screens show a setup-required notice.
 */
export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (firebaseEnabled) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  try {
    auth =
      Platform.OS === 'web'
        ? getAuth(app)
        : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // initializeAuth throws if called twice (e.g. fast refresh); fall back to the default instance.
    auth = getAuth(app);
  }
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };
