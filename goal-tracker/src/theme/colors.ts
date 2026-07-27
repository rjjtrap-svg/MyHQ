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
  /** Alert surfaces — these were hardcoded in seven different files before. */
  dangerSurface: '#F3DCD5',
  dangerBorder: '#D9A68F',
  dangerText: '#8A3324',
  success: '#4B7A3D',
  ahead: '#4B7A3D',
  onPace: '#5C3A21',
  behind: '#B5692E',
  fire: '#B5692E',
  /**
   * Knock dispositions. Deliberately not the danger/success pair — a "not interested" is a
   * normal outcome at a door, not an error state, and colouring it like one makes a good
   * day's work look like a screen full of failures.
   */
  knockNotHome: '#9C8768',
  knockNotInterested: '#8C5A2B',
  knockCallback: '#C6862E',
  knockSold: '#4B7A3D',
  knockDoNotKnock: '#A83A2B',
  gradientPrimary: ['#5C3A21', '#8C5A2B'] as const,
  gradientGold: ['#C6862E', '#B5692E'] as const,
  track: '#E1D2AC',
} as const;

export type AppColors = typeof colors;
