const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { getMessaging } = require('firebase-admin/messaging');
const vision = require('@google-cloud/vision');
const speech = require('@google-cloud/speech');
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
const CLAUDE_MODEL = 'claude-sonnet-5';

// Keep in sync with DAILY_SALE_MILESTONES in src/types/index.ts.
const DAILY_SALE_MILESTONES = [2, 6, 8, 10];

// Matches teams/{teamId}/deal-photos/{dealId}.jpg (or .jpeg/.png) — the client names the
// upload after the deal it belongs to so this function knows which Firestore doc to update.
const PHOTO_PATH_PATTERN = /^teams\/([^/]+)\/deal-photos\/([^/.]+)\.(jpg|jpeg|png)$/i;

// Heuristics to pick a name and a street address out of raw OCR lines, since Vision's
// textDetection has no idea which line is which — it just reads text. Good enough for
// typical contract/ID paperwork; the rep can always correct a wrong guess by hand.
const STREET_SUFFIXES =
  'street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct|circle|cir|' +
  'place|pl|parkway|pkwy|highway|hwy|trail|trl|terrace|ter|square|sq|loop|crossing|xing';
const ADDRESS_RE = new RegExp(`^\\d+[\\w\\s.,'-]*\\b(${STREET_SUFFIXES})\\b\\.?`, 'i');
const NAME_RE = /^[A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){1,2}$/;
const NAME_BLACKLIST =
  /\b(invoice|contract|estimate|customer|bill\s*to|ship\s*to|date|total|signature|address|phone|email|order|receipt|company|account|balance|amount|due|paid|quote|proposal)\b/i;
const MAX_FIELD_LENGTH = 80;

// Most real paperwork (CRM order screens, contracts, invoices) explicitly labels these
// fields — matching the label directly is far more reliable than guessing from bare text
// anywhere on the page, which can false-positive on unrelated capitalized text (a company
// name in a browser tab, a plan name, etc).
const NAME_LABELS = 'customer\\s*name|full\\s*name|name';
const ADDRESS_LABELS = 'service\\s*address|installation\\s*address|street\\s*address|mailing\\s*address|address';

function extractLabeledValue(lines, labelAlternation) {
  const inlineRe = new RegExp(`^(?:${labelAlternation})\\s*[:\\-]\\s*(.+)$`, 'i');
  const labelOnlyRe = new RegExp(`^(?:${labelAlternation})\\s*[:\\-]?\\s*$`, 'i');
  for (let i = 0; i < lines.length; i++) {
    const inlineMatch = lines[i].match(inlineRe);
    const inlineValue = inlineMatch?.[1]?.trim();
    if (inlineValue && inlineValue.length <= MAX_FIELD_LENGTH) return inlineValue;

    if (labelOnlyRe.test(lines[i])) {
      const next = lines[i + 1]?.trim();
      if (next && next.length <= MAX_FIELD_LENGTH) return next;
    }
  }
  return undefined;
}

function guessNameAndAddress(lines) {
  const guessedName = extractLabeledValue(lines, NAME_LABELS);
  const guessedAddress = extractLabeledValue(lines, ADDRESS_LABELS);

  // Fall back to bare pattern matching for paperwork with no explicit labels (e.g. an ID).
  return {
    guessedName: guessedName ?? lines.find((line) => NAME_RE.test(line) && !NAME_BLACKLIST.test(line) && !ADDRESS_RE.test(line)),
    guessedAddress: guessedAddress ?? lines.find((line) => ADDRESS_RE.test(line)),
  };
}

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
    const lines = fullText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 1)
      .slice(0, 20);

    const { guessedName, guessedAddress } = guessNameAndAddress(lines);
    await dealRef.set(
      {
        ocrStatus: lines.length ? 'done' : 'error',
        ocrLines: lines,
        updatedAt: new Date().toISOString(),
        ...(guessedName ? { ocrGuessedName: guessedName } : {}),
        ...(guessedAddress ? { ocrGuessedAddress: guessedAddress } : {}),
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
  const message = {
    notification: {
      title: 'Goal Tracker',
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
  return data.content?.[0]?.text ?? '';
}

/** Downloads the uploaded audio, transcodes it to 16kHz mono LINEAR16 WAV so Speech-to-Text
 * gets a format it reliably supports regardless of what the recording browser/device produced
 * (Safari, Chrome, and native all encode differently). */
async function transcodeToWav(bucketName, filePath) {
  const tmpIn = path.join(os.tmpdir(), `in-${Date.now()}${path.extname(filePath)}`);
  const tmpOut = path.join(os.tmpdir(), `out-${Date.now()}.wav`);
  await getStorage().bucket(bucketName).file(filePath).download({ destination: tmpIn });

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
    throw new HttpsError('internal', 'Could not reach the AI coach — try again in a moment.');
  }
});
