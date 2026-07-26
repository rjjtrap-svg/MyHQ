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
    // annotations[0] is the full detected block; the rest are individual words. The full
    // block's text, split into lines, gives usable "suggestion chunks" for the client to
    // offer as tap-to-fill chips (we don't try to guess which line is a name vs an address —
    // that's an unreliable guess without a fixed document layout, so the rep picks).
    const fullText = annotations[0]?.description ?? '';
    const lines = fullText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 1)
      .slice(0, 20);

    await dealRef.set(
      {
        ocrStatus: lines.length ? 'done' : 'error',
        ocrLines: lines,
        updatedAt: new Date().toISOString(),
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
