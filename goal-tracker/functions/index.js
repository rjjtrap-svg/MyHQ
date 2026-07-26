const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const vision = require('@google-cloud/vision');

initializeApp();
const db = getFirestore();
const visionClient = new vision.ImageAnnotatorClient();

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
