import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoalStats } from '@/src/hooks/useGoalStats';
import { useUIStore } from '@/src/store/uiStore';
import { CircularProgress } from '@/src/components/CircularProgress';
import { PaceBadge } from '@/src/components/PaceBadge';
import { StreakFlame } from '@/src/components/StreakFlame';
import { StatTile } from '@/src/components/StatTile';
import { MilestoneOverlay } from '@/src/components/MilestoneOverlay';
import { Section } from '@/src/components/Section';
import { colors, spacing, typography } from '@/src/theme';
import { parseISODate, shortDateLabel, weekdayLabel } from '@/src/lib/dates';

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

export default function HomeScreen() {
  const { settings, stats } = useGoalStats();
  const pendingCelebration = useUIStore((s) => s.pendingCelebration);
  const clearCelebration = useUIStore((s) => s.clearCelebration);

  const today = new Date();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{weekdayLabel(today)}, {shortDateLabel(today)}</Text>
          <Text style={styles.heading}>Goal Tracker</Text>
        </View>

        <View style={styles.ringWrap}>
          <CircularProgress progress={stats.percentComplete} size={230} strokeWidth={20}>
            <Text style={styles.ringPercent}>{Math.round(stats.percentComplete * 100)}%</Text>
            <Text style={styles.ringFraction}>
              {stats.totalSales} / {settings.salesGoal} sales
            </Text>
          </CircularProgress>
        </View>

        <View style={styles.badgeRow}>
          <PaceBadge pace={stats.pace} />
          <StreakFlame streak={stats.currentStreak} />
        </View>

        <Section title="Today">
          <View style={styles.grid}>
            <StatTile label="Today's sales" value={String(stats.todaySales)} />
            <StatTile label="This week" value={String(stats.weekSales)} />
            <StatTile
              label="Required / day"
              value={round1(Math.max(stats.requiredPerDay, 0))}
              sublabel={`${stats.daysRemaining} days left`}
            />
            <StatTile
              label="Pace vs. plan"
              value={`${stats.paceDelta >= 0 ? '+' : ''}${round1(stats.paceDelta)}`}
              accent={
                stats.pace === 'ahead' ? colors.ahead : stats.pace === 'behind' ? colors.behind : colors.onPace
              }
            />
          </View>
        </Section>

        <Section title="Overall Progress">
          <View style={styles.grid}>
            <StatTile label="Total sales" value={String(stats.totalSales)} />
            <StatTile label="Sales remaining" value={String(stats.salesRemaining)} />
            <StatTile
              label="Projected installs"
              value={String(Math.round(stats.projectedInstalls))}
              sublabel={`${stats.retentionPercent}% retention`}
            />
            <StatTile
              label="Projected finish"
              value={stats.projectedFinishDate ? shortDateLabel(parseISODate(stats.projectedFinishDate)) : '—'}
            />
          </View>
        </Section>
      </ScrollView>

      <MilestoneOverlay
        milestone={pendingCelebration}
        salesGoal={settings.salesGoal}
        onDismiss={clearCelebration}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  heading: {
    ...typography.hero,
    color: colors.text,
    fontSize: 32,
    marginTop: 2,
  },
  ringWrap: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  ringPercent: {
    ...typography.hero,
    color: colors.text,
  },
  ringFraction: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
