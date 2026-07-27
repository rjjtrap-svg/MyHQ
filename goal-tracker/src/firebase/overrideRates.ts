import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { RepOverrideRate } from '@/src/types';
import { db } from './config';

/** Doc id pairs the two people involved, so one rep can carry rates to several leaders. */
export function rateId(leaderUid: string, repUid: string): string {
  return `${leaderUid}_${repUid}`;
}

/**
 * A leader's own rates. Managers pass 'all' to see the whole comp structure; a team lead
 * must filter to themselves, because the rules only permit reading rates they earn — an
 * unfiltered query from a lead is rejected outright rather than partially, the same
 * pattern as commissions.ts and overrides.ts.
 */
export function subscribeOverrideRates(
  teamId: string,
  leaderUid: string | 'all',
  callback: (rates: RepOverrideRate[]) => void
): () => void {
  if (!db) return () => {};
  const ref = collection(db, 'teams', teamId, 'overrideRates');
  const q = leaderUid === 'all' ? query(ref) : query(ref, where('leaderUid', '==', leaderUid));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as RepOverrideRate)),
    () => callback([])
  );
}

export async function setOverrideRate(rate: RepOverrideRate): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, 'teams', rate.teamId, 'overrideRates', rateId(rate.leaderUid, rate.repUid)), rate);
}

export async function removeOverrideRate(
  teamId: string,
  leaderUid: string,
  repUid: string
): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(db, 'teams', teamId, 'overrideRates', rateId(leaderUid, repUid)));
}
