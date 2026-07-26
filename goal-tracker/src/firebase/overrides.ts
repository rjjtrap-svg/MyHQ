import { collection, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { CommissionOverride } from '@/src/types';
import { db } from './config';

/**
 * Managers subscribe to the whole team's overrides; a team_lead subscribes filtered to just
 * their overseen reps (pass those uids in) since Firestore rules only let a team_lead read
 * overrides for reps they oversee — an unfiltered query from a team_lead would be rejected
 * for any doc outside that set, same pattern as commissions.ts.
 */
export function subscribeOverrides(
  teamId: string,
  repUids: string[] | 'all',
  callback: (overrides: CommissionOverride[]) => void
): () => void {
  if (!db) return () => {};
  const overridesRef = collection(db, 'teams', teamId, 'overrides');

  if (repUids === 'all') {
    return onSnapshot(query(overridesRef), (snap) => callback(snap.docs.map((d) => d.data() as CommissionOverride)), () =>
      callback([])
    );
  }
  if (repUids.length === 0) {
    callback([]);
    return () => {};
  }
  // Firestore 'in' queries cap at 30 values, plenty for a team_lead's overseen reps.
  const q = query(overridesRef, where('repUid', 'in', repUids.slice(0, 30)));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => d.data() as CommissionOverride)), () => callback([]));
}

export async function setCommissionOverride(
  teamId: string,
  dealId: string,
  repUid: string,
  amount: number,
  setByUid: string
): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  const override: CommissionOverride = {
    dealId,
    teamId,
    repUid,
    amount,
    setByUid,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'teams', teamId, 'overrides', dealId), override);
}
