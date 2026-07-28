import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';
import { colors } from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const layout = {
  screenGutter: 20,
  screenGutterWide: 32,
  contentMaxWidth: 760,
  /** Single-column forms. A sign-in field stretched to 760px reads as a broken layout. */
  formMaxWidth: 420,
  sectionGap: 32,
  cardPadding: 18,
  minTouchTarget: 44,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  round: 999,
} as const;

export const borders = {
  hairline: 1,
  strong: 1.5,
} as const;

export const elevation = {
  flat: {} as ViewStyle,
  card: Platform.select<ViewStyle>({
    android: { elevation: 1 },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
  }) ?? {},
  raised: Platform.select<ViewStyle>({
    android: { elevation: 3 },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.22,
      shadowRadius: 24,
    },
  }) ?? {},
  modal: Platform.select<ViewStyle>({
    android: { elevation: 8 },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.32,
      shadowRadius: 36,
    },
  }) ?? {},
} as const;

export const motion = {
  fast: 140,
  standard: 220,
  deliberate: 320,
  spring: { damping: 18, stiffness: 220, mass: 0.8 },
} as const;

/**
 * Two voices, on purpose.
 *
 * `display` is **Archivo semi-expanded** — wide, heavy, athletic. It's the scoreboard voice,
 * and it's reserved for numbers that matter. It replaced Georgia, which was borrowed
 * newspaper gravitas: a serif says "broadsheet", and this is a scoreboard for someone who
 * knocks doors for a living.
 *
 * `sans` is **Manrope** for everything else — geometric, open, and legible at 11px on a
 * phone held at arm's length in daylight. Deliberately not Inter: Inter has become the
 * default of every dark dashboard, so it reads as no choice at all.
 *
 * Every weight is its own family. React Native won't synthesise weights from one family the
 * way a browser will — you get one weight on native and faux-bold on web. Set `fontFamily`
 * and leave `fontWeight` alone.
 */
export const fonts = {
  display: 'Archivo-ExpandedBold',
  displayHeavy: 'Archivo-ExpandedBlack',
  sans: 'Manrope-Regular',
  sansMedium: 'Manrope-Medium',
  sansSemiBold: 'Manrope-SemiBold',
  sansBold: 'Manrope-Bold',
  sansHeavy: 'Manrope-ExtraBold',
};

export const typography = {
  hero: { fontFamily: fonts.sansHeavy, fontSize: 44, letterSpacing: -0.5 },
  title: { fontFamily: fonts.sansBold, fontSize: 24, letterSpacing: -0.3 },
  subtitle: { fontFamily: fonts.sansBold, fontSize: 17, letterSpacing: -0.2 },
  body: { fontFamily: fonts.sans, fontSize: 15 },
  caption: { fontFamily: fonts.sansMedium, fontSize: 13 },
  pageTitle: {
    fontFamily: fonts.sansHeavy,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.8,
  },
  sectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.25,
  },
  metric: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
  },

  /** Patch lettering: small, uppercase, widely tracked. Section headers and eyebrows. */
  eyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
  },
  /** Scoreboard numerals — wide, tight, oversized. */
  scoreValue: {
    fontFamily: fonts.display,
    fontSize: 32,
    letterSpacing: -0.6,
  },
  /**
   * The one number a screen is actually about — today's sales, the goal percentage.
   * Bigger than scoreValue on purpose: hierarchy should come from size and weight, not
   * from painting things different colours.
   */
  metricHero: {
    fontFamily: fonts.displayHeavy,
    fontSize: 52,
    letterSpacing: -1.4,
  },
  /** Card headings. Sits between subtitle and body — a card title is not a section title. */
  cardTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  /** Status pills. Tighter tracking than eyebrow because badges are short and boxed. */
  badge: {
    fontFamily: fonts.sansHeavy,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  /** Button labels, so every button agrees without each one restating it. */
  button: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    letterSpacing: -0.1,
  },
  /** The rotating floor mottos. Italic is gone with the serif — weight carries it now. */
  quote: {
    fontFamily: fonts.sansMedium,
    fontSize: 18,
    lineHeight: 27,
  },
};

export { colors };

export const theme = { colors, spacing, radius, borders, layout, elevation, motion, typography, fonts };
export type Theme = typeof theme;
