import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useGoalStats } from '@/src/hooks/useGoalStats';
import { useUIStore } from '@/src/store/uiStore';
import { useAuthStore } from '@/src/store/authStore';
import { pendingFollowUps } from '@/src/lib/dealFollowUps';
import { AtmosphericBackdrop } from '@/src/components/AtmosphericBackdrop';
import { BriefMetric, MetricGrid } from '@/src/components/BriefMetric';
import { FocusRow } from '@/src/components/FocusRow';
import { MilestoneOverlay } from '@/src/components/MilestoneOverlay';
import { Section } from '@/src/components/Section';
import { Screen } from '@/src/components/Screen';
import { colors, radius, spacing, typography } from '@/src/theme';
import { parseISODate, shortDateLabel } from '@/src/lib/dates';

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

function greeting(date: Date): string {
  if (date.getHours() < 12) return 'Morning';
  if (date.getHours() < 17) return 'Afternoon';
  return 'Evening';
}

function OuroborosMark({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="MyHQ ouroboros mark">
      <G fill="none" stroke={colors.textSecondary} strokeLinecap="round" strokeLinejoin="round">
        <Path
          d="M48.8 15.3C42.2 8.8 31.7 7.2 23.5 11.6 13.8 16.8 9.4 28.5 12.8 39c3.7 11.5 15.8 18.1 27.3 14.8 8.8-2.5 14.8-10.4 15.1-19.2"
          strokeWidth="5.2"
        />
        <Path
          d="M47.9 15.8c4.7-2.1 8.7-.7 10.5 2.8-2.1 1.5-3.6 3.5-4.5 6l-6.6-2.2-4.5 2.2 1.5-5.1-3.2-3.8 6.8.1Z"
          strokeWidth="2.2"
          fill={colors.surfaceRaised}
        />
        <Path d="M53.8 24.6c-3.2 4.2-3.1 8.1 1.4 10" strokeWidth="2.2" />
        <Path
          d="M14.5 30.1c5.1-1.9 9.5-5.5 12.5-10.1M15.1 42.4c6-1 11.3-4.2 15.1-9M24.3 52c5.2-2.2 9.5-6.1 12.3-11"
          strokeWidth="1"
          opacity="0.66"
        />
        <Path
          d="M20.2 14.1c3.5 2.6 6.1 6.3 7.3 10.4M34.2 9.4c1.4 4.4 1.3 8.7-.3 12.8M46.4 14.1c-1.3 3.5-3.6 6.7-6.6 9"
          strokeWidth="1"
          opacity="0.66"
        />
      </G>
      <Circle cx="52.1" cy="18.2" r="1.1" fill={colors.text} />
    </Svg>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const router = useRouter();
  const { deals, settings, stats } = useGoalStats();
  const profile = useAuthStore((s) => s.profile);
  const pendingCelebration = useUIStore((s) => s.pendingCelebration);
  const clearCelebration = useUIStore((s) => s.clearCelebration);
  const pendingDailyAlert = useUIStore((s) => s.pendingDailyAlert);
  const clearDailyAlert = useUIStore((s) => s.clearDailyAlert);

  const today = new Date();
  const firstName = (profile?.displayName ?? '').trim().split(' ')[0];
  const followUps = useMemo(() => pendingFollowUps(deals), [deals]);

  const recent = useMemo(
    () =>
      deals
        .filter((deal) => !deal.deletedAt && deal.stage !== 'cancelled')
        .sort((a, b) => b.soldAt.localeCompare(a.soldAt))
        .slice(0, 4),
    [deals]
  );

  const shortOfToday = Math.max(Math.ceil(stats.requiredPerDay) - stats.todaySales, 0);
  const remaining = Math.max(settings.salesGoal - stats.totalSales, 0);
  const paceDelta = Math.abs(Math.round(stats.paceDelta));

  const headline =
    remaining === 0
      ? 'Goal met.'
      : shortOfToday === 0
        ? 'Finish today.'
        : stats.pace === 'behind'
          ? 'Take it back.'
          : stats.pace === 'ahead'
            ? 'Keep moving.'
            : 'Lock in.';

  const paceLine =
    stats.pace === 'ahead'
      ? paceDelta > 0
        ? `${paceDelta} ahead of plan.`
        : 'Ahead of plan.'
      : stats.pace === 'behind'
        ? paceDelta > 0
          ? `${paceDelta} behind plan.`
          : 'Slightly behind plan.'
        : 'Right on plan.';

  const objective =
    followUps.length > 0
      ? {
          label: "Today's focus",
          value: `${followUps.length} ${followUps.length === 1 ? 'deal needs' : 'deals need'} review`,
          action: 'Review',
          onPress: () => router.push('/(tabs)/deals'),
