const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const { parseDealFields } = require('./ocrParse');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { getMessaging } = require('firebase-admin/messaging');
const vision = require('@google-cloud/vision');
const speech = require('@google-cloud/speech');
const Anthropic = require('@anthropic-ai/sdk');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { FIBER_SALES_CONTEXT } = require('./fiberScript');

ffmpeg.setFfmpegPath(ffmpegPath);

initializeApp();
const db = getFirestore();
const visionClient = new vision.ImageAnnotatorClient();
const speechClient = new speech.SpeechClient();
const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY');
// Opus is the right default for a coach that's judging pitches and giving advice — swap to
// 'claude-sonnet-5' here if you'd rather trade some quality for a noticeably cheaper bill.
const CLAUDE_MODEL = 'claude-opus-5';

// The persistent Managed Agent backing "Ask Coach Anything" — created once in the
// Anthropic console, distinct from the plain Messages-API calls (callClaude below) used
// for pitch grading/objection handling. A Managed Agent keeps its own memory across turns
// via sessions, so unlike those two, this doesn't need FIBER_SALES_CONTEXT stuffed into
// every call — the agent's own configuration already knows what it's for.
const COACH_AGENT_ID = 'agent_01XyRX1aWbz2ubMAB4ddyWXT';
const COACH_ENVIRONMENT_ID = 'env_01RWT3z2Z55cB78jNdGyTuKM';

// Keep in sync with DAILY_SALE_ALERTS in src/types/index.ts.
const DAILY_SALE_ALERTS = [
  { count: 2, title: 'Heating Up 🔥' },
  { count: 4, title: 'On Fire 🔥🔥🔥' },
  { count: 6, title: 'Burning Up 🔥🔥🔥🔥🔥' },
  { count: 8, title: 'Selling Frenzy 🔥🔥🔥🔥🔥🔥🔥' },
  { count: 10, title: "Daddy's Home 🍆🍆🍆" },
];
const DAILY_SALE_MILESTONES = DAILY_SALE_ALERTS.map((a) => a.count);

// Matches teams/{teamId}/deal-photos/{dealId}.jpg (or .jpeg/.png) — the client names the
// upload after the deal it belongs to so this function knows which Firestore doc to update.
const PHOTO_PATH_PATTERN = /^teams\/([^/]+)\/deal-photos\/([^/.]+)\.(jpg|jpeg|png)$/i;

// Heuristics to pick a name and a street address out of raw OCR lines, since Vision's
// textDetection has no idea which line is which — it just reads text. Good enough for
// typical contract/ID paperwork; the rep can always correct a wrong guess by hand.
// Must match the region of the Storage bucket it listens to — a storage-triggered
// function can't be in a different region than the bucket. us-east1 is Firebase's
// default Storage bucket region for newer projects; change this if yours differs
// (the error message from `firebase deploy` will say which region it expects).
exports.onDealPhotoUploaded = onObjectFinalized({ region: 'us-east1', cpu: 1 }, async (event) => {
  const filePath = event.data.name;
  const bucketName = event.data.bucket;

  const match = filePath.match(PHOTO_PATH_PATTERN);
  if (!match) {
    console.log('Ignoring upload outside deal-photos path:', filePath);
    return;
  }
  const [, teamId, dealId] = match;
  const dealRef = db.collection('teams').doc(teamId).collection('deals').doc(dealId);

  try {
    const [result] = await visionClient.textDetection(`gs://${bucketName}/${filePath}`);
    const annotations = result.textAnnotations || [];
    // annotations[0] is the full detected block; the rest are individual words.
    const fullText = annotations[0]?.description ?? '';
    const allLines = fullText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 1);

    // Parse the WHOLE document. The previous version sliced to the first 20 lines, and on a
    // real CRM confirmation screen the customer block sits below 20 lines of header, nav and
    // plan chrome — so the label matcher never saw the fields it was looking for.
    const parsed = parseDealFields(allLines);
    // Only the first 40 lines are stored for the tap-to-fill fallback list; the rest is
    // page furniture nobody would pick from.
    const lines = allLines.slice(0, 40);
    await dealRef.set(
      {
        ocrStatus: lines.length ? 'done' : 'error',
        ocrLines: lines,
        updatedAt: new Date().toISOString(),
        ...(parsed.name ? { ocrGuessedName: parsed.name } : {}),
        ...(parsed.address ? { ocrGuessedAddress: parsed.address } : {}),
        ...(parsed.firstName ? { ocrGuessedFirstName: parsed.firstName } : {}),
        ...(parsed.lastName ? { ocrGuessedLastName: parsed.lastName } : {}),
        ...(parsed.phone ? { ocrGuessedPhone: parsed.phone } : {}),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('OCR failed for', filePath, err);
    await dealRef
      .set({ ocrStatus: 'error', updatedAt: new Date().toISOString() }, { merge: true })
      .catch(() => {});
  }
});

// Fires a push notification to the whole team the moment a rep crosses a daily sale
// milestone (2/6/8/10 sales *that day*). A per-rep-per-day tracking doc prevents duplicate
// sends if this trigger somehow runs more than once for the same deal.
exports.onDealCreatedNotifyMilestone = onDocumentCreated('teams/{teamId}/deals/{dealId}', async (event) => {
  const deal = event.data?.data();
  if (!deal || !deal.repUid || !deal.date) return;
  const { teamId } = event.params;

  const dealsForDaySnap = await db
    .collection('teams')
    .doc(teamId)
    .collection('deals')
    .where('repUid', '==', deal.repUid)
    .where('date', '==', deal.date)
    .get();
  const countToday = dealsForDaySnap.size;

  const crossed = DAILY_SALE_MILESTONES.filter((m) => countToday >= m);
  if (crossed.length === 0) return;

  const milestoneRef = db
    .collection('teams')
    .doc(teamId)
    .collection('dailyMilestones')
    .doc(`${deal.repUid}_${deal.date}`);

  const newlyCrossed = await db.runTransaction(async (tx) => {
    const snap = await tx.get(milestoneRef);
    const already = snap.exists ? snap.data().remindedThresholds || [] : [];
    const fresh = crossed.filter((m) => !already.includes(m));
    if (fresh.length === 0) return [];
    tx.set(milestoneRef, { remindedThresholds: [...already, ...fresh] }, { merge: true });
    return fresh;
  });
  if (newlyCrossed.length === 0) return;

  const tokensSnap = await db.collection('pushTokens').where('teamId', '==', teamId).get();
  const tokens = tokensSnap.docs.map((d) => d.data().token).filter(Boolean);
  if (tokens.length === 0) return;

  const highest = Math.max(...newlyCrossed);
  const alert = DAILY_SALE_ALERTS.find((a) => a.count === highest);
  const message = {
    notification: {
      title: alert ? alert.title : 'Goal Tracker',
      body: `${deal.repName || 'A rep'} just hit ${highest} sales today!`,
    },
    tokens,
  };

  try {
    const response = await getMessaging().sendEachForMulticast(message);
    const deadTokens = [];
    response.responses.forEach((r, i) => {
      if (!r.success && r.error?.code === 'messaging/registration-token-not-registered') {
        deadTokens.push(tokens[i]);
      }
    });
    await Promise.all(
      deadTokens.map((t) =>
        db
          .collection('pushTokens')
          .doc(t)
          .delete()
          .catch(() => {})
      )
    );
  } catch (err) {
    console.error('Failed to send milestone push notification', err);
  }
});

// Matches teams/{teamId}/pitch-audio/{submissionId}.<ext> — same naming convention as the
// deal-photo pipeline: the client names the upload after the Firestore doc it belongs to.
const PITCH_AUDIO_PATTERN = /^teams\/([^/]+)\/pitch-audio\/([^/.]+)\.\w+$/i;

async function callClaude(apiKey, system, userMessage, maxTokens) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Claude API error ${response.status}: ${text.slice(0, 500)}`);
  }
  const data = await response.json();
  // Claude Opus 5 thinks by default (adaptive), so `content` often starts with a
  // `thinking` block ahead of the `text` block — content[0].text was silently undefined
  // whenever that happened, making every call look like it "succeeded" with no answer.
  const textBlock = (data.content || []).find((block) => block.type === 'text');
  return textBlock?.text ?? '';
}

/** Downloads the uploaded audio, transcodes it to 16kHz mono LINEAR16 WAV so Speech-to-Text
 * gets a format it reliably supports regardless of what the recording browser/device produced
 * (Safari, Chrome, and native all encode differently). `bucketName` is optional — pass
 * undefined to use the project's default bucket (the coach chat flow doesn't have a Storage
 * trigger event to read a bucket name off of, unlike the pitch-audio pipeline below). */
async function transcodeToWav(bucketName, filePath) {
  const tmpIn = path.join(os.tmpdir(), `in-${Date.now()}${path.extname(filePath)}`);
  const tmpOut = path.join(os.tmpdir(), `out-${Date.now()}.wav`);
  const bucket = bucketName ? getStorage().bucket(bucketName) : getStorage().bucket();
  await bucket.file(filePath).download({ destination: tmpIn });

  await new Promise((resolve, reject) => {
    ffmpeg(tmpIn)
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec('pcm_s16le')
      .format('wav')
      .on('error', reject)
      .on('end', resolve)
      .save(tmpOut);
  });

  const wavBuffer = fs.readFileSync(tmpOut);
  fs.unlink(tmpIn, () => {});
  fs.unlink(tmpOut, () => {});
  return wavBuffer;
}

async function transcribeWav(wavBuffer) {
  const [operation] = await speechClient.longRunningRecognize({
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
      model: 'default',
    },
    audio: { content: wavBuffer.toString('base64') },
  });
  const [response] = await operation.promise();
  return (response.results || [])
    .map((r) => r.alternatives?.[0]?.transcript || '')
    .join(' ')
    .trim();
}

const GRADE_PROMPT_SUFFIX = `
Grade the practice pitch transcript below against the script and objection guide. Respond
with ONLY a JSON object (no markdown fences, no other text) in exactly this shape:
{"grade": <integer 0-100>, "summary": "<2-3 sentence overall assessment>", "strengths": ["<short point>", ...], "improvements": ["<short point>", ...]}
Keep strengths and improvements to 2-4 items each, short and specific to what was actually said.

TRANSCRIPT:
`;

// Storage-triggered: transcodes the recording, transcribes it, then has Claude grade it
// against the fiber sales script. Needs more memory/time than the OCR function since audio
// transcoding + a longer AI response take longer than a quick image scan.
exports.onPitchAudioUploaded = onObjectFinalized(
  { region: 'us-east1', cpu: 1, memory: '1GiB', timeoutSeconds: 300, secrets: [anthropicApiKey] },
  async (event) => {
    const filePath = event.data.name;
    const bucketName = event.data.bucket;
    const match = filePath.match(PITCH_AUDIO_PATTERN);
    if (!match) {
      console.log('Ignoring upload outside pitch-audio path:', filePath);
      return;
    }
    const [, teamId, submissionId] = match;
    const subRef = db.collection('teams').doc(teamId).collection('pitchSubmissions').doc(submissionId);

    try {
      await subRef.set({ status: 'transcribing', updatedAt: new Date().toISOString() }, { merge: true });
      const wavBuffer = await transcodeToWav(bucketName, filePath);
      const transcript = await transcribeWav(wavBuffer);

      if (!transcript) {
        await subRef.set(
          { status: 'error', errorMessage: 'No speech detected in the recording.', updatedAt: new Date().toISOString() },
          { merge: true }
        );
        return;
      }

      await subRef.set({ status: 'grading', transcript, updatedAt: new Date().toISOString() }, { merge: true });

      const raw = await callClaude(
        anthropicApiKey.value(),
        FIBER_SALES_CONTEXT,
        GRADE_PROMPT_SUFFIX + transcript,
        1024
      );
      const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ''));

      await subRef.set(
        {
          status: 'done',
          grade: parsed.grade,
          summary: parsed.summary,
          strengths: parsed.strengths || [],
          improvements: parsed.improvements || [],
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Pitch grading failed for', filePath, err);
      await subRef
        .set({ status: 'error', errorMessage: String(err.message || err), updatedAt: new Date().toISOString() }, { merge: true })
        .catch(() => {});
    }
  }
);

// Callable from the client: a rep asks a live objection-handling question and gets an answer
// grounded in the fiber sales script above.
exports.askObjectionHandling = onCall({ region: 'us-east1', secrets: [anthropicApiKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }
  const question = String(request.data?.question || '').trim();
  if (!question) {
    throw new HttpsError('invalid-argument', 'Question is required.');
  }
  if (question.length > 2000) {
    throw new HttpsError('invalid-argument', 'Question is too long.');
  }

  try {
    const answer = await callClaude(
      anthropicApiKey.value(),
      FIBER_SALES_CONTEXT,
      `A rep in the field is asking for help handling this situation at the door:\n\n"${question}"\n\nGive a short, practical, spoken-word response they could actually say, grounded in the objection guide above. 2-4 sentences.`,
      512
    );
    return { answer };
  } catch (err) {
    console.error('Objection handling request failed', err);
    // Deliberately not 'internal'/'unknown' — the callable-functions client SDK redacts
    // the message text for those two codes specifically and shows a bare "internal"
    // string instead, no matter what's passed here. 'unavailable' still reaches the client.
    throw new HttpsError('unavailable', 'Could not reach the AI coach — try again in a moment.');
  }
});

/** Sends one message into a Managed Agent session and waits for its full reply, collecting
 * incremental `agent.message` deltas rather than the whole event log (so a long-running
 * chat doesn't re-read earlier turns on every call) and stopping at `session.status_idle`. */
async function runCoachAgentTurn(anthropic, sessionId, content) {
  await anthropic.beta.sessions.events.send(sessionId, {
    events: [{ type: 'user.message', content }],
  });

  let answer = '';
  const stream = await anthropic.beta.sessions.events.stream(sessionId, { event_deltas: ['agent.message'] });
  for await (const event of stream) {
    if (event.type === 'event_delta' && event.event?.type === 'agent.message') {
      const block = event.event.content?.[0];
      if (block?.type === 'text') answer += block.text;
    } else if (event.type === 'agent.message') {
      answer = (event.content || []).map((b) => b.text || '').join('');
    } else if (event.type === 'session.status_idle') {
      break;
    }
  }
  return answer.trim();
}

const MAX_COACH_CHAT_MESSAGE_LENGTH = 4000;

// Mirrors firestore.rules' isTeamMember(teamId): membership is a doc at
// teams/{teamId}/members/{uid}, not an array field on the team doc. Cloud Functions use
// the admin SDK and bypass Firestore rules entirely, so callables that take a
// client-supplied teamId must check this themselves rather than relying on rules.
async function assertTeamMember(teamId, uid) {
  const memberSnap = await db.collection('teams').doc(teamId).collection('members').doc(uid).get();
  if (!memberSnap.exists) {
    throw new HttpsError('permission-denied', 'Not a member of this team.');
  }
}

// Callable from the client: a rep's freeform chat with the persistent Managed Agent coach
// ("Accountability Coach" — Coach tab, default view). Split into conversations, each its
// own Managed Agent session — pass an existing `conversationId` to continue one, or omit it
// to start a new one (the function creates it and returns the real id). A message can be
// plain text, a photo (sent to the agent as a vision content block), or a voice memo
// (transcribed server-side first, reusing the same transcode/transcribe pipeline as pitch
// grading) — never more than one attachment per message, matching the app's single
// "camera" / "mic" buttons.
exports.askCoachAgent = onCall({ region: 'us-east1', secrets: [anthropicApiKey], timeoutSeconds: 300 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }
  const teamId = String(request.data?.teamId || '').trim();
  const requestedConversationId = request.data?.conversationId ? String(request.data.conversationId).trim() : null;
  const message = String(request.data?.message || '').trim();
  const image = request.data?.image;
  const audio = request.data?.audio;

  if (!teamId) {
    throw new HttpsError('invalid-argument', 'teamId is required.');
  }
  if (!message && !image && !audio) {
    throw new HttpsError('invalid-argument', 'Say something, attach a photo, or record a voice memo.');
  }
  if (message.length > MAX_COACH_CHAT_MESSAGE_LENGTH) {
    throw new HttpsError('invalid-argument', 'Message is too long.');
  }
  if (image && (!image.base64 || !image.mediaType || !image.url || !image.path)) {
    throw new HttpsError('invalid-argument', 'Malformed image attachment.');
  }

  const repUid = request.auth.uid;
  await assertTeamMember(teamId, repUid);

  // Both attachment paths are client-supplied and get stored for later use (audio is
  // downloaded from Storage server-side below; both get deleted from Storage if the
  // message is ever deleted) — without this check a caller could point either at ANY
  // object in the bucket (another team's deal-photos, another rep's pitch-audio, etc.),
  // not just their own chat media.
  const expectedPathPrefix = `teams/${teamId}/coach-chat-media/${repUid}/`;
  function assertOwnMediaPath(path) {
    if (typeof path !== 'string' || path.includes('..') || !path.startsWith(expectedPathPrefix)) {
      throw new HttpsError('invalid-argument', 'Invalid attachment path.');
    }
  }

  if (audio) {
    if (!audio.path || !audio.url) {
      throw new HttpsError('invalid-argument', 'Malformed audio attachment.');
    }
    assertOwnMediaPath(audio.path);
  }
  if (image) {
    assertOwnMediaPath(image.path);
  }

  const chatRef = db.collection('teams').doc(teamId).collection('coachChats').doc(repUid);
  const conversationsRef = chatRef.collection('conversations');

  try {
    const anthropic = new Anthropic({ apiKey: anthropicApiKey.value() });
    const now = new Date().toISOString();

    const chatSnap = await chatRef.get();
    const chatData = chatSnap.exists ? chatSnap.data() : {};

    // A session's own context dies with the session, so a new conversation on its own
    // would give the rep an amnesiac coach. A memory store is workspace-scoped and
    // outlives every session: it's mounted into each new session as a directory the agent
    // reads and writes with ordinary file tools, so what it learned about this rep in
    // January is still there in June, across any number of conversations. One store per
    // rep — never shared, and never per-conversation — since it holds personal coaching
    // notes that need to persist across the History list, not just within one thread.
    let memoryStoreId = chatData.memoryStoreId;
    if (!memoryStoreId) {
      const store = await anthropic.beta.memoryStores.create({
        name: `coach-${teamId}-${repUid}`,
        description:
          'Long-term coaching notes for one sales rep: their goals, recurring struggles, ' +
          'what advice has and has not worked, personal context they have shared, and ' +
          'notable wins. Read this at the start of every conversation and keep it current.',
      });
      memoryStoreId = store.id;
    }
    await chatRef.set({ repUid, teamId, memoryStoreId, updatedAt: now }, { merge: true });

    let conversationRef;
    let sessionId;
    let isNewConversation;
    if (requestedConversationId) {
      conversationRef = conversationsRef.doc(requestedConversationId);
      const conversationSnap = await conversationRef.get();
      if (!conversationSnap.exists) {
        throw new HttpsError('not-found', 'That conversation no longer exists.');
      }
      sessionId = conversationSnap.data().sessionId;
      isNewConversation = false;
    } else {
      const session = await anthropic.beta.sessions.create({
        agent: COACH_AGENT_ID,
        environment_id: COACH_ENVIRONMENT_ID,
        resources: [
          {
            type: 'memory_store',
            memory_store_id: memoryStoreId,
            access: 'read_write',
            instructions:
              'Your long-term memory of this rep, carried over from every previous ' +
              'conversation. Read it before you answer the first message so you pick up ' +
              'where you left off instead of starting cold. As the conversation goes on, ' +
              'write down anything worth remembering next time — their goals, what they ' +
              'are struggling with, advice that landed, wins, and personal context. Keep ' +
              'it organized as small topic files and update stale notes rather than ' +
              'appending duplicates.',
          },
        ],
      });
      sessionId = session.id;
      conversationRef = conversationsRef.doc();
      isNewConversation = true;
    }
    const conversationId = conversationRef.id;
    const messagesRef = conversationRef.collection('messages');

    // Build both the content sent to the agent and the plain-text version stored/shown in
    // Firestore — a voice memo's "text" is its transcript, since there's nothing else to show.
    let displayText = message;
    let attachmentType;
    let attachmentUrl;
    let attachmentPath;
    const content = [];

    if (audio) {
      const wavBuffer = await transcodeToWav(undefined, audio.path);
      const transcript = await transcribeWav(wavBuffer);
      if (!transcript) {
        throw new HttpsError('invalid-argument', 'Could not make out any speech in that recording.');
      }
      displayText = message ? `${message}\n\n"${transcript}"` : transcript;
      attachmentType = 'audio';
      attachmentUrl = audio.url;
      attachmentPath = audio.path;
      content.push({ type: 'text', text: displayText });
    } else if (image) {
      attachmentType = 'image';
      attachmentUrl = image.url;
      attachmentPath = image.path;
      displayText = message || '(photo attached)';
      if (message) content.push({ type: 'text', text: message });
      content.push({ type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.base64 } });
    } else {
      content.push({ type: 'text', text: message });
    }

    // Preview is set once, from the conversation's first message — later messages update
    // updatedAt (for History's recency sort/filter) but leave the label alone.
    await conversationRef.set(
      {
        sessionId,
        updatedAt: now,
        ...(isNewConversation ? { startedAt: now, preview: displayText.slice(0, 80) } : {}),
      },
      { merge: true }
    );

    const userMsgRef = messagesRef.doc();
    await userMsgRef.set({
      id: userMsgRef.id,
      role: 'user',
      text: displayText,
      ...(attachmentType ? { attachmentType, attachmentUrl, attachmentPath } : {}),
      createdAt: now,
    });

    const answer = await runCoachAgentTurn(anthropic, sessionId, content);
    if (!answer) {
      throw new Error('No reply received from the coach agent.');
    }

    const agentMsgRef = messagesRef.doc();
    await agentMsgRef.set({ id: agentMsgRef.id, role: 'agent', text: answer, createdAt: new Date().toISOString() });

    return { answer, conversationId };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error('askCoachAgent failed', err);
    // See the comment on the same pattern in askObjectionHandling above — 'unavailable'
    // instead of 'internal' so this message actually reaches the client.
    throw new HttpsError('unavailable', 'Could not reach the AI coach — try again in a moment.');
  }
});

// Callable from the client: deletes one message from one of the rep's own Accountability
// Coach conversations (e.g. an accidental voice memo or photo) — the Firestore doc, plus
// its Storage attachment if it had one. Pass conversationId === 'legacy' to delete from the
// original flat thread that predates conversations as their own unit; any other id targets
// that conversation's messages. Always scoped to the caller's own chat: the doc path is
// under teams/{teamId}/coachChats/{request.auth.uid}/..., so there's no way to pass another
// rep's message id and have it resolve to their data.
exports.deleteCoachChatMessage = onCall({ region: 'us-east1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }
  const teamId = String(request.data?.teamId || '').trim();
  const conversationId = String(request.data?.conversationId || '').trim();
  const messageId = String(request.data?.messageId || '').trim();
  if (!teamId || !conversationId || !messageId) {
    throw new HttpsError('invalid-argument', 'teamId, conversationId, and messageId are required.');
  }
  await assertTeamMember(teamId, request.auth.uid);

  const chatRef = db.collection('teams').doc(teamId).collection('coachChats').doc(request.auth.uid);
  const messageRef =
    conversationId === 'legacy'
      ? chatRef.collection('messages').doc(messageId)
      : chatRef.collection('conversations').doc(conversationId).collection('messages').doc(messageId);

  const snap = await messageRef.get();
  if (!snap.exists) {
    return { ok: true };
  }
  const attachmentPath = snap.data().attachmentPath;
  await messageRef.delete();

  if (attachmentPath) {
    await getStorage()
      .bucket()
      .file(attachmentPath)
      .delete()
      .catch((err) => console.error('Failed to delete coach chat attachment', attachmentPath, err));
  }

  return { ok: true };
});

// ---------------------------------------------------------------------------
// Deal follow-ups
// ---------------------------------------------------------------------------

/** The Friday on or after `iso` (yyyy-mm-dd). An install on a Friday rolls to the next
 * one, since that day's work isn't on that day's cheque. Mirrors fridayAfter() in
 * src/lib/dealFollowUps.ts — keep the two in sync. */
function fridayAfter(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const daysUntilFriday = (5 - date.getUTCDay() + 7) % 7;
  date.setUTCDate(date.getUTCDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
  return date.toISOString().slice(0, 10);
}

function dealLabel(deal) {
  return (
    deal.customerName ||
    [deal.firstName, deal.lastName].filter(Boolean).join(' ') ||
    deal.address ||
    'a deal'
  );
}

async function pushToRep(repUid, title, body) {
  const tokensSnap = await db.collection('pushTokens').where('uid', '==', repUid).get();
  const tokens = tokensSnap.docs.map((d) => d.data().token).filter(Boolean);
  if (tokens.length === 0) return;

  const response = await getMessaging().sendEachForMulticast({ notification: { title, body }, tokens });
  const dead = [];
  response.responses.forEach((r, i) => {
    if (!r.success && r.error?.code === 'messaging/registration-token-not-registered') {
      dead.push(tokens[i]);
    }
  });
  await Promise.all(dead.map((t) => db.collection('pushTokens').doc(t).delete().catch(() => {})));
}

/**
 * Once a day, nudge reps about deals that have gone quiet:
 *
 *  - the booked install date has passed but the deal is still sitting in "sold", so nobody
 *    has confirmed whether the tech actually showed up; and
 *  - the job is installed but unpaid, and the first Friday after the install has come and
 *    gone — the payday when that commission should have landed.
 *
 * Each nudge is stamped on the deal so it goes out once rather than every morning until
 * the rep gets around to it. The Deals tab shows the same list in-app, so this is a
 * convenience on top of that rather than the only way a rep finds out.
 */
exports.dealFollowUpReminders = onSchedule(
  { schedule: '0 9 * * *', timeZone: 'America/New_York', region: 'us-east1' },
  async () => {
    const today = new Date().toISOString().slice(0, 10);
    const teamsSnap = await db.collection('teams').get();

    for (const teamDoc of teamsSnap.docs) {
      // Only deals that are still in flight can need a nudge.
      const dealsSnap = await teamDoc.ref
        .collection('deals')
        .where('stage', 'in', ['sold', 'installed'])
        .get();

      for (const dealDoc of dealsSnap.docs) {
        const deal = dealDoc.data();
        if (!deal.scheduledInstallDate || !deal.repUid || deal.deletedAt) continue;

        if (deal.stage === 'sold' && !deal.installPromptSentAt && deal.scheduledInstallDate <= today) {
          await pushToRep(
            deal.repUid,
            'Install check',
            `Did ${dealLabel(deal)} get installed? Update the deal if it's done.`
          );
          await dealDoc.ref.set({ installPromptSentAt: new Date().toISOString() }, { merge: true });
          continue;
        }

        if (deal.stage === 'installed' && !deal.payPromptSentAt) {
          if (fridayAfter(deal.scheduledInstallDate) <= today) {
            await pushToRep(
              deal.repUid,
              'Payday check',
              `Did the pay come through for ${dealLabel(deal)}?`
            );
            await dealDoc.ref.set({ payPromptSentAt: new Date().toISOString() }, { merge: true });
          }
        }
      }
    }
  }
);
