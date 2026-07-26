import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { deleteObject, ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { PitchSubmission } from '@/src/types';
import { db, storage, functions } from './config';

export async function createPitchSubmission(
  teamId: string,
  repUid: string,
  repName: string,
  id: string
): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  const now = new Date().toISOString();
  const submission: PitchSubmission = {
    id,
    teamId,
    repUid,
    repName,
    status: 'uploading',
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'teams', teamId, 'pitchSubmissions', id), submission);
}

/** Uploads the recorded audio, naming the file after the submission doc so the Cloud
 * Function's Storage trigger knows which Firestore doc to update as it processes it. */
export async function uploadPitchAudio(teamId: string, submissionId: string, localUri: string): Promise<string> {
  if (!storage) throw new Error('Firebase is not configured.');
  const response = await fetch(localUri);
  const blob = await response.blob();
  const mimeType = blob.type || 'audio/m4a';
  const ext = mimeType.includes('webm')
    ? 'webm'
    : mimeType.includes('wav')
      ? 'wav'
      : mimeType.includes('mp3') || mimeType.includes('mpeg')
        ? 'mp3'
        : 'm4a';
  const path = `teams/${teamId}/pitch-audio/${submissionId}.${ext}`;
  const audioRef = ref(storage, path);
  await uploadBytes(audioRef, blob, { contentType: mimeType });
  const audioUrl = await getDownloadURL(audioRef);
  if (db) {
    await setDoc(
      doc(db, 'teams', teamId, 'pitchSubmissions', submissionId),
      { audioUrl, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  }
  return audioUrl;
}

export function subscribePitchSubmissions(
  teamId: string,
  repUid: string,
  callback: (submissions: PitchSubmission[]) => void
): () => void {
  if (!db) return () => {};
  // Client-side filter (not a Firestore `where`) since this only ever needs the signed-in
  // rep's own submissions and the collection per rep is small; avoids an extra composite index.
  const q = query(collection(db, 'teams', teamId, 'pitchSubmissions'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const all = snap.docs.map((d) => d.data() as PitchSubmission);
      callback(all.filter((s) => s.repUid === repUid));
    },
    () => callback([])
  );
}

/**
 * Removes a practice pitch: the Firestore doc plus its recording in Storage. Firestore
 * rules already limit this to the rep who recorded it (or the manager).
 *
 * The audio file's extension depends on what the device recorded, so rather than guessing
 * we list the pitch-audio folder and delete whatever is named after this submission —
 * the upload names the file after the submission id precisely so it can be found again.
 */
export async function deletePitchSubmission(teamId: string, submissionId: string): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(db, 'teams', teamId, 'pitchSubmissions', submissionId));

  if (!storage) return;
  try {
    const folder = await listAll(ref(storage, `teams/${teamId}/pitch-audio`));
    await Promise.all(
      folder.items
        .filter((item) => item.name.replace(/\.[^.]+$/, '') === submissionId)
        .map((item) => deleteObject(item))
    );
  } catch {
    // The recording may never have finished uploading, or may already be gone. The doc is
    // deleted either way, which is what the rep asked for — don't fail the whole action.
  }
}

export async function askObjectionHandling(question: string): Promise<string> {
  if (!functions) throw new Error('Firebase is not configured.');
  const callable = httpsCallable<{ question: string }, { answer: string }>(functions, 'askObjectionHandling');
  const result = await callable({ question });
  return result.data.answer;
}
