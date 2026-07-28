import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGoalStats } from '@/src/hooks/useGoalStats';
import { useUIStore } from '@/src/store/uiStore';
import { useAuthStore } from '@/src/store/authStore';
import { pendingFollowUps } from '@/src/lib/dealFollowUps';
import { MilestoneOverlay } from '@/src/components/MilestoneOverlay';
import { Section } from '@/src/components/Section';
import { PullQuote } from '@/src/components/PullQuote';
import { PerformanceHeader } from '@/src/components/dashboard/PerformanceHeader';
import { GoalProgressCard } from '@/src/components/dashboard/GoalProgressCard';
import { MetricCard } from '@/src/components/dashboard/MetricCard';
import { NextActionCard } from '@/src/components/dashboard/NextActionCard';
import { colors, layout, radius, spacing, typography } from '@/src/theme';
import { parseISODate, shortDateLabel } from '@/src/lib/dates';

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

export default function HomeScreen() {
  const router = useRouter();
  const { deals, settings, stats } = useGoalStats();
  const profile = useAuthStore((s) => s.profile);
  const pendingCelebration = useUIStore((s) => s.pendingCelebration);
  const clearCelebration = useUIStore((s) => s.clearCelebration);
  const pendingDailyAlert = useUIStore((s) => s.pendingDailyAlert);
  const clearDailyAlert = useUIStore((s) => s.clearDailyAlert);

  const today = new Date();

  const paceColor =
    stats.pace === 'ahead' ? colors.ahead : stats.pace === 'behind' ? colors.behind : colors.onPace;

  const followUps = useMemo(() => pendingFollowUps(deals), [deals]);

  // The four most recent live deals. Cancelled ones are excluded here for the same reason
  // they're excluded everywhere else — a fallen-through deal is not recent momentum.
  const recent = useMemo(
    () =>
      deals
        .filter((d) => !d.deletedAt && d.stage !== 'cancelled')
        .sort((a, b) => b.soldAt.localeCompare(a.soldAt))
        .slice(0, 4),
    [deals]
  );

  const shortOfToday = Math.max(Math.ceil(stats.requiredPerDay) - stats.todaySales, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PerformanceHeader
          name={profile?.displayName}
          date={today}
          pace={stats.pace}
          paceDelta={stats.paceDelta}
          streak={stats.currentStreak}
        />

        <GoalProgressCard
          percent={stats.percentComplete}
          total={stats.totalSales}
          goal={settings.salesGoal}
          requiredPerDay={stats.requiredPerDay}
          daysRemaining={stats.daysRemaining}
          ringColor={paceColor}
        />

        {/* Exactly one next action, picked from real state rather than offering a menu. */}
        {followUps.length > 0 ? (
          <NextActionCard
            eyebrow="Needs an answer"
            headline={`${followUps.length} ${followUps.length === 1 ? 'deal is' : 'deals are'} waiting on you`}
            detail="Confirm the install or the payday and clear the list."
            icon="clock-o"
            tone="attention"
            onPress={() => router.push('/(tabs)/deals')}
          />
        ) : shortOfToday > 0 ? (
          <NextActionCard
            eyebrow="Today"
            headline={`${shortOfToday} more to hit today's number`}
            detail="Log it the moment it closes — the streak counts calendar days."
            icon="plus"
            onPress={() => router.push('/add-deal')}
          />
        ) : (
          <NextActionCard
            eyebrow="Today"
            headline="Today's number is done"
            detail="Close the day out and set tomorrow's target."
            icon="check"
            onPress={() => router.push('/day')}
          />
        )}

        <Section title="Today">
          <View style={styles.grid}>
            <MetricCard
              label="Sales today"
              value={stats.todaySales}
              sublabel={shortOfToday > 0 ? `${shortOfToday} short of target` : 'Target cleared'}
              accent={shortOfToday > 0 ? undefined : colors.ahead}
              icon="bolt"
            />
            <MetricCard
              label="This week"
              value={stats.weekSales}
              sublabel={`${round1(stats.requiredPerWeek)} needed a week`}
              icon="calendar"
            />
            <MetricCard
              label="Pace vs plan"
              value={`${stats.paceDelta >= 0 ? '+' : ''}${round1(stats.paceDelta)}`}
              sublabel={`${round1(stats.expectedByToday)} expected by now`}
              trend={stats.paceDelta > 0 ? 'up' : stats.paceDelta < 0 ? 'down' : 'flat'}
              accent={paceColor}
            />
            <MetricCard
              label="Current streak"
              value={stats.currentStreak}
              sublabel={
                stats.currentStreak >= stats.longestStreak && stats.currentStreak > 0
                  ? 'Your best run yet'
                  : `Best is ${stats.longestStreak}`
              }
              accent={stats.currentStreak > 0 ? colors.fire : undefined}
              icon="fire"
            />
          </View>
        </Section>

        <Section title="Momentum">
          <View style={styles.grid}>
            <MetricCard
              label="Daily average"
              value={round1(stats.runningAverage)}
              sublabel={`over ${stats.daysElapsed} days`}
            />
            <MetricCard
              label="Best day"
              value={stats.bestDay?.count ?? 0}
              sublabel={
                stats.bestDay ? shortDateLabel(parseISODate(stats.bestDay.date)) : 'Not set yet'
              }
            />
            <MetricCard
              label="Projected installs"
              value={Math.round(stats.projectedInstalls)}
              sublabel={`${stats.retentionPercent}% retention`}
            />
            <MetricCard
              label="Projected finish"
              value={
                stats.projectedFinishDate
                  ? shortDateLabel(parseISODate(stats.projectedFinishDate))
                  : '—'
              }
              sublabel={stats.projectedFinishDate ? 'at this pace' : 'need more days logged'}
            />
          </View>
        </Section>

        <Section
          title="Latest"
          right={
            <Pressable onPress={() => router.push('/(tabs)/deals')} hitSlop={8}>
              <Text style={styles.seeAll}>All deals</Text>
            </Pressable>
          }
        >
          {recent.length === 0 ? (
            <Pressable style={styles.empty} onPress={() => router.push('/add-deal')}>
              <Text style={styles.emptyTitle}>Nothing on the board yet</Text>
              <Text style={styles.emptyBody}>
                Your first logged deal starts the streak and every number above it.
              </Text>
              <Text style={styles.emptyCta}>Log a deal →</Text>
            </Pressable>
          ) : (
            recent.map((d) => (
              <Pressable
                key={d.id}
                style={({ pressed }) => [styles.activity, pressed && styles.activityPressed]}
                onPress={() => router.push('/(tabs)/deals')}
              >
                <View style={styles.activityDot} />
                <View style={styles.activityText}>
                  <Text style={styles.activityName} numberOfLines={1}>
                    {d.customerName || d.address || 'Deal'}
                  </Text>
                  <Text style={styles.activityMeta}>
                    {shortDateLabel(parseISODate(d.date))} · {d.stage}
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={11} color={colors.textFaint} />
              </Pressable>
            ))
          )}
        </Section>

        <View style={styles.quickRow}>
          <Pressable
            style={({ pressed }) => [styles.quick, pressed && styles.quickPressed]}
            onPress={() => router.push('/day')}
          >
            <FontAwesome name="sun-o" size={14} color={colors.gold} />
            <Text style={styles.quickLabel}>
              {today.getHours() < 14 ? 'Roll out' : 'Wrap up'}
            </Text>
          </Pressable>
        </View>

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
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
    maxWidth: layout.dashboardMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  seeAll: {
    ...typography.badge,
    color: colors.primary,
  },
  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  activityPressed: {
    backgroundColor: colors.surfacePressed,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: radius.round,
    backgroundColor: colors.success,
    marginRight: spacing.md,
  },
  activityText: {
    flex: 1,
  },
  activityName: {
    ...typography.cardTitle,
    color: colors.text,
  },
  activityMeta: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textFaint,
    marginTop: 1,
    textTransform: 'capitalize',
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.lg,
    alignItems: 'flex-start',
  },
  emptyTitle: {
    ...typography.cardTitle,
    color: colors.text,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 21,
  },
  emptyCta: {
    ...typography.badge,
    color: colors.primary,
    marginTop: spacing.md,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  quick: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  quickPressed: {
    backgroundColor: colors.surfacePressed,
  },
  quickLabel: {
    ...typography.badge,
    color: colors.text,
  },
});
