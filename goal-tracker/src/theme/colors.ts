export const colors = {
  background: '#0B0D12',
  surface: '#15181F',
  surfaceElevated: '#1C202A',
  border: '#262B36',
  text: '#F5F6F8',
  textMuted: '#9198A9',
  textFaint: '#5B6274',
  primary: '#5B8CFF',
  primaryMuted: '#233156',
  accent: '#38E1C6',
  gold: '#F5B942',
  danger: '#FF5D6C',
  success: '#38D97C',
  ahead: '#38D97C',
  onPace: '#5B8CFF',
  behind: '#FF9F43',
  fire: '#FF7A45',
  gradientPrimary: ['#5B8CFF', '#38E1C6'] as const,
  gradientGold: ['#F5B942', '#FF7A45'] as const,
  track: '#1F232D',
} as const;

export type AppColors = typeof colors;
