import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGoalStats } from '@/src/hooks/useGoalStats';
import { useUIStore } from '@/src/store/uiStore';
import { CircularProgress } from '@/src/components/CircularProgress';
import { PaceBadge } from '@/src/components/PaceBadge';
import { StreakFlame } from '@/src/components/StreakFlame';
import { StatTile } from '@/src/components/StatTile';
import { MilestoneOverlay } from '@/src/components/MilestoneOverlay';
import { Section } from '@/src/components/Section';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { PullQuote } from '@/src/components/PullQuote';
import { colors, radius, spacing, typography } from '@/src/theme';
import { parseISODate, shortDateLabel, weekdayLabel } from '@/src/lib/dates';

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

export default function HomeScreen() {
  const router = useRouter();
  const { settings, stats } = useGoalStats();
  const pendingCelebration = useUIStore((s) => s.pendingCelebration);
  const clearCelebration = useUIStore((s) => s.clearCelebration);
  const pendingDailyAlert = useUIStore((s) => s.pendingDailyAlert);
  const clearDailyAlert = useUIStore((s) => s.clearDailyAlert);

  const today = new Date();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow={`${weekdayLabel(today)} · ${shortDateLabel(today)}`}
          title="Goal Tracker"
        />

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

        {/* Territory is a full screen rather than an eighth tab — the bar is already at
            seven with three either side of Add, and an eighth truncates every label. */}
        <Pressable style={styles.territoryLink} onPress={() => router.push('/territory')}>
          <View style={styles.territoryText}>
            <Text style={styles.territoryEyebrow}>The street</Text>
            <Text style={styles.territoryTitle}>Work a territory</Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color={colors.accent} />
        </Pressable>

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

        <PullQuote />
      </ScrollView>

      <MilestoneOverlay
        milestone={pendingCelebration}
        dailyAlert={pendingDailyAlert}
        salesGoal={settings.salesGoal}
        onDismiss={pendingDailyAlert ? clearDailyAlert : clearCelebration}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  territoryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  territoryText: {
    flex: 1,
  },
  territoryEyebrow: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.gold,
  },
  territoryTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginTop: 2,
  },
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
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
