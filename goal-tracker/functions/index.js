const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const vision = require('@google-cloud/vision');

initializeApp();
const db = getFirestore();
const visionClient = new vision.ImageAnnotatorClient();

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

function guessNameAndAddress(lines) {
  let guessedName;
  let guessedAddress;
  for (const line of lines) {
    if (!guessedAddress && ADDRESS_RE.test(line)) {
      guessedAddress = line;
      continue;
    }
    if (!guessedName && NAME_RE.test(line) && !NAME_BLACKLIST.test(line) && !ADDRESS_RE.test(line)) {
      guessedName = line;
    }
    if (guessedName && guessedAddress) break;
  }
  return { guessedName, guessedAddress };
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
