import { doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './config';

export const MAX_BIO_LENGTH = 240;

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
