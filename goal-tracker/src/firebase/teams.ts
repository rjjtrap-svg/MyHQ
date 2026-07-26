import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { Membership, Team, UserProfile } from '@/src/types';
import { addDays, toISODate } from '@/src/lib/dates';
import { db } from './config';

const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I

export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
  }
  return code;
}

export async function createTeamAndProfile(
  uid: string,
  email: string,
  displayName: string,
  teamName: string
): Promise<string> {
  if (!db) throw new Error('Firebase is not configured.');
  const now = new Date().toISOString();
  const teamRef = doc(collection(db, 'teams'));
  const team: Team = {
    id: teamRef.id,
    name: teamName.trim() || `${displayName}'s Team`,
    ownerUid: uid,
    inviteCode: generateInviteCode(),
    salesGoal: 118,
    installGoal: 88,
    retentionPercent: 75,
    startDate: toISODate(new Date()),
    deadline: toISODate(addDays(new Date(), 60)),
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(teamRef, team);

  const membership: Membership = { uid, displayName, role: 'manager', joinedAt: now };
  await setDoc(doc(db, 'teams', teamRef.id, 'members', uid), membership);

  const profile: UserProfile = { uid, email, displayName, teamId: teamRef.id, role: 'manager', createdAt: now };
  await setDoc(doc(db, 'users', uid), profile);

  return teamRef.id;
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
  const code = generateInviteCode();
  await setDoc(doc(db, 'teams', teamId), { inviteCode: code, updatedAt: new Date().toISOString() }, { merge: true });
  return code;
}
