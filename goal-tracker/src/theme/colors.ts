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
  success: '#4B7A3D',
  ahead: '#4B7A3D',
  onPace: '#5C3A21',
  behind: '#B5692E',
  fire: '#B5692E',
  gradientPrimary: ['#5C3A21', '#8C5A2B'] as const,
  gradientGold: ['#C6862E', '#B5692E'] as const,
  track: '#E1D2AC',
} as const;

export type AppColors = typeof colors;
