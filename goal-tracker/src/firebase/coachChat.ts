import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { CoachChatMessage } from '@/src/types';
import { db, storage, functions } from './config';

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
  return { base64, mediaType, url };
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
 * Sends a message into the rep's ongoing Managed Agent session (creating one on first
 * use) and returns the agent's reply. The Cloud Function also writes both sides of the
 * exchange to Firestore, so `subscribeCoachChat` picks it up too — the return value here
 * just lets the UI show the answer immediately without waiting on the snapshot listener.
 */
export async function sendCoachChatMessage(
  teamId: string,
  message: string,
  attachment?: { image?: CoachChatImageUpload; audio?: CoachChatAudioUpload }
): Promise<string> {
  if (!functions) throw new Error('Firebase is not configured.');
  const callable = httpsCallable<
    {
      teamId: string;
      message: string;
      image?: CoachChatImageUpload;
      audio?: CoachChatAudioUpload;
    },
    { answer: string }
  >(functions, 'askCoachAgent');
  const result = await callable({ teamId, message, image: attachment?.image, audio: attachment?.audio });
  return result.data.answer;
}

/**
 * Clears the rep's stored Managed Agent session so their next message starts a fresh one
 * — needed because a session's instructions/knowledge are locked in for its whole
 * lifetime, so if the agent gets upgraded in the Anthropic console, an already-ongoing
 * conversation won't pick that up on its own. Existing chat history is untouched.
 */
export async function resetCoachChatSession(teamId: string): Promise<void> {
  if (!functions) throw new Error('Firebase is not configured.');
  const callable = httpsCallable<{ teamId: string }, { ok: boolean }>(functions, 'resetCoachAgentSession');
  await callable({ teamId });
}
