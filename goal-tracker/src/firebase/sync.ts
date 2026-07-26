import { signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { Deal, Settings } from '@/src/types';
import { auth, db, firebaseEnabled } from './config';

let uidPromise: Promise<string | null> | null = null;

/** Resolves once anonymous auth has settled; null when cloud sync is unavailable. */
export function ensureUid(): Promise<string | null> {
  if (!firebaseEnabled || !auth) return Promise.resolve(null);
  if (uidPromise) return uidPromise;

  uidPromise = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth!, (user: User | null) => {
      if (user) {
        unsubscribe();
        resolve(user.uid);
      }
    });
    signInAnonymously(auth!).catch(() => {
      unsubscribe();
      resolve(null);
    });
  });

  return uidPromise;
}

export async function pushDeal(deal: Deal): Promise<boolean> {
  const uid = await ensureUid();
  if (!uid || !db) return false;
  try {
    await setDoc(doc(db, 'users', uid, 'deals', deal.id), {
      ...deal,
      syncedAt: serverTimestamp(),
    });
    return true;
  } catch {
    return false;
  }
}

export async function pushDealDelete(dealId: string): Promise<boolean> {
  const uid = await ensureUid();
  if (!uid || !db) return false;
  try {
    await deleteDoc(doc(db, 'users', uid, 'deals', dealId));
    return true;
  } catch {
    return false;
  }
}

export async function pushSettings(settings: Settings): Promise<boolean> {
  const uid = await ensureUid();
  if (!uid || !db) return false;
  try {
    await setDoc(doc(db, 'users', uid, 'meta', 'settings'), settings);
    return true;
  } catch {
    return false;
  }
}

export async function pullRemoteDeals(): Promise<Deal[] | null> {
  const uid = await ensureUid();
  if (!uid || !db) return null;
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'deals'));
    return snap.docs.map((d) => d.data() as Deal);
  } catch {
    return null;
  }
}

export async function pullRemoteSettings(): Promise<Settings | null> {
  const uid = await ensureUid();
  if (!uid || !db) return null;
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'meta'));
    const settingsDoc = snap.docs.find((d) => d.id === 'settings');
    return (settingsDoc?.data() as Settings) ?? null;
  } catch {
    return null;
  }
}
