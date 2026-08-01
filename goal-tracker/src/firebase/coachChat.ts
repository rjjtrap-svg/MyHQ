import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { CoachChatMessage, CoachConversation } from '@/src/types';
import { db, storage, functions } from './config';

/** The id used for the flat message thread that predates conversations as their own
 * unit — kept readable forever, never migrated into the new shape (see sendCoachChatMessage). */
export const LEGACY_CONVERSATION_ID = 'legacy';

/** Live messages for one conversation. `conversationId === LEGACY_CONVERSATION_ID` reads
 * the original flat thread; any other id reads `coachChats/{repUid}/conversations/{id}/messages`. */
export function subscribeCoachConversationMessages(
  teamId: string,
  repUid: string,
  conversationId: string,
  callback: (messages: CoachChatMessage[]) => void
): () => void {
  if (!db) return () => {};
  const messagesRef =
    conversationId === LEGACY_CONVERSATION_ID
      ? collection(db, 'teams', teamId, 'coachChats', repUid, 'messages')
      : collection(db, 'teams', teamId, 'coachChats', repUid, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data() as CoachChatMessage)),
    () => callback([])
  );
}

/** Recent conversations (last 30 days) for the History list, newest first. The legacy flat
 * thread is synthesized into the same list from its own most recent message, so old history
 * shows up right alongside real conversations instead of being invisible. */
export function subscribeCoachConversations(
  teamId: string,
  repUid: string,
  callback: (conversations: CoachConversation[]) => void
): () => void {
  if (!db) return () => {};
  const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let latest: CoachConversation[] = [];
  let legacy: CoachConversation | null = null;

  function emit() {
    const all = legacy ? [legacy, ...latest] : latest;
    callback([...all].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }

  const convosQuery = query(
    collection(db, 'teams', teamId, 'coachChats', repUid, 'conversations'),
    where('updatedAt', '>=', sinceIso),
    orderBy('updatedAt', 'desc')
  );
  const unsubConvos = onSnapshot(
    convosQuery,
    (snap) => {
      latest = snap.docs.map((d) => {
        const data = d.data();
        return { id: d.id, preview: data.preview ?? '', updatedAt: data.updatedAt };
      });
      emit();
    },
    () => {
      latest = [];
      emit();
    }
  );

  // The legacy thread has no summary doc of its own — the most recent message stands in
  // for both its preview and its updatedAt, and it only shows up here if that message is
  // itself within the last 30 days, same recency rule as everything else in the list.
  const legacyQuery = query(
    collection(db, 'teams', teamId, 'coachChats', repUid, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const unsubLegacy = onSnapshot(
    legacyQuery,
    (snap) => {
      const last = snap.docs[0]?.data();
      legacy = last && last.createdAt >= sinceIso
        ? { id: LEGACY_CONVERSATION_ID, preview: String(last.text ?? '').slice(0, 80), updatedAt: last.createdAt }
        : null;
      emit();
    },
    () => {
      legacy = null;
      emit();
    }
  );

  return () => {
    unsubConvos();
    unsubLegacy();
  };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface CoachChatImageUpload {
  base64: string;
  mediaType: string;
  url: string;
  /** Storage object path — kept alongside the download URL so a later delete can remove
   * the underlying file, not just the Firestore message that references it. */
  path: string;
}

/** Uploads a photo attachment and reads it back as base64 (needed to send it as a vision
 * content block to the coach agent, alongside the Storage URL for display in the chat). */
export async function uploadCoachChatImage(
  teamId: string,
  repUid: string,
  fileId: string,
  localUri: string
): Promise<CoachChatImageUpload> {
  if (!storage) throw new Error('Firebase is not configured.');
  const response = await fetch(localUri);
  const blob = await response.blob();
  const mediaType = blob.type || 'image/jpeg';
  const ext = mediaType.includes('png') ? 'png' : 'jpg';
  const path = `teams/${teamId}/coach-chat-media/${repUid}/${fileId}.${ext}`;
  const imgRef = ref(storage, path);
  await uploadBytes(imgRef, blob, { contentType: mediaType });
  const [url, base64] = await Promise.all([getDownloadURL(imgRef), blobToBase64(blob)]);
  return { base64, mediaType, url, path };
}

export interface CoachChatAudioUpload {
  /** Storage object path (not a URL) — the Cloud Function downloads this directly to
   * transcode/transcribe it, rather than fetching the public download URL. */
  path: string;
  url: string;
}

/** Uploads a voice memo attachment. Transcription happens server-side inside askCoachAgent
 * (same transcode-to-WAV + Speech-to-Text pipeline as pitch grading), not here. */
export async function uploadCoachChatAudio(
  teamId: string,
  repUid: string,
  fileId: string,
  localUri: string
): Promise<CoachChatAudioUpload> {
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
  const path = `teams/${teamId}/coach-chat-media/${repUid}/${fileId}.${ext}`;
  const audioRef = ref(storage, path);
  await uploadBytes(audioRef, blob, { contentType: mimeType });
  const url = await getDownloadURL(audioRef);
  return { path, url };
}

/**
 * Sends a message into one conversation's Managed Agent session and returns the agent's
 * reply plus the conversation id it landed in. Pass `conversationId: null` to start a brand
 * new conversation — the function creates it server-side and hands back the real id, which
 * the caller should hold onto for the rest of that thread. The coach's long-term memory
 * (separate from any one conversation's session) carries over regardless, so a new
 * conversation is never a cold start for the coach, just a clean thread for the rep.
 */
export async function sendCoachChatMessage(
  teamId: string,
  conversationId: string | null,
  message: string,
  attachment?: { image?: CoachChatImageUpload; audio?: CoachChatAudioUpload }
): Promise<{ answer: string; conversationId: string }> {
  if (!functions) throw new Error('Firebase is not configured.');
  const callable = httpsCallable<
    {
      teamId: string;
      conversationId?: string;
      message: string;
      image?: CoachChatImageUpload;
      audio?: CoachChatAudioUpload;
    },
    { answer: string; conversationId: string }
  >(functions, 'askCoachAgent');
  const result = await callable({
    teamId,
    conversationId: conversationId ?? undefined,
    message,
    image: attachment?.image,
    audio: attachment?.audio,
  });
  return result.data;
}

/**
 * Deletes one message (in case a voice memo or photo was sent by accident). Removes both
 * the Firestore doc and, if the message had one, its Storage attachment. Only ever deletes
 * from the caller's own chat — there is no way to pass another rep's message id and have
 * it resolve to their data, since the path is always scoped to the caller's own uid.
 */
export async function deleteCoachChatMessage(teamId: string, conversationId: string, messageId: string): Promise<void> {
  if (!functions) throw new Error('Firebase is not configured.');
  const callable = httpsCallable<{ teamId: string; conversationId: string; messageId: string }, { ok: boolean }>(
    functions,
    'deleteCoachChatMessage'
  );
  await callable({ teamId, conversationId, messageId });
}
