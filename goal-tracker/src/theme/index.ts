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

export const typography = {
  hero: { fontSize: 44, fontWeight: '800' as const, letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: '700' as const },
  subtitle: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  statValue: { fontSize: 22, fontWeight: '800' as const },
  statLabel: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.4 },
};

export { colors };

export const theme = { colors, spacing, radius, typography };
export type Theme = typeof theme;
