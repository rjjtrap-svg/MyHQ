/**
 * The palette. Deep black, warm greyscale, soft gold.
 *
 * The neutrals are warm rather than cool: every grey carries a few points of red and yellow
 * so it sits under the gold instead of fighting it. A blue-grey next to a beige-gold reads
 * as two palettes that met by accident.
 *
 * MIGRATION NOTE, read before using `primary`:
 * `primary` is a soft gold and its contents must be DARK — use `onPrimary`, never white.
 * It is an action colour, not a fill: a whole card in it becomes a highlighter. Use
 * `surfaceElevated` or `brandSurface` for large planes and keep `primary` for buttons and
 * active states.
 *
 * Every token name is preserved on purpose — 44 files import from here, and renaming would
 * turn a repaint into a refactor.
 */
export const colors = {
  /** Primary background. Near-black with a cool cast; pure #000 reads cheap and crushes shadows. */
  background: '#08080A',
  /** Secondary background — sections and inset groups. */
  surface: '#101011',
  /** Card surface. The default resting plane for content. */
  surfaceElevated: '#17171A',
  /** One step above a card: modals, sheets, the thing you're acting on. */
  surfaceRaised: '#1F1F23',
  /** Pressed state for any tappable surface. */
  surfacePressed: '#27272C',
  /** A deliberately branded dark plane — replaces the old brown fills. */
  brandSurface: '#14130F',

  border: '#26262B',
  borderSubtle: '#1C1C20',
  borderStrong: '#35353C',
  divider: '#1A1A1E',

  text: '#F6F3ED',
  textPrimary: '#F6F3ED',
  textSecondary: '#C9C3B7',
  textMuted: '#989286',
  textFaint: '#6B665D',
  /** Text and icons sitting on `primary`. */
  onPrimary: '#14130F',

  /** Primary action. Electric indigo — navigation, buttons, the thing to tap. */
  primary: '#D4C09A',
  primaryPressed: '#BEA980',
  /** Low-emphasis tint of the action colour: secondary labels on primary surfaces. */
  primaryMuted: '#E6DCC6',
  /** Secondary accent, used where the old palette used a mid brown. */
  accent: '#9C9384',
  /** The brand thread. Achievements, eyebrows, the mark itself. */
  gold: '#D4C09A',

  danger: '#E5484D',
  /** Alert surfaces. Dark-tinted rather than pale — a pale block on charcoal is a flashbang. */
  dangerSurface: '#231315',
  dangerBorder: '#4E2023',
  dangerText: '#FF8F94',

  success: '#34C77B',
  warning: '#F5A524',
  info: '#4FA9F5',
  infoSurface: '#101820',
  infoBorder: '#24404F',
  /** Premium insight and coaching. Used sparingly — it stops meaning anything otherwise. */
  premium: '#A277FF',

  disabledSurface: '#17171A',
  disabledText: '#5A564F',

  /**
   * Glass. Buttons and active segments are lit tints of the background rather than a solid
   * fill, so an action reads as raised out of the surface instead of painted on top of it.
   *
   * These are deliberately rgba and not flat hexes: they have to sit on `surface`,
   * `surfaceElevated` and plain `background` and pick up whatever is underneath. A hex
   * would be right on exactly one of those and wrong on the other two.
   */
  glass: 'rgba(255, 255, 255, 0.07)',
  glassPressed: 'rgba(255, 255, 255, 0.14)',
  glassBorder: 'rgba(255, 255, 255, 0.16)',
  /** The primary action's edge — the one thing allowed to be brighter than its neighbours. */
  glassBorderStrong: 'rgba(255, 255, 255, 0.30)',

  /** Pace states. Green ahead, amber behind — never red, being behind is not a failure. */
  ahead: '#34C77B',
  onPace: '#D4C09A',
  behind: '#F5A524',
  fire: '#FF7A45',
  fireSurface: '#241811',
  fireBorder: '#5A3220',

  /** Scrim used behind modal celebrations and blocking overlays. */
  overlay: 'rgba(5, 5, 6, 0.80)',
  goldSurface: '#211E16',

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
   * The launcher icon's own colours — they mirror PRIMARY and GOLD in
   * tools/generate_icon.py exactly. Unused by app code since the in-app mark became
   * `Mark.tsx` (a door, drawn from `gold` and `primary`); kept because the generated
   * icon/splash/favicon set still uses these values, so deleting them here would leave the
   * generator's palette undocumented.
   *
   * NOTE: the launcher icon is still the old ouroboros and no longer matches `Mark.tsx`.
   * Re-cutting the icon from the door geometry is a separate job — see AGENTS.md.
   */
  markBody: '#B08034',
  markHighlight: '#FFC75E',

  gradientPrimary: ['#D4C09A', '#A8916A'] as const,
  gradientGold: ['#E6D5B4', '#B49B70'] as const,

  /**
   * Time-of-day surfaces. These are the one place colour is allowed to be atmosphere rather
   * than information, because they carry a real signal: whether you are heading out or
   * closing down. A rep opening this at 7am and at 9pm should not see the same screen.
   *
   * Both land on `background` at the bottom so a gradient panel dissolves into the page
   * instead of ending on a hard edge.
   */
  gradientDawn: ['#3A2C1C', '#151210', '#08080A'] as const,
  gradientDusk: ['#1C1B22', '#111014', '#08080A'] as const,

  /** Trough behind any progress bar or ring. */
  track: '#1F1F23',
} as const;

export type AppColors = typeof colors;
