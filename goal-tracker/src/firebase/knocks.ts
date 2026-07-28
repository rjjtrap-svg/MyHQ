import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { KnockRecord } from '@/src/types';
import { db } from './config';

/**
 * Per-address knock records. Team-readable on purpose — the whole point of logging a door
 * is that the next rep down the street knows it's been worked, and that a "do not knock"
 * is honoured by everyone rather than just the person who took it. Writes stay owner-only.
 */
export function subscribeTeamKnocks(
  teamId: string,
  callback: (knocks: KnockRecord[]) => void
): () => void {
  if (!db) return () => {};
  const q = collection(db, 'teams', teamId, 'knocks');
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as KnockRecord)),
    () => callback([])
  );
}

/** One rep's knocks. Used on a teammate's profile, where the team-wide view isn't wanted. */
export function subscribeRepKnocks(
  teamId: string,
  repUid: string,
  callback: (knocks: KnockRecord[]) => void
): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'teams', teamId, 'knocks'), where('repUid', '==', repUid));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as KnockRecord)),
    () => callback([])
  );
}

export async function saveKnock(knock: KnockRecord): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, 'teams', knock.teamId, 'knocks', knock.id), knock);
}

export async function deleteKnock(teamId: string, knockId: string): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(db, 'teams', teamId, 'knocks', knockId));
}
