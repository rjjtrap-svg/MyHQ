import { doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { PersonalBestOverrides } from '@/src/types';
import { db, storage } from './config';

export const MAX_BIO_LENGTH = 240;

/**
 * Saves the rep's pre-app career numbers. Blank fields are written as null so clearing one
 * actually removes it rather than leaving a stale value on the profile.
 */
export async function updateMyBests(
  teamId: string,
  uid: string,
  bests: PersonalBestOverrides
): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  const patch: Record<string, number | null> = {};
  for (const [key, value] of Object.entries(bests)) {
    patch[key] = typeof value === 'number' && Number.isFinite(value) ? value : null;
  }
  // Nested under `bests` rather than dotted keys — setDoc treats a dotted string as a
  // literal field name, so "bests.bestDay" would create a field with a dot in it.
  await setDoc(doc(db, 'teams', teamId, 'members', uid), { bests: patch }, { merge: true });
}

/**
 * Profile card fields live on the rep's *membership* doc rather than their private user
 * doc, because the whole point is that teammates can see them — members/{uid} is already
 * readable by the team, and Firestore rules let a member edit their own.
 */
export async function updateMyProfile(
  teamId: string,
  uid: string,
  partial: { bio?: string; photoUrl?: string }
): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, 'teams', teamId, 'members', uid), partial, { merge: true });
}

/**
 * Uploads a profile picture and returns its download URL. The path is namespaced by uid
 * and the filename is fixed, so re-uploading replaces the old picture instead of leaving
 * orphaned files behind.
 */
export async function uploadProfilePhoto(
  teamId: string,
  uid: string,
  localUri: string
): Promise<string> {
  if (!storage) throw new Error('Firebase is not configured.');
  const response = await fetch(localUri);
  const blob = await response.blob();
  const contentType = blob.type || 'image/jpeg';
  const photoRef = ref(storage, `teams/${teamId}/profile-photos/${uid}/avatar.jpg`);
  await uploadBytes(photoRef, blob, { contentType });
  return getDownloadURL(photoRef);
}
