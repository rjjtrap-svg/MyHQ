import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './config';

/**
 * Uploads a deal photo to `teams/{teamId}/deal-photos/{dealId}.jpg`. The path encodes the
 * team and deal id so the OCR Cloud Function (storage-triggered) can find the matching
 * Firestore doc to write results back onto.
 */
export async function uploadDealPhoto(teamId: string, dealId: string, localUri: string): Promise<string> {
  if (!storage) throw new Error('Firebase is not configured.');
  const path = `teams/${teamId}/deal-photos/${dealId}.jpg`;
  const photoRef = ref(storage, path);

  const response = await fetch(localUri);
  const blob = await response.blob();
  await uploadBytes(photoRef, blob, { contentType: 'image/jpeg' });

  return getDownloadURL(photoRef);
}
