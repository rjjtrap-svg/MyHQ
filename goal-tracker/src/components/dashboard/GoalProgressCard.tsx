import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CircularProgress } from '@/src/components/CircularProgress';
import { colors, elevation, layout, radius, spacing, typography } from '@/src/theme';

/**
 * The goal, as a ring with the numbers that make it actionable sitting beside it.
 *
 * Premium-refined treatment: the ring carries the status colour, the side panel stays
 * quiet so the numbers can breathe, and the top accent is a soft signal rather than a
 * hard stripe.
 */
export function GoalProgressCard({
  percent,
  total,
  goal,
  requiredPerDay,
  daysRemaining,
  ringColor,
}: {
  /** 0..1 */
  percent: number;
  total: number;
  goal: number;
  requiredPerDay: number;
  daysRemaining: number;
  ringColor: string;
}) {
  const remaining = Math.max(goal - total, 0);
  const perDay = Math.max(Math.ceil(requiredPerDay), 0);

  return (
    <View
      style={styles.card}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${Math.round(percent * 100)} percent complete. ${total} of ${goal} sales. ${perDay} needed per day, with ${daysRemaining} days left.`}
    >
      <View style={[styles.accent, { backgroundColor: ringColor }]} />

      <View style={styles.ringWrap}>
        <CircularProgress progress={percent} size={128} strokeWidth={11} color={ringColor}>
          <Text style={styles.percent}>{Math.round(percent * 100)}%</Text>
        </CircularProgress>
      </View>

      <View style={styles.side}>
        <Text style={styles.eyebrow}>Goal</Text>
        <Text style={styles.fraction}>
          {total}
          <Text style={styles.fractionGoal}> / {goal}</Text>
        </Text>

        <View style={styles.rule} />

        <View style={styles.facts}>
          <View style={styles.factRow}>
            <Text style={styles.factValue}>{perDay}</Text>
            <Text style={styles.factLabel}>needed a day</Text>
          </View>
          <View style={styles.factRow}>
            <Text style={styles.factValue}>{daysRemaining}</Text>
            <Text style={styles.factLabel}>days left</Text>
          </View>
        </View>

        {remaining === 0 ? (
          <Text style={styles.closer}>Goal met. Everything from here is upside.</Text>
        ) : (
          <Text style={styles.closer}>
            {remaining} {remaining === 1 ? 'sale' : 'sales'} to go
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...elevation.raised,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: layout.cardPadding,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    opacity: 0.85,
  },
  ringWrap: {
    marginRight: spacing.md + 2,
  },
  percent: {
    ...typography.metric,
    fontSize: 28,
    letterSpacing: -0.6,
    color: colors.text,
  },
  side: {
    flex: 1,
  },
  eyebrow: {
    ...typography.eyebrow,
    fontSize: 9,
    letterSpacing: 1.4,
    color: colors.textMuted,
  },
  fraction: {
    ...typography.metric,
    fontSize: 28,
    letterSpacing: -0.6,
    color: colors.text,
    marginTop: 1,
  },
  fractionGoal: {
    ...typography.scoreValue,
    fontSize: 18,
    color: colors.textFaint,
  },
  rule: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  facts: {
    gap: 1,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  factValue: {
    ...typography.cardTitle,
    fontSize: 14,
    color: colors.text,
    width: 26,
  },
  factLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textFaint,
  },
  closer: {
    ...typography.badge,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.gold,
    marginTop: spacing.sm,
  },
});
