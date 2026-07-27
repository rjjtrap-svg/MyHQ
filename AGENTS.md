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
- `ScreenHeader` — every top-level screen opens with it (eyebrow, title, mark, wave rule).
- `Button` / `SegmentedToggle` — all buttons and tab switches.
- `Banner` — all inline error/info messages.
- `Section` — section headings (gold tick + hairline).
- `StatTile` — metric tiles.
- `Emblem`, `WaveRule` — the brand marks.

**The logo** is generated, not hand-drawn. `tools/generate_icon.py` is the source of truth;
`tools/generate_assets.py` writes every icon/splash/favicon/OG file from it. If you change
the mark, run both and regenerate the inline SVG in `src/components/Emblem.tsx` from the
same geometry so the app icon and the in-app mark never drift apart.

## Domain rules that are easy to get wrong

- **A cancelled deal is not a sale.** `stage === 'cancelled'` is excluded from every stat —
  goal progress, streaks, close rate, commission totals. Both stats engines
  (`src/lib/stats.ts`, `src/lib/profileStats.ts`) filter it in their `activeDeals()`. If you
  add a third place that counts deals, filter it there too.
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
