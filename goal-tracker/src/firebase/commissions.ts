import { collection, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { Commission } from '@/src/types';
import { db } from './config';

/**
 * Reps only ever query their own commission docs (`where repUid == self`); a manager queries
 * the whole collection unfiltered. Both shapes are required for the Firestore rule (which
 * allows read when `resource.data.repUid == request.auth.uid` OR the caller is the manager)
 * to be satisfiable — an unfiltered query from a rep would be rejected by the rules engine.
 */
export function subscribeCommissions(
  teamId: string,
  uid: string,
  isManager: boolean,
  callback: (commissions: Commission[]) => void
): () => void {
  if (!db) return () => {};

  const commissionsRef = collection(db, 'teams', teamId, 'commissions');
  const q = isManager ? query(commissionsRef) : query(commissionsRef, where('repUid', '==', uid));

  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => d.data() as Commission)), () => callback([]));
}

export async function setCommission(teamId: string, dealId: string, repUid: string, amount: number): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  const commission: Commission = {
    dealId,
    teamId,
    repUid,
    amount,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'teams', teamId, 'commissions', dealId), commission);
}
