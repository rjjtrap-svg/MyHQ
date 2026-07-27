# Context brief for an agent without repo access

Codex's sandbox cannot reach GitHub (`CONNECT tunnel failed, response 403`), so it can't
clone this repo. This file is the contract it works against instead: the design tokens, the
component APIs and the domain types it needs to write screens that compile here.

Paste this whole file into that agent once, at the start of a session. Regenerate it from
source whenever `src/theme/*`, the shared components or `src/types/index.ts` change — a
stale contract is worse than none, because code written against it will look right and fail
to build.

---

## What you're working on

An Expo SDK 52 app (React Native Web, deployed as a PWA) for a door-to-door fiber sales
team. It is **complete, deployed and in use** — you are modifying working software, not
starting a new project. Read https://docs.expo.dev/versions/v52.0.0/ before writing Expo
code; do not rely on recalled API shapes.

Visual identity: cream and brown, a deliberate "pro shop / scorecard" feel. Not a generic
SaaS dashboard.

## Your lane

You own **`app/**`** (screens and routing) and **`src/components/**`** (new components).

You do **not** touch `src/theme/*`, `src/lib/*`, `src/store/*`, `functions/*` or any
`.rules` file. Those belong to the reviewing agent. If you need a colour or a type style
that doesn't exist below, **say so** — do not hardcode a hex and do not add a token
yourself.

## How to deliver work

You cannot push. Output complete file contents in fenced code blocks, each preceded by its
full repo-relative path:

````
### goal-tracker/app/(tabs)/deals.tsx
```tsx
...entire file...
```
````

Whole files, not diffs or fragments — the reviewing agent needs to apply them exactly. Say
which files you changed and which you created. If you couldn't finish something, say that
too; do not report work you didn't do, and never report a commit or a push, because you
cannot make one.

---

## Design tokens

Import from `@/src/theme`. Never write a raw hex in a component.

```ts
export const colors = {
  background: '#F7F1E6',
  surface: '#EFE4CF',
  surfaceElevated: '#E6D6B8',
  border: '#D3BD95',
  text: '#2E2013',
  textMuted: '#6B5642',
  textFaint: '#9C8768',
  primary: '#5C3A21',
  primaryMuted: '#E1CBA3',
  accent: '#8C5A2B',
  gold: '#C6862E',
  danger: '#A83A2B',
  dangerSurface: '#F3DCD5',   // alert backgrounds
  dangerBorder: '#D9A68F',
  dangerText: '#8A3324',
  success: '#4B7A3D',
  ahead: '#4B7A3D',           // pace indicators
  onPace: '#5C3A21',
  behind: '#B5692E',
  fire: '#B5692E',            // streaks / hot states
  gradientPrimary: ['#5C3A21', '#8C5A2B'] as const,
  gradientGold: ['#C6862E', '#B5692E'] as const,
  track: '#E1D2AC',           // progress bar trough
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 10, md: 16, lg: 24, xl: 32, round: 999 } as const;
```

Two typefaces on purpose. `display` is a serif used **only** for numbers that matter and
for pull quotes — keeping it rare is what makes it read as deliberate. `sans` is everything
else.

```ts
export const typography = {
  hero:     { fontSize: 44, fontWeight: '800', letterSpacing: -0.5 },
  title:    { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 17, fontWeight: '600' },
  body:     { fontSize: 15, fontWeight: '400' },
  caption:  { fontSize: 13, fontWeight: '500' },

  /** Small caps, wide tracking. ALL labels and section eyebrows.
   *  Already sets textTransform: 'uppercase' — do not set it again at the call site. */
  eyebrow:    { fontFamily: fonts.sans, fontSize: 11, fontWeight: '700',
                letterSpacing: 1.6, textTransform: 'uppercase' },
  /** Serif numerals. ALL stat and metric numbers. */
  scoreValue: { fontFamily: fonts.display, fontSize: 34, fontWeight: '700',
                letterSpacing: -1 },
  /** Serif italic. Pull quotes only. */
  quote:      { fontFamily: fonts.display, fontSize: 18, fontStyle: 'italic',
                lineHeight: 26 },
};
```

`typography.statValue` and `typography.statLabel` **no longer exist**. Do not use them.

## Shared components

Import from `@/src/components/<Name>`. Use these rather than hand-rolling equivalents —
there were once 23 different primary-button styles in this app and the point of these is
that there is now one of each.

```ts
ScreenHeader({ eyebrow: string; title: string; subtitle?: string;
               emblem?: boolean; right?: React.ReactNode })
// Every top-level screen opens with this. Renders eyebrow, title, brand mark, wave rule.

Button({ label: string; onPress: () => void;
         variant?: 'solid' | 'ghost' | 'danger';
         size?: 'sm' | 'md' | 'lg';
         busy?: boolean; disabled?: boolean; style?: ViewStyle })

SegmentedToggle({ options: { key: T; label: string }[]; value: T;
                  onChange: (v: T) => void; stretch?: boolean })
// stretch = equal-width tabs filling the container.

Banner({ message: string; tone?: 'error' | 'info'; align?: 'center' | 'left' })
// All inline error and info messages.

Section({ title: string; right?: React.ReactNode; children; style? })
// Section heading — gold tick, hairline rule.

StatTile({ label: string; value: string | number; sublabel?: string; accent?: string })
// Metric tiles. flexBasis 48%, so two per row in a wrapping flex container.

Emblem({ size?: number })          // brand mark (ouroboros dragon), inline SVG
WaveRule({ height?: number; color?: string; scaleWidth?: number; style? })
PullQuote({ seed?: string })       // rotating floor motto, serif italic
BadgePatch({ badge: BadgeDef; progress: number })
```

## Domain types

```ts
type DealStage = 'sold' | 'installed' | 'paid' | 'cancelled';
const DEAL_STAGES: DealStage[] = ['sold', 'installed', 'paid'];  // 'cancelled' excluded

interface Deal {
  id: string;
  date: string;              // ISO yyyy-mm-dd the deal counts against
  createdAt: string; updatedAt: string;
  customerName?: string; address?: string; notes?: string;
  firstName?: string; lastName?: string; phone?: string;
  scheduledInstallDate?: string;   // drives follow-up reminders
  synced: boolean; deletedAt?: string;
  teamId: string; repUid: string; repName: string;
  photoUrl?: string;
  ocrStatus: 'none' | 'pending' | 'done' | 'error';
  ocrLines?: string[]; ocrGuessedName?: string; ocrGuessedAddress?: string;
  stage: DealStage;
  soldAt: string; installedAt?: string; paidAt?: string;
  cancelledAt?: string; cancelReason?: string;
  installPromptSentAt?: string; payPromptSentAt?: string;
}

interface Commission {
  dealId: string; teamId: string; repUid: string; amount: number; updatedAt: string;
}

type Role = 'manager' | 'team_lead' | 'rep';
```

## Domain rules you must not break

- **A cancelled deal is not a sale.** `stage === 'cancelled'` is excluded from every stat —
  goal progress, streaks, close rate, commission totals. If you write anything that counts
  deals, filter it.
- **Commission is private.** Readable only by the rep who earned it and their manager,
  enforced in Firestore rules. Teammate profile screens pass `showMoney={false}` on purpose
  — do not "fix" that by showing money.
- **Coach chat is not visible to managers.** It's meant to be judgment-free. Don't surface
  it anywhere team-facing.
- **Never invent a quote.** The Lock In library separates `kind: 'quote'` (real, sourced
  words, shown in quotation marks) from `kind: 'idea'` (a framework summarised in our own
  words, tagged "idea"). If you are not certain of exact wording, it is an `idea`. Putting
  invented words in a real person's mouth is the one thing that must never happen here.

## Before you report anything as done

```bash
cd goal-tracker
npx tsc --noEmit      # must be clean
```

Paste the actual output. There is no test suite; the type-check is the gate.
