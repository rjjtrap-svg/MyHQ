# Working in this repo

Read this before making changes. It applies to any agent or person working here.

## What this is

`goal-tracker/` is the whole product: an Expo (SDK 52) app for a door-to-door fiber sales
team, deployed as a PWA on Vercel and backed by Firebase (Auth, Firestore, Storage, Cloud
Functions, Cloud Messaging). Everything else at the repo root is notes and scratch.

- **Live:** https://goal-tracker-nu-beige.vercel.app
- **Expo has changed** — read https://docs.expo.dev/versions/v52.0.0/ before writing Expo
  code. Do not rely on recalled API shapes.

## Multi-agent ground rules

More than one agent may be working here at once. To avoid trampling each other:

1. **Never work directly on `main`.** Branch, then open a PR.
2. **Say which files you're taking** before you start, and stay inside them. The high-churn
   files are `app/(tabs)/*.tsx`, `src/theme/*`, and `functions/index.js` — two agents editing
   any of those at once will conflict.
3. **Rebase before you push** (`git pull --rebase origin main`). Don't force-push a shared
   branch.
4. **Small, complete commits.** A commit that leaves `npx tsc --noEmit` failing blocks
   everyone else.

### Lanes

Two agents work this repo, and they own different halves. Stay in your lane and the
merge is trivial; cross lanes and every handoff becomes a hand-reconciliation.

| Lane | Owns | Does not touch |
|---|---|---|
| **Feature/UI agent** | `app/**` (screens, routing), `src/components/**` (new components) | `src/theme/*`, `src/lib/*`, `functions/*`, `*.rules` |
| **Engine/review agent** | `src/lib/**`, `src/store/**`, `src/theme/**`, `functions/**`, `firestore.rules`, `storage.rules`, `tools/**` | `app/(tabs)/*.tsx` while the other agent holds them |

Design tokens are shared but single-owner: the engine agent adds tokens to
`src/theme/*`; the UI agent consumes them and never edits that directory. If the UI
agent needs a colour or type style that doesn't exist, it says so rather than
hardcoding a hex.

**Currently claimed:** `src/components/lockin/**` and the Lock In wiring in
`app/(tabs)/coach.tsx` are held by the engine agent, not the UI agent — the lane table
above is the default, not a rule the owner can't override. Check here before starting
on either.

### Handing work between agents

An agent that cannot push to `origin` is still expected to produce a reviewable,
replayable patch — not a description of what it did:

```bash
git format-patch <base>..HEAD --stdout --binary
```

`format-patch` preserves commit boundaries, messages and authorship, and `--binary`
survives asset changes; a pasted `git diff` silently corrupts binary files. The
receiving agent applies it with `git am` onto a fresh branch, never on top of
existing unpushed work.

**Report only what a command actually printed.** A SHA that exists solely in a
sandbox is not pushed, and describing it as pushed has already cost this project a
full round of wasted work twice. If `git push` did not run, say it did not run.

## Before you commit — always

```bash
cd goal-tracker
npx tsc --noEmit                  # must be clean
npx expo export -p web --clear    # must succeed
node --check functions/index.js   # if you touched Cloud Functions
```

There is no test suite. Type-check plus a successful web export is the gate.

## Design system

The app has a deliberate visual identity. Don't reintroduce ad-hoc styles — everything below
already exists, so use it rather than rebuilding it.

**Palette** — `src/theme/colors.ts`. Cream/brown. Never hardcode a hex in a component; if a
colour is missing, add a token. Alert colours are `dangerSurface` / `dangerBorder` /
`dangerText`.

**Type** — `src/theme/index.ts`:
- `typography.eyebrow` — small caps, wide tracking. All labels. It already sets
  `textTransform: 'uppercase'`; don't set it again at the call site.
- `typography.scoreValue` — serif numerals. All stat/metric numbers.
- `typography.quote` — serif italic. Pull quotes only.
- `statLabel` / `statValue` are **gone**. Don't reintroduce them.

**Shared components** — use these instead of hand-rolling:
- `ScreenHeader` — every top-level screen opens with it (eyebrow, title, mark, hairline rule).
- `Button` / `SegmentedToggle` — all buttons and tab switches.
- `Banner` — all inline error/info messages.
- `Section` — section headings (gold tick + hairline).
- `StatTile` — metric tiles.
- `Mark` — the brand mark.

**The mark** is `src/components/Mark.tsx`: a door, built from a gold frame, a handle and a
strip of `primary` light through the gap. Three primitives, so it stays legible at 20px in a
header and at 48px on a full-page state. It replaced `Emblem` (an ouroboros dragon of a few
hundred hand-drawn polygons) and `WaveRule` (a seigaiha squiggle band) — both were removed
for reading as cartoon ornament rather than as a product. **Don't reintroduce either, and
don't add decorative flourishes to carry brand.** Brand here is the palette, the type scale
and the spacing.

**The launcher icon has not been re-cut yet and still shows the old dragon.** So the icon on
the home screen no longer matches the mark inside the app. `tools/generate_icon.py` is the
source of truth for the icon and `tools/generate_assets.py` writes every
icon/splash/favicon/OG file from it; re-cutting both from the door geometry is an open job.
Until it's done, expect the mismatch — don't "fix" it by putting the dragon back.

## Domain rules that are easy to get wrong

- **A cancelled deal is not a sale.** `stage === 'cancelled'` is excluded from every stat —
  goal progress, streaks, close rate, commission totals, override earnings. Three places
  count deals and all three filter it: `src/lib/stats.ts` and `src/lib/profileStats.ts` in
  their `activeDeals()`, and `src/lib/overrideEarnings.ts` in `qualifying()`. If you add a
  fourth, filter it there too — on the override path this is money leaving the business for
  a deal that fell through.
- **Two different things are called "override".** `CommissionOverride` is a manager's
  correction to one rep's commission on one deal. `RepOverrideRate` is a standing per-deal
  rate a leader earns on a rep's production. Separate collections, separate rules. Don't
  merge them.
- **Commission is private.** Readable only by the rep who earned it and the manager, enforced
  in `firestore.rules`. Teammate profiles pass `showMoney={false}` for this reason — don't
  "fix" that by showing money.
- **Coach chat is deliberately not visible to managers.** It's meant to be judgment-free.
- **The Lock In library** (`src/lib/lockIn.ts`) distinguishes `kind: 'quote'` (real words,
  shown in quotation marks) from `kind: 'idea'` (a summary of someone's framework, in our
  words, tagged "idea"). **Never add a quote you can't source.** If you're unsure of the
  wording, write it as an `idea`. Putting invented words in a real person's mouth is the one
  thing that must not happen in that file.

## Claude API code

`functions/index.js` calls Claude two ways, and they are not interchangeable:
- **Stateless** (`callClaude`) for pitch grading and objection handling.
- **Managed Agent sessions** for the Accountability Coach, with a per-rep memory store
  attached to every session so a new conversation still remembers the rep.

Claude Opus 5 has adaptive thinking on by default, so `content[0]` is often a `thinking`
block. Always scan for the first `type === 'text'` block — reading `content[0].text` returns
`undefined` and silently produces an empty answer. This bug has already been fixed once.

## Deploying

- **Frontend:** Vercel builds automatically on push. Check which branch is set as Production
  Branch in the Vercel project settings — pushing to a non-production branch only creates a
  preview.
- **Backend:** not automatic. From a machine with the Firebase CLI:
  ```bash
  cd goal-tracker/functions && npm install && cd ..
  firebase deploy --only firestore:rules,storage,functions
  ```
  Needs Cloud Scheduler enabled for the daily `dealFollowUpReminders` job.

## Secrets

`ANTHROPIC_API_KEY` is a Firebase secret. Firebase web config comes from `EXPO_PUBLIC_*` env
vars. Never commit either. Never write a key into a memory store or any file.
