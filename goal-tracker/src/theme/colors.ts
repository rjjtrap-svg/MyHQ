/**
 * The palette. Dark-first performance aesthetic — deep charcoal rather than pure black,
 * layered surfaces, one confident action accent, and gold kept as the brand thread so the
 * app still reads as the same product at night rather than a generic dark dashboard.
 *
 * MIGRATION NOTE, read before using `primary`:
 * In the cream palette `primary` was a dark brown, and several components used it as a
 * large surface fill (quote cards, the why card, the overrides hero). Inverted, `primary`
 * is now a saturated blue *action* colour. Filling a whole card with it looks like a
 * warning, not a feature. Use `surfaceElevated` or `brandSurface` for large fills and keep
 * `primary` for buttons, active states and interactive affordances.
 *
 * Every token name from the cream palette is preserved on purpose — 44 files import from
 * here, and renaming would have turned a repaint into a refactor.
 */
export const colors = {
  /** Primary background. Near-black with a cool cast; pure #000 reads cheap and crushes shadows. */
  background: '#0E1014',
  /** Secondary background — sections and inset groups. */
  surface: '#16191F',
  /** Card surface. The default resting plane for content. */
  surfaceElevated: '#1D212A',
  /** One step above a card: modals, sheets, the thing you're acting on. */
  surfaceRaised: '#252A35',
  /** Pressed state for any tappable surface. */
  surfacePressed: '#2E3440',
  /** A deliberately branded dark plane — replaces the old brown fills. */
  brandSurface: '#1A1D25',

  border: '#2A2F3A',
  borderSubtle: '#242933',
  borderStrong: '#3A4250',
  divider: '#20242C',

  text: '#F2F5F9',
  textPrimary: '#F2F5F9',
  textSecondary: '#B8C0CC',
  textMuted: '#9AA3B2',
  textFaint: '#68717F',
  /** Text and icons sitting on `primary`. */
  onPrimary: '#FFFFFF',

  /** Primary action. Electric indigo — navigation, buttons, the thing to tap. */
  primary: '#5B8CFF',
  primaryPressed: '#4570E8',
  /** Low-emphasis tint of the action colour: secondary labels on primary surfaces. */
  primaryMuted: '#8FAEFF',
  /** Secondary accent, used where the old palette used a mid brown. */
  accent: '#7C93B8',
  /** The brand thread. Achievements, eyebrows, the mark itself. */
  gold: '#E0A93B',

  danger: '#E5484D',
  /** Alert surfaces. Dark-tinted rather than pale — a pale block on charcoal is a flashbang. */
  dangerSurface: '#2A1618',
  dangerBorder: '#5C2226',
  dangerText: '#FF8F94',

  success: '#34C77B',
  warning: '#F5A524',
  info: '#4FA9F5',
  infoSurface: '#142433',
  infoBorder: '#285170',
  /** Premium insight and coaching. Used sparingly — it stops meaning anything otherwise. */
  premium: '#A277FF',

  disabledSurface: '#1A1E26',
  disabledText: '#59616E',

  /** Pace states. Green ahead, amber behind — never red, being behind is not a failure. */
  ahead: '#34C77B',
  onPace: '#5B8CFF',
  behind: '#F5A524',
  fire: '#FF7A45',
  fireSurface: '#2B1B16',
  fireBorder: '#6B3524',

  /** Scrim used behind modal celebrations and blocking overlays. */
  overlay: 'rgba(6, 7, 10, 0.76)',
  goldSurface: '#2B2417',

  /**
   * Knock dispositions. Deliberately not the danger/success pair — a "not interested" is a
   * normal outcome at a door, not an error state, and colouring it like one makes a good
   * day's work look like a screen full of failures.
   */
  knockNotHome: '#68717F',
  knockNotInterested: '#7C93B8',
  knockCallback: '#E0A93B',
  knockSold: '#34C77B',
  knockDoNotKnock: '#E5484D',

  /**
   * The brand mark's own colours. These exist so `Emblem.tsx` never hardcodes a hex and
   * never drifts from the generated icon — they mirror PRIMARY and GOLD in
   * tools/generate_icon.py exactly. Change one, change both, and re-run generate_assets.py.
   */
  markBody: '#B08034',
  markHighlight: '#FFC75E',

  gradientPrimary: ['#5B8CFF', '#7C6BFF'] as const,
  gradientGold: ['#E0A93B', '#FF7A45'] as const,

  /** Trough behind any progress bar or ring. */
  track: '#252A35',
} as const;

export type AppColors = typeof colors;
