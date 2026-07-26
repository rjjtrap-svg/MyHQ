import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { CoachChatMessage } from '@/src/types';
import { db, functions } from './config';

/** Live history of a rep's ongoing chat with the persistent Managed Agent coach. */
export function subscribeCoachChat(
  teamId: string,
  repUid: string,
  callback: (messages: CoachChatMessage[]) => void
): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'teams', teamId, 'coachChats', repUid, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as CoachChatMessage)),
    () => callback([])
  );
}

/**
 * Sends a message into the rep's ongoing Managed Agent session (creating one on first
 * use) and returns the agent's reply. The Cloud Function also writes both sides of the
 * exchange to Firestore, so `subscribeCoachChat` picks it up too — the return value here
 * just lets the UI show the answer immediately without waiting on the snapshot listener.
 */
export async function sendCoachChatMessage(teamId: string, message: string): Promise<string> {
  if (!functions) throw new Error('Firebase is not configured.');
  const callable = httpsCallable<{ teamId: string; message: string }, { answer: string }>(functions, 'askCoachAgent');
  const result = await callable({ teamId, message });
  return result.data.answer;
}
