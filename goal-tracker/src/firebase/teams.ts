import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import { Membership, Role, Team, UserProfile } from '@/src/types';
import { db } from './config';

const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I

/**
 * Uses a real CSPRNG (not Math.random, which is predictable) since this code is the only
 * thing gating who can join a team. getRandomBytesAsync avoids getRandomBytes' documented
 * Math.random fallback in dev builds.
 */
export async function generateInviteCode(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(6);
  let code = '';
  for (const byte of bytes) {
    code += INVITE_CODE_CHARS[byte % INVITE_CODE_CHARS.length];
  }
  return code;
}

export async function joinTeamByCode(
  uid: string,
  email: string,
  displayName: string,
  code: string
): Promise<string> {
  if (!db) throw new Error('Firebase is not configured.');
  const normalized = code.trim().toUpperCase();
  const q = query(collection(db, 'teams'), where('inviteCode', '==', normalized));
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error("That invite code doesn't match a team. Double check it with your manager.");
  }
  const teamDoc = snap.docs[0];
  const now = new Date().toISOString();

  const membership: Membership = { uid, displayName, role: 'rep', joinedAt: now };
  await setDoc(doc(db, 'teams', teamDoc.id, 'members', uid), membership);

  const profile: UserProfile = { uid, email, displayName, teamId: teamDoc.id, role: 'rep', createdAt: now };
  await setDoc(doc(db, 'users', uid), profile);

  return teamDoc.id;
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export function subscribeTeam(teamId: string, callback: (team: Team | null) => void): () => void {
  if (!db) return () => {};
  return onSnapshot(doc(db, 'teams', teamId), (snap) => {
    callback(snap.exists() ? (snap.data() as Team) : null);
  });
}

export function subscribeMembers(teamId: string, callback: (members: Membership[]) => void): () => void {
  if (!db) return () => {};
  return onSnapshot(collection(db, 'teams', teamId, 'members'), (snap) => {
    callback(snap.docs.map((d) => d.data() as Membership));
  });
}

export async function updateTeamGoal(teamId: string, partial: Partial<Team>): Promise<void> {
  if (!db) return;
  await setDoc(
    doc(db, 'teams', teamId),
    { ...partial, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}

export async function regenerateInviteCode(teamId: string): Promise<string> {
  if (!db) throw new Error('Firebase is not configured.');
  const code = await generateInviteCode();
  await setDoc(doc(db, 'teams', teamId), { inviteCode: code, updatedAt: new Date().toISOString() }, { merge: true });
  return code;
}

/** Manager-only: promote/demote a member between rep, team_lead, and manager. */
export async function updateMemberRole(teamId: string, uid: string, role: Role): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  await setDoc(doc(db, 'teams', teamId, 'members', uid), { role }, { merge: true });
}

/** Manager-only: assign (or clear, with null) which team_lead oversees a given rep. */
export async function assignOverseer(teamId: string, repUid: string, overseerUid: string | null): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  await setDoc(
    doc(db, 'teams', teamId, 'members', repUid),
    { overseerUid: overseerUid ?? deleteField() },
    { merge: true }
  );
}

/**
 * Manager-only: removes someone from the team roster (they left, went inactive, etc).
 * This only deletes their `members` doc — deals live in a separate top-level `deals`
 * collection keyed by `repUid`, never nested under the member, so their sales history stays
 * exactly where it was: still counted in team totals, still visible in the pipeline, just no
 * longer shown on the leaderboard (which is built by mapping over current `members`).
 * Their Firebase Auth account and `users/{uid}` profile are untouched, so if they come back
 * they can rejoin with a fresh invite code rather than being locked out permanently.
 */
export async function removeMember(teamId: string, uid: string): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(db, 'teams', teamId, 'members', uid));
}
