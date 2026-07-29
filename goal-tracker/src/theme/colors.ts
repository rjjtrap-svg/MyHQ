/**
 * The palette. Cinematic near-black, layered greyscale surfaces, and a single soft gold/beige
 * accent — the only colour allowed to carry the brand. Quiet luxury, not a startup dashboard:
 * no second brand hue competing with gold, no bright fills. Semantic states (danger, success,
 * warning, info, premium, pace) keep their own hues on purpose — they report information, not
 * identity — but every surface and neutral in the app now reads as deep charcoal rather than
 * the old cool-blue dark theme.
 *
 * MIGRATION NOTE, read before using `primary`:
 * `primary` is the one action/brand accent — a soft gold/beige (`#D4C09A` range), not the old
 * electric-indigo blue. It is light, so anything filled with it needs dark text on top
 * (`onPrimary`), not white. Use `surfaceElevated` or `brandSurface` for large fills; keep
 * `primary` for buttons, active states and the interactive affordances a screen wants you to
 * notice.
 *
 * Every token name from the previous palette is preserved on purpose — 44 files import from
 * here, and renaming would have turned a repaint into a refactor.
 */
export const colors = {
  /** Primary background. Deep, near-true black with a faint warm cast; pure #000 crushes shadows. */
  background: '#0B0B0A',
  /** Secondary background — sections and inset groups. */
  surface: '#141412',
  /** Card surface. The default resting plane for content. */
  surfaceElevated: '#1C1C19',
  /** One step above a card: modals, sheets, the thing you're acting on. */
  surfaceRaised: '#26251F',
  /** Pressed state for any tappable surface. */
  surfacePressed: '#302F27',
  /** A deliberately branded dark plane — replaces the old brown fills. */
  brandSurface: '#161512',

  border: '#2C2A24',
  borderSubtle: '#211F1A',
  borderStrong: '#3D3A30',
  divider: '#1D1C18',

  text: '#F5F2EA',
  textPrimary: '#F5F2EA',
  textSecondary: '#B7B0A2',
  textMuted: '#8C8577',
  textFaint: '#5C564A',
  /** Text and icons sitting on `primary`. Primary is light now, so this is dark, not white. */
  onPrimary: '#15130D',

  /** Primary action and the one brand accent. Soft gold/beige — navigation, buttons, the thing to tap. */
  primary: '#D4C09A',
  primaryPressed: '#BFA97C',
  /**
   * Low-emphasis tint of the action colour: secondary labels on primary surfaces, and soft
   * "done"/selected badge fills. Kept as rgba rather than a flat hex so it reads correctly
   * whether it's used as translucent text or as a translucent wash over a dark surface.
   */
  primaryMuted: 'rgba(212, 192, 154, 0.7)',
  /** Secondary, quieter-than-primary neutral — warm grey, not a second hue. Gold stays the only accent. */
  accent: '#948C7C',
  /** The brand thread. Achievements, eyebrows, the mark itself. Same value as `primary` on purpose. */
  gold: '#D4C09A',

  danger: '#E5484D',
  /** Alert surfaces. Dark-tinted rather than pale — a pale block on charcoal is a flashbang. */
  dangerSurface: '#241512',
  dangerBorder: '#4A241F',
  dangerText: '#FF9891',

  success: '#34C77B',
  warning: '#F5A524',
  info: '#4FA9F5',
  infoSurface: '#141C24',
  infoBorder: '#25384A',
  /** Premium insight and coaching. Used sparingly — it stops meaning anything otherwise. */
  premium: '#A277FF',

  disabledSurface: '#1A1916',
  disabledText: '#4C473C',

  /**
   * Glass. Buttons and active segments are lit tints of the background rather than a solid
   * fill, so an action reads as raised out of the surface instead of painted on top of it.
   *
   * These are deliberately rgba and not flat hexes: they have to sit on `surface`,
   * `surfaceElevated` and plain `background` and pick up whatever is underneath. A hex
   * would be right on exactly one of those and wrong on the other two.
   */
  glass: 'rgba(255, 255, 255, 0.06)',
  glassPressed: 'rgba(255, 255, 255, 0.12)',
  glassBorder: 'rgba(255, 255, 255, 0.14)',
  /** The primary action's edge — the one thing allowed to be brighter than its neighbours. */
  glassBorderStrong: 'rgba(255, 255, 255, 0.28)',

  /** Pace states. Green ahead, amber behind — never red, being behind is not a failure. */
  ahead: '#34C77B',
  onPace: '#D4C09A',
  behind: '#F5A524',
  fire: '#FF7A45',
  fireSurface: '#26160F',
  fireBorder: '#5C3620',

  /** Scrim used behind modal celebrations and blocking overlays. */
  overlay: 'rgba(5, 4, 3, 0.78)',
  goldSurface: '#241E13',

  /**
   * Knock dispositions. Deliberately not the danger/success pair — a "not interested" is a
   * normal outcome at a door, not an error state, and colouring it like one makes a good
   * day's work look like a screen full of failures.
   */
  knockNotHome: '#6E6A60',
  knockNotInterested: '#948C7C',
  knockCallback: '#D4C09A',
  knockSold: '#34C77B',
  knockDoNotKnock: '#E5484D',

  /**
   * The launcher icon's own colours — they mirror PRIMARY and GOLD in
   * tools/generate_icon.py exactly. Unused by app code since the in-app mark became
   * `Mark.tsx`; kept because the generated icon/splash/favicon set still uses these values,
   * so deleting them here would leave the generator's palette undocumented.
   *
   * NOTE: the launcher icon is still the old ouroboros and no longer matches `Mark.tsx`.
   * Re-cutting the icon from the door geometry is a separate job — see AGENTS.md.
   */
  markBody: '#B08034',
  markHighlight: '#FFC75E',

  gradientPrimary: ['#D4C09A', '#BFA97C'] as const,
  gradientGold: ['#D4C09A', '#B08F5C'] as const,

  /**
   * Time-of-day surfaces. These are the one place colour is allowed to be atmosphere rather
   * than information, because they carry a real signal: whether you are heading out or
   * closing down. A rep opening this at 7am and at 9pm should not see the same screen.
   *
   * Both land on `background` at the bottom so a gradient panel dissolves into the page
   * instead of ending on a hard edge. Dusk stays a warm charcoal now rather than navy, so it
   * doesn't reintroduce blue as a second hue.
   */
  gradientDawn: ['#4A2E1C', '#1A1410', '#0B0B0A'] as const,
  gradientDusk: ['#221F1A', '#151412', '#0B0B0A'] as const,

  /** Trough behind any progress bar or ring. */
  track: '#26251F',
} as const;

export type AppColors = typeof colors;
