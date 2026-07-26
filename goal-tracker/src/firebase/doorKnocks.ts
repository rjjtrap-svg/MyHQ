import { collection, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { DoorKnockEntry } from '@/src/types';
import { db } from './config';

function docId(repUid: string, date: string): string {
  return `${repUid}_${date}`;
}

/**
 * Subscribes to one rep's door-knock entries. Managers/team_leads use `subscribeRepDoorKnocks`
 * with the rep's own uid — Firestore rules already gate whether that read is allowed.
 */
export function subscribeRepDoorKnocks(
  teamId: string,
  repUid: string,
  callback: (entries: DoorKnockEntry[]) => void
): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'teams', teamId, 'doorKnocks'), where('repUid', '==', repUid));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => d.data() as DoorKnockEntry)), () => callback([]));
}

export async function setDoorKnockCount(teamId: string, repUid: string, date: string, count: number): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  const entry: DoorKnockEntry = { teamId, repUid, date, count, updatedAt: new Date().toISOString() };
  await setDoc(doc(db, 'teams', teamId, 'doorKnocks', docId(repUid, date)), entry);
}
