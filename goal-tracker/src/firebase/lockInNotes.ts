import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { LockInNote } from '@/src/types';
import { db } from './config';

/**
 * A rep's private Lock In writing. Stored under the rep's own uid and readable only by
 * them — see firestore.rules. Same reasoning as coach chat: nobody writes an honest why
 * if they think their manager can read it.
 */
export function subscribeNotes(
  teamId: string,
  repUid: string,
  callback: (notes: LockInNote[]) => void
): () => void {
  if (!db) return () => {};
  const q = query(
    collection(db, 'teams', teamId, 'lockInNotes', repUid, 'notes'),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as LockInNote)),
    () => callback([])
  );
}

export async function saveNote(note: LockInNote): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  await setDoc(
    doc(db, 'teams', note.teamId, 'lockInNotes', note.repUid, 'notes', note.id),
    note
  );
}

export async function deleteNote(teamId: string, repUid: string, noteId: string): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(db, 'teams', teamId, 'lockInNotes', repUid, 'notes', noteId));
}
