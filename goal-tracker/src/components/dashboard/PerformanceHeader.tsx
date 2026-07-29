import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PaceStatus } from '@/src/types';
import { Mark } from '@/src/components/Mark';
import { StatusBadge, BadgeTone } from './StatusBadge';
import { colors, spacing, typography } from '@/src/theme';

function greeting(hour: number): string {
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

const PACE_TONE: Record<PaceStatus, BadgeTone> = {
  ahead: 'ahead',
  'on-pace': 'onPace',
  behind: 'behind',
};

const PACE_LABEL: Record<PaceStatus, string> = {
  ahead: 'Ahead of pace',
  'on-pace': 'On pace',
  behind: 'Behind pace',
};

export function PerformanceHeader({
  name,
  date,
  pace,
  paceDelta,
  streak,
}: {
  name?: string;
  date: Date;
  pace: PaceStatus;
  paceDelta: number;
  streak: number;
}) {
  const firstName = (name ?? '').trim().split(' ')[0];
  const delta = Math.abs(Math.round(paceDelta));

  const line =
    pace === 'ahead'
      ? delta > 0
        ? `You're ${delta} ahead of plan. Keep the pressure on.`
        : "You're ahead of plan. Keep the pressure on."
      : pace === 'behind'
        ? delta > 0
          ? `${delta} behind plan. Today is where you take it back.`
          : 'Slightly behind plan. Today is where you take it back.'
        : 'Right on plan. Hold the line.';

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.text}>
          <Text style={styles.eyebrow}>
            {greeting(date.getHours())}
            {firstName ? `, ${firstName}` : ''}
          </Text>
          <Text style={styles.headline}>{line}</Text>
        </View>
        <Mark size={28} />
      </View>

      <View style={styles.badges}>
        <StatusBadge label={PACE_LABEL[pace]} tone={PACE_TONE[pace]} />
        {streak > 0 && (
          <StatusBadge
            label={`${streak} day${streak === 1 ? '' : 's'} running`}
            tone="hot"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.sm + 2,
    marginBottom: spacing.lg + 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  text: {
    flex: 1,
    paddingRight: spacing.md,
  },
  eyebrow: {
    ...typography.eyebrow,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.gold,
    marginBottom: spacing.xs + 2,
  },
  headline: {
    ...typography.pageTitle,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: colors.text,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md - 2,
  },
});
