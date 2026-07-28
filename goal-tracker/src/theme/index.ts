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
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  round: 999,
} as const;

/** Shared responsive bounds keep wide-screen PWA layouts composed rather than stretched. */
export const layout = {
  dashboardMaxWidth: 720,
} as const;

/**
 * Elevation is intentionally restrained: cards should separate from the canvas without
 * looking like floating white sheets. Android uses its native elevation while iOS and web
 * receive the equivalent soft, dark shadow.
 */
export const shadows = {
  card: Platform.select<ViewStyle>({
    android: { elevation: 2 },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
    },
  }) ?? {},
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

export const theme = { colors, spacing, radius, layout, shadows, typography, fonts };
export type Theme = typeof theme;
