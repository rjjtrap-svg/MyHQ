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
 * Two voices, on purpose. `display` is a serif used only for numbers that matter and for
 * pull quotes — it's the pro-shop/scorecard voice. `sans` is everything else. Keeping the
 * serif rare is what makes it read as a deliberate accent instead of a magazine template.
 */
export const fonts = {
  display: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia, "Times New Roman", serif',
  }) as string,
  sans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  }) as string,
};

export const typography = {
  hero: { fontSize: 44, fontWeight: '800' as const, letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: '700' as const },
  subtitle: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  pageTitle: {
    fontFamily: fonts.sans,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
  },
  sectionTitle: {
    fontFamily: fonts.sans,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.25,
  },
  metric: {
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '700' as const,
    letterSpacing: -1.2,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },

  /** Patch lettering: small, uppercase, widely tracked. Section headers and eyebrows. */
  eyebrow: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
  },
  /** Scoreboard numerals — serif, tight, oversized. */
  scoreValue: {
    fontFamily: fonts.display,
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: -1,
  },
  /**
   * The one number a screen is actually about — today's sales, the goal percentage.
   * Bigger than scoreValue on purpose: hierarchy should come from size and weight, not
   * from painting things different colours.
   */
  metricHero: {
    fontFamily: fonts.display,
    fontSize: 56,
    fontWeight: '700' as const,
    letterSpacing: -2,
  },
  /** Card headings. Sits between subtitle and body — a card title is not a section title. */
  cardTitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  /** Status pills. Tighter tracking than eyebrow because badges are short and boxed. */
  badge: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  /** Button labels, so every button agrees without each one restating it. */
  button: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: -0.1,
  },
  /** Serif italic, for the rotating floor mottos. */
  quote: {
    fontFamily: fonts.display,
    fontSize: 18,
    fontStyle: 'italic' as const,
    lineHeight: 26,
  },
};

export { colors };

export const theme = { colors, spacing, radius, borders, layout, elevation, motion, typography, fonts };
export type Theme = typeof theme;
