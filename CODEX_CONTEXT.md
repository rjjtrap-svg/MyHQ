# Screen brief for an agent without repo access

Codex's sandbox cannot reach GitHub (`CONNECT tunnel failed, response 403`), so it can't
clone this repo. This file is the contract it works against instead.

Paste this whole file into Codex, then add the screen name and the current file at the end.
Regenerate this file whenever `src/theme/*` or the shared components change — **a stale
contract is worse than none**, because code written against it looks right and fails to
build. This file has already caused that once, by documenting two components after they
were deleted.

---

## What you're working on

`goal-tracker/` — an **Expo SDK 52** app for a door-to-door fiber sales team, shipped as a
PWA. Reps open it on a phone between knocks. It is **deployed and in use**: you are
modifying working software, not starting a project. Read
https://docs.expo.dev/versions/v52.0.0/ before writing Expo code rather than relying on
recalled API shapes.

**This is React Native, not a website.** There is no HTML and no CSS anywhere in it.

- Components are `View`, `Text`, `Pressable`, `ScrollView`, `TextInput` from `react-native`
- Styling is `StyleSheet.create({...})` and a `style={}` prop
- There is **no** `div`, no `className`, no CSS file, no Tailwind, no styled-components
- Layout is flexbox only. No CSS grid, no `position: fixed`, no media queries
- `Alert.alert` does nothing on web — use `confirmAction` / `notify` from `@/src/lib/dialogs`

Output that uses HTML or CSS is unusable and gets thrown away.

---

## Hard rules

1. **One screen file per task.** Touch nothing else. If the screen needs something that
   doesn't exist, say so in prose — do not create it.
2. **Never invent an import.** Every import must appear in the lists below. If you're about
   to write `@/src/components/SomethingNew` or `@/src/lib/somethingNew`, stop.
3. **Never hardcode a colour.** No hex, no `rgba(...)`, no `'white'`. Only tokens from
   `@/src/theme`. If a colour you need doesn't exist, say so — do not approximate.
4. **Never change** `src/theme/*`, `src/lib/*`, `src/store/*`, `functions/*`, `*.rules`,
   `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `package.json`, or any env/config file.
5. **Keep every existing behaviour.** Same data, same handlers, same navigation, same
   conditionals. This is a visual redesign — if a screen filters cancelled deals, the
   redesigned screen still filters cancelled deals.
6. **Output the complete file**, top to bottom, in one code block. Not a diff, not a
   snippet, never "…rest unchanged".

---

## Design direction

Dark, monochrome, restrained. Premium the way Linear and Apple Health are premium: hierarchy
comes from size, weight and spacing, not from painting things different colours.

- **Colour means something here.** Gold is achievement, green is ahead of pace, amber is
  behind, red is danger. Don't use them decoratively — a gold border on a card that isn't
  about achievement makes the ones that are mean less.
- **Buttons are glass** — a translucent tint plus a brighter edge, never a saturated fill.
  Use the `Button` component; don't hand-roll one.
- **No ornament.** An ouroboros mark and a wavy seigaiha divider were both removed for
  reading as cartoon decoration. Don't add flourishes, decorative gradients, emoji, or icons
  that carry no information. Brand is the palette, the type scale and the spacing.
- **One loud thing per screen, maximum.** If two elements are both large and both
  high-contrast, they compete and the screen has no focus.
- Serif (`typography.metric`, `scoreValue`, `metricHero`, `quote`) is for **numbers that
  matter and pull quotes only**. Everywhere else is sans. Keeping the serif rare is what
  makes it read as deliberate rather than as a magazine template.

---

## Tokens — `import { colors, spacing, radius, layout, typography, elevation } from '@/src/theme'`

### colors

```
background surface surfaceElevated surfaceRaised surfacePressed brandSurface
border borderSubtle borderStrong divider
text textPrimary textSecondary textMuted textFaint onPrimary
primary primaryPressed primaryMuted accent gold
danger dangerSurface dangerBorder dangerText
success warning info infoSurface infoBorder premium
disabledSurface disabledText
glass glassPressed glassBorder glassBorderStrong
ahead onPace behind fire fireSurface fireBorder
overlay goldSurface track
knockNotHome knockNotInterested knockCallback knockSold knockDoNotKnock
gradientPrimary gradientGold   (readonly [string, string])
```

`glass*` are the translucent button and active-state tints. `track` is the trough behind any
progress bar or ring.

### spacing / radius / layout

```
spacing  xs 4 · sm 8 · md 16 · lg 24 · xl 32 · xxl 48 · xxxl 64
radius   xs 6 · sm 10 · md 16 · lg 24 · xl 32 · round 999
layout   screenGutter 20 · screenGutterWide 32 · contentMaxWidth 760
         formMaxWidth 420 · sectionGap 32 · cardPadding 18 · minTouchTarget 44
elevation  flat · card · raised · modal      (spread into a style: ...elevation.card)
```

### typography — spread these, don't restate their properties

```
hero title subtitle body caption
pageTitle sectionTitle label
metric scoreValue metricHero        serif numerals
eyebrow badge                       already uppercase — never set textTransform again
cardTitle button quote
```

`statLabel` and `statValue` were deleted. Don't reintroduce them.

---

## Shared components — use these, don't rebuild them

```tsx
import { ScreenHeader } from '@/src/components/ScreenHeader';
ScreenHeader({ eyebrow: string; title: string; subtitle?: string;
               emblem?: boolean; right?: React.ReactNode })
// Every top-level screen opens with this. `right` REPLACES the mark, it doesn't sit beside it.

import { Button, SegmentedToggle } from '@/src/components/Button';
Button({ label: string; onPress: () => void; variant?: 'solid'|'ghost'|'danger';
         size?: 'sm'|'md'|'lg'; busy?: boolean; disabled?: boolean; style?: ViewStyle })
// size 'lg' is full-width (alignSelf: stretch).
SegmentedToggle({ options: {key,label}[]; value; onChange; stretch?: boolean })

import { Banner } from '@/src/components/Banner';
Banner({ message: string; tone?: 'error'|'info'; align?: 'center'|'left' })
// ALL inline errors and notices. Never hand-roll an error row.

import { Section } from '@/src/components/Section';
Section({ title: string; right?: React.ReactNode; children; style? })

import { StatTile } from '@/src/components/StatTile';
StatTile({ label: string; value: string|number; sublabel?: string; accent?: string })
// flexBasis 48% — always use an EVEN count or the last tile strands.

import { Mark } from '@/src/components/Mark';
Mark({ size?: number })          // the brand mark: a modern house, monochrome

import { StreakFlame } from '@/src/components/StreakFlame';
StreakFlame({ streak: number })  // renders nothing when streak <= 0

import { PullQuote } from '@/src/components/PullQuote';
PullQuote({ seed?: string })

// Dashboard-only, already used by app/(tabs)/index.tsx:
import { MetricCard } from '@/src/components/dashboard/MetricCard';
import { GoalProgressCard } from '@/src/components/dashboard/GoalProgressCard';
import { NextActionCard } from '@/src/components/dashboard/NextActionCard';
import { PerformanceHeader } from '@/src/components/dashboard/PerformanceHeader';
import { StatusBadge } from '@/src/components/dashboard/StatusBadge';
```

Icons: `import { FontAwesome } from '@expo/vector-icons'` — FontAwesome 5 free names only.
Navigation: `import { useRouter } from 'expo-router'`, then `router.push('/deals')`.

**These no longer exist. Importing them breaks the build:** `Emblem`, `WaveRule`,
`statLabel`, `statValue`.

---

## Domain rules you must not break

- **A cancelled deal is not a sale.** `stage === 'cancelled'` is excluded from every stat —
  goal progress, streaks, close rate, commission, override earnings. If the screen you're
  editing filters it, keep the filter.
- **Soft deletes.** `deletedAt` set means the record is gone. Keep those filters too.
- **Commission is private** to the rep who earned it and the manager. Teammate profiles pass
  `showMoney={false}`. Never "fix" that by showing money.
- **Coach chat is deliberately invisible to managers.** Don't surface it anywhere.
- Two different things are called "override" — a manager's correction to one rep's
  commission on one deal, and a standing per-deal rate a leader earns on a rep's production.
  Separate collections, separate rules. Don't merge them.

---

## How to deliver

Reply with:

1. **One paragraph** on what was wrong with the screen and what you changed. Not a feature
   list.
2. **The complete file** in a single ```tsx code block.
3. **Anything you needed that doesn't exist**, in prose, as a request — a missing colour
   token, a missing component. Do not create it yourself.

Do not write shell scripts. Do not write `git` commands. Do not describe file operations.
Someone else applies, type-checks, builds and pushes your output — your job is the file.

---

## Definition of done

Check your own output before replying:

- Every `import` appears in the lists above
- No hex, no `rgba(`, no colour-name string anywhere
- No `div`, `className`, or web-only API
- Every handler, filter and conditional from the original still present
- `typography.eyebrow` / `badge` used without re-setting `textTransform`
- `StatTile` counts are even

---

## The task

> Redesign **`goal-tracker/app/(tabs)/<SCREEN>.tsx`**.
>
> Keep every behaviour; change how it looks and how it's organised. Follow the design
> direction above — dark, monochrome, one loud thing, no ornament.
>
> --- CURRENT FILE BELOW ---
