# Goal Tracker

An iPhone-first sales goal tracker for a manager, their team leads, and their reps. Every
deal requires a photo, which gets scanned and auto-fills customer details. Deals move
through a pipeline — **Sold → Installed → Paid** — with per-deal commission that's private
to the rep who earned it and the manager. A live team leaderboard shows everyone's daily
and weekly sales, with push notifications when someone hits a milestone.

Default personal targets (edit anytime in **Settings**): **118 sales** → **88 installs**
at 75% retention. Team goals are set separately by the manager.

There's also an **AI Sales Coach** (Coach tab) — reps record a practice pitch and get it
transcribed and graded by AI, ask an objection-handling assistant trained on the team's
fiber script, and reference the same script/objection guide as a training page. See
[AI Sales Coach](#ai-sales-coach) below for what it does and the extra setup it needs.

## Roles

- **Rep** — logs their own deals, sees the shared leaderboard, enters their own commission
  and door-knock counts.
- **Team Lead** — everything a rep can do, plus a private "Rep Overrides" panel (Team tab)
  for whichever reps the manager has assigned them to oversee.
- **Manager** — sees and oversees everyone; the only role that can promote/demote people
  and assign which team lead oversees which reps (**Settings → Team Members**).

Public sign-up only ever **joins** the existing team by invite code — there's no
"start a team" option anymore, so there's exactly one team, and every new account starts
as a rep. Promote people to team lead or manager from Settings.

## This requires a real Firebase project — it is not optional

Earlier versions of this app worked fully offline with no backend. That's no longer true:
team accounts, shared deal visibility, and photo/OCR all need a real server. Until you
configure Firebase (below), the app shows a "Setup needed" screen instead of the sign-in
form.

## Setting up Firebase

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com). You'll need to be on the **Blaze (pay-as-you-go)** plan — Cloud Functions and the Vision API aren't available on the free Spark plan. Both have a free tier; a sales team's normal volume of photos should cost cents to a few dollars a month.
2. **Authentication** → Sign-in method → enable **Email/Password**.
3. **Firestore Database** → create it (any region; production mode is fine, rules are provided below).
4. **Storage** → create a default bucket.
5. In Project settings, add a **Web app** and copy its config values.
6. Copy `.env.example` to `.env` and fill in the `EXPO_PUBLIC_FIREBASE_*` values. These are client-side config, not secrets — safe to ship in the app bundle. `.env` is still gitignored as hygiene.
7. **Optional, for push notifications:** Project settings → **Cloud Messaging** tab → Web Push certificates → "Generate key pair" → copy it into `EXPO_PUBLIC_FIREBASE_VAPID_KEY` in `.env`.
8. **For the AI Sales Coach** (skip if you don't want that feature yet):
   - Enable the **Cloud Speech-to-Text API** for your project: [console.cloud.google.com/apis/library/speech.googleapis.com](https://console.cloud.google.com/apis/library/speech.googleapis.com) → pick your Firebase project → **Enable**.
   - Get an API key from [console.anthropic.com](https://console.anthropic.com) (Settings → API Keys).
   - Set it as a Cloud Functions secret (never put this one in `.env` — it's a real billable credential, not client-safe config like the Firebase values above):
     ```bash
     firebase functions:secrets:set ANTHROPIC_API_KEY
     ```
     It'll prompt you to paste the key value; it's stored encrypted in Google Secret Manager, not in any file.
9. Install the [Firebase CLI](https://firebase.google.com/docs/cli) if you don't have it (`npm install -g firebase-tools`), then from the `goal-tracker/` directory:
   ```bash
   firebase login
   firebase use --add          # pick the project you just created
   cd functions && npm install && cd ..
   firebase deploy --only firestore:rules,storage,functions
   ```
   (Storage doesn't have a `rules`-only sub-target like Firestore does — `--only storage`
   deploys its rules. Using `storage:rules` fails with "Could not find rules for the
   following storage targets: rules".)

   This deploys `firestore.rules`, `storage.rules`, and all Cloud Functions in `functions/`
   (OCR, the milestone push-notification trigger, and — if you did step 8 — pitch
   transcription/grading and the objection-handling assistant).
10. Restart `expo start` (or reload the app) once `.env` is filled in.

**Note:** deploying Firebase rules and the Cloud Function needs outbound access to Google's APIs. If you're running this from a sandboxed/restricted environment, do this step from your own machine.

## Running it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, press `i` for the iOS Simulator (macOS + Xcode), or `w` for web.

## How accounts and teams work

- **Sign up** always joins the one existing team by invite code — you become a **rep**.
  The invite code lives in **Settings** and can be regenerated by the manager at any time
  (share it via text/Slack/whatever — it's just a 6-character code, not a secret credential).
- Everyone sees the same shared deal feed and leaderboard (**Team** tab). Each rep's
  **Home**/**Deals** tabs are filtered to their own deals only.
- A team's **Company** and "skip photo auto-fill" toggle (Settings, manager-only) handle
  companies like Cityside whose confirmation screens never have customer info on them —
  Add Deal skips straight to manual entry instead of showing a scan that'll never find anything.

## The deal pipeline: photo → OCR → sale → install → payout

1. Tapping **+** requires a photo (camera or library) before anything else — there's no way to log a deal without one.
2. The photo uploads to Firebase Storage at `teams/{teamId}/deal-photos/{dealId}.jpg`, and the deal is created immediately (it counts toward stats right away, matching the "every submitted deal moves you closer to your goal" goal).
3. A Storage-triggered Cloud Function (`functions/index.js`) runs the photo through Google Cloud Vision's text detection, then looks for explicit `Name:`/`Address:` labels first (falling back to regex heuristics — a line starting with a number + a street suffix like "St"/"Ave"/"Rd" is the address; a short run of capitalized words that isn't a form-label like "Invoice"/"Bill To" is the name) to guess a customer name and address.
4. Back in the app, those guesses auto-fill **Customer name** / **Address** directly — no tapping required. The rep can still edit either field by hand if the guess is wrong or nothing was detected.
5. From the **Deals** tab, a rep advances their own deal through **Sold → Installed → Paid**, enters the commission amount, or deletes the deal entirely (trash icon, with an inline confirm).

## Commission privacy and overrides

Commission is deliberately **not** stored on the shared deal document — it lives in a
separate `teams/{teamId}/commissions/{dealId}` collection with its own Firestore rules:
only the rep who earned it and the team's manager can ever read it. Other reps can see
that a teammate closed a deal (for the leaderboard) but never what they were paid.

A manager or team lead can additionally set a **commission override** on a rep's deal
(Team tab → "Rep Overrides") — a correction that lives in yet another collection
(`teams/{teamId}/overrides/{dealId}`) and is readable only by the manager and that rep's
assigned team lead. The rep it's about never sees it, by design.

## Closing % (KPIs)

Each rep can log how many doors they knocked that day (**Deals** tab → "Closing %
(KPIs)"), stored per rep per day in `teams/{teamId}/doorKnocks/`. The app divides that
day's (and week's) sales by doors knocked to show a live closing percentage.

## Milestone push notifications

When a rep hits 2, 6, 8, or 10 sales **in one day**, a Cloud Function
(`onDealCreatedNotifyMilestone`) sends a push notification to everyone on the team who's
opted in (Settings → Push Notifications → Enable Notifications). A per-rep-per-day tracking
doc prevents duplicate sends. Requires `EXPO_PUBLIC_FIREBASE_VAPID_KEY` in `.env` (see
setup above) and the function to be deployed.

**iOS note:** Safari only allows web push for a site that's been added to the Home Screen
(Share → Add to Home Screen) — a regular Safari tab can't receive push on iOS at all. This
is an Apple platform restriction, not something the app can work around.

## AI Sales Coach

The **Coach** tab opens directly on **Accountability Coach** (a segmented control switches
to the other three sections below it):

- **Accountability Coach** (default view) — an open-ended, ongoing chat with a persistent
  [Managed Agent](https://platform.claude.com/docs/en/managed-agents) (`askCoachAgent`
  callable). Unlike Objection Handling below, this one remembers the conversation across
  every message a rep sends (a single Managed Agent *session* per rep, reused turn after
  turn), so it's meant to be a "talk to it all day about anything" assistant rather than a
  one-shot Q&A — a rough day, a weird situation at a door, a win worth celebrating. A rep
  can type, snap a photo with the camera button (sent to the agent as an image, so it can
  actually see what's attached), or record a voice memo with the mic button (transcribed
  server-side — same transcode/Speech-to-Text pipeline as Grade My Pitch — before being
  sent as text). History lives in `teams/{teamId}/coachChats/{repUid}/messages` and photo/
  audio attachments in Storage under `teams/{teamId}/coach-chat-media/{repUid}/`, both
  private to that rep — not visible to managers/team leads, unlike pitch submissions.
  **Video isn't supported** — Claude can't process video today, so there's no video
  attachment button; only photos and voice memos.
- **Grade My Pitch** — a rep taps the mic and records a practice pitch (or a recap of a
  real door-knock). The audio uploads to `teams/{teamId}/pitch-audio/`, which triggers a
  Cloud Function (`onPitchAudioUploaded`) that transcodes it to WAV, sends it to Google
  Cloud Speech-to-Text, then sends the transcript to Claude along with the team's fiber
  sales script/objection guide as grading context. The rep sees a live status
  (uploading → transcribing → grading → done) and, once graded, a 0–100 score with a
  summary, strengths, and specific things to improve — stored in `pitchSubmissions/` so
  managers/team leads can review a rep's history too.
- **Objection Handling** — a rep types a question (e.g. "they said they're already under
  contract") and an `askObjectionHandling` callable function answers it in-character as a
  sales trainer, grounded in the same fiber objection guide. Stateless — each question is
  independent, unlike Accountability Coach's ongoing session.
- **Training** — a static reference page rendering the script/objection guide itself
  (approach → discovery → pitch → close, plus common objections and closing tips), so reps
  can study it without needing to ask the AI anything.

**Setup:** requires the `ANTHROPIC_API_KEY` secret and the Speech-to-Text API (see step 8
under Firebase setup above) for all three AI-backed sections — without those, Grade My
Pitch ends in an `error` status instead of a grade, and Objection Handling/Accountability
Coach fail with an error message. Accountability Coach additionally requires a Managed
Agent to already exist in the Anthropic console — the agent + execution environment ids
are hardcoded as `COACH_AGENT_ID` / `COACH_ENVIRONMENT_ID` in `functions/index.js`; update
those two constants to point at your own agent/environment.

**Cost:** separate from Firebase billing — Anthropic API and Google Cloud Speech-to-Text
are both pay-as-you-go, billed to whichever accounts own those API keys/projects. Grading
a single pitch (a few thousand tokens) and answering an objection question both cost
fractions of a cent on Claude; Speech-to-Text is billed per minute of audio; a photo sent
to Accountability Coach costs a bit more in tokens than a text-only message (images are
priced per-image on Claude), but still small change per photo.

**Editing the script:** the same content lives in two places that must be kept in sync
by hand — `src/lib/fiberScript.ts` (what the Training page renders) and
`functions/fiberScript.js` (what the Cloud Functions use as AI context) — because the
Cloud Function can't import from the app's `src/` directory.

## Project layout

```
app/                     Expo Router screens
  auth.tsx                 Sign in / join team by invite code
  add-deal.tsx              Photo capture → upload → OCR auto-fill → details
  (tabs)/index.tsx           Home — personal goal dashboard
  (tabs)/deals.tsx           My Deals — pipeline, commission entry, closing % KPIs, charts
  (tabs)/team.tsx            Team — leaderboard (today/week), commission rollup, rep overrides
  (tabs)/coach.tsx           Coach — accountability chat (default), grade my pitch, objection handling, training
  (tabs)/settings.tsx        Personal + team goals, role/overseer management, notifications

src/store/                Zustand stores
  authStore.ts               Firebase auth user + profile (role, teamId)
  teamStore.ts               Team doc + member list (realtime)
  dealsStore.ts              Team-scoped deals (realtime), stage transitions
  commissionStore.ts         Per-rep commission (realtime, access-controlled)
  overrideStore.ts           Manager/team_lead commission overrides (realtime, access-controlled)
  doorKnocksStore.ts         Per-rep-per-day door-knock counts
  pitchCoachStore.ts         Rep's pitch submissions (realtime)
  coachChatStore.ts          Rep's Accountability Coach chat history (realtime)
  settingsStore.ts / uiStore.ts   Personal, per-device (goal targets, celebrated milestones)

src/firebase/              auth.ts, teams.ts, storage.ts, commissions.ts, overrides.ts, doorKnocks.ts, pitchCoaching.ts, coachChat.ts, config.ts
src/lib/                   stats engine, dates, notifications, push (web FCM), image prep, local storage cache
src/lib/fiberScript.ts     Fiber sales script/objection guide, rendered on the Training page
functions/index.js         Cloud Vision OCR, milestone push notifications, pitch transcription/grading, objection handling, Accountability Coach chat (askCoachAgent)
functions/fiberScript.js   Same script/objection content as src/lib/fiberScript.ts, used as AI grading/coaching context
public/firebase-messaging-sw.js   Web push service worker (config passed via query string)
firestore.rules / storage.rules / firebase.json   Security rules + deploy config
```

## Notifications

Local daily reminders via `expo-notifications`, pace-aware ("You need N more sales today
to stay on pace"). Recomputed on app open/deal add/settings change since Expo's scheduler
can't compute fresh content at fire time. iOS/Android only, not supported on web.

## Live web version

A web build (React Native Web) can be deployed via `npx expo export -p web` — see
`vercel.json` (`cleanUrls`, so routes resolve without a `.html` suffix). Note that signing
up, joining a team, and photo/OCR all require the same Firebase project as native; a web
deployment without `.env` configured will just show the "Setup needed" screen.

### Branding: icon, splash, "Add to Home Screen", link previews

- **App icon / splash / favicon** (`assets/images/icon.png`, `splash-icon.png`,
  `favicon.png`, `adaptive-icon.png`) are a generated mark — a gradient progress ring
  matching the in-app circular-progress colors (`src/theme/colors.ts`), not the default
  Expo placeholder. Regenerate them by re-running the Pillow script this was built with if
  you ever want to redesign it (not checked in — ask if you need it recreated).
- **`app/+html.tsx`** sets the page `<title>`, a real `<link rel="manifest">`
  (`public/manifest.webmanifest`) and `apple-touch-icon` so "Add to Home Screen" on iOS/
  Android gets a proper name + icon and opens in its own standalone window instead of a
  plain Safari bookmark — plus Open Graph / Twitter card tags (`public/og-cover.png`) so
  pasting the link into iMessage/Slack/etc. shows a real preview card instead of a bare URL.
- **If you already added the old version to your Home Screen**, remove it and re-add it —
  iOS captures the icon at add-time and won't pick up the new one automatically.
- **If your production domain ever changes** (custom domain, new Vercel project), update
  the `SITE_URL` constant at the top of `app/+html.tsx` — the Open Graph tags need an
  absolute URL to work in most link-preview scrapers, so a stale domain there means the
  cover image silently stops showing up in shared links.

## Known trade-offs (MVP, worth knowing about before scaling this up)

- **Storage rules are coarse-grained**: any signed-in user can read/write under `teams/{teamId}/deal-photos/`, not just members of that team. Tightening this to check team membership (via Storage rules' `firestore.get()`) is a reasonable hardening step.
- **No offline write queue for deals**: unlike the old local-first design, adding a deal while offline will fail with an error rather than queue and retry — Firestore's realtime listener is now the source of truth for team-shared data, which is harder to make correctly offline-first for a multi-user shared collection.
- **OCR is a raw-line suggestion, not smart parsing**: this is intentional (see above) but a future upgrade could send the OCR text to an LLM to guess which line is a name vs. an address, with the rep still confirming.
