import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CircularProgress } from '@/src/components/CircularProgress';
import { colors, radius, shadows, spacing, typography } from '@/src/theme';

/**
 * The goal, as a ring with the numbers that make it actionable sitting beside it.
 *
 * The ring used to stand alone and centred, which looked calm and said very little — a
 * percentage doesn't tell you what to do today. Pairing it with "needed per day" and "days
 * left" turns it from a score into a plan.
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
      accessibilityLabel={`${Math.round(percent * 100)} percent of goal complete. ${total} of ${goal} sales. ${perDay} needed per day with ${daysRemaining} days left.`}
    >
      <View style={[styles.accent, { backgroundColor: ringColor }]} />
      <View style={styles.ringWrap}>
        <CircularProgress progress={percent} size={132} strokeWidth={12} color={ringColor}>
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

        <View style={styles.factRow}>
          <Text style={styles.factValue}>{perDay}</Text>
          <Text style={styles.factLabel}>needed a day</Text>
        </View>
        <View style={styles.factRow}>
          <Text style={styles.factValue}>{daysRemaining}</Text>
          <Text style={styles.factLabel}>days left</Text>
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
    ...shadows.card,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  accent: {
    position: 'absolute',
    top: 0,
    right: spacing.lg,
    left: spacing.lg,
    height: 2,
    borderBottomLeftRadius: radius.round,
    borderBottomRightRadius: radius.round,
  },
  ringWrap: {
    marginRight: spacing.md,
  },
  percent: {
    ...typography.scoreValue,
    fontSize: 30,
    color: colors.text,
  },
  side: {
    flex: 1,
  },
  eyebrow: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.textMuted,
  },
  fraction: {
    ...typography.scoreValue,
    fontSize: 34,
    color: colors.text,
    marginTop: 2,
  },
  fractionGoal: {
    ...typography.scoreValue,
    fontSize: 20,
    color: colors.textFaint,
  },
  rule: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  factValue: {
    ...typography.cardTitle,
    color: colors.text,
    width: 28,
  },
  factLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textFaint,
  },
  closer: {
    ...typography.badge,
    color: colors.gold,
    marginTop: spacing.sm,
  },
});
