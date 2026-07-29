import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoalStats } from '@/src/hooks/useGoalStats';
import { useUIStore } from '@/src/store/uiStore';
import { useAuthStore } from '@/src/store/authStore';
import { pendingFollowUps } from '@/src/lib/dealFollowUps';
import { MilestoneOverlay } from '@/src/components/MilestoneOverlay';
import { Section } from '@/src/components/Section';
import { Screen } from '@/src/components/Screen';
import { Mark } from '@/src/components/Mark';
import { Button } from '@/src/components/Button';
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

function BriefMetric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.metricDetail} numberOfLines={2}>
        {detail}
      </Text>
    </View>
  );
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
  const firstName = (profile?.displayName ?? '').trim().split(' ')[0];
  const followUps = useMemo(() => pendingFollowUps(deals), [deals]);

  // Cancelled deals remain excluded: a fallen-through deal is not recent momentum.
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
            : 'Stay on pace.';

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
          label: 'Needs an answer',
          value: `${followUps.length} ${followUps.length === 1 ? 'deal' : 'deals'}`,
          action: 'Review',
          onPress: () => router.push('/(tabs)/deals'),
        }
      : shortOfToday > 0
        ? {
            label: "Today's objective",
            value: `${shortOfToday} more ${shortOfToday === 1 ? 'close' : 'closes'}`,
            action: 'Log sale',
            onPress: () => router.push('/add-deal'),
          }
        : {
            label: "Today's objective",
            value: 'Complete',
            action: 'Close the day',
            onPress: () => router.push('/day'),
          };

  return (
    <>
      <Screen testID="dashboard-screen">
        <View style={styles.intro}>
          <View>
            <Text style={styles.greeting}>
              {greeting(today)}{firstName ? `, ${firstName}` : ''}
            </Text>
            <Text style={styles.today}>Today</Text>
          </View>
          <Mark size={28} />
        </View>

        <View
          style={styles.hero}
          accessible
          accessibilityRole="summary"
          accessibilityLabel={`${headline} ${stats.totalSales} of ${settings.salesGoal} sales. ${remaining} left. ${paceLine}`}
        >
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.progress} numberOfLines={1} adjustsFontSizeToFit>
            {stats.totalSales}
            <Text style={styles.progressGoal}> / {settings.salesGoal}</Text>
          </Text>
          <Text style={styles.remaining}>{remaining === 0 ? 'Complete.' : `${remaining} left.`}</Text>
          <Text style={styles.pace}>{paceLine}</Text>
        </View>

        {/* The one loud thing. This was a blue text link inside a row — the least prominent
            element on a screen whose whole job is getting a rep to log a sale and leave. */}
        <View style={styles.objective}>
          <Text style={styles.objectiveLabel}>{objective.label}</Text>
          <Text style={styles.objectiveValue}>{objective.value}</Text>
          <Button
            label={objective.action}
            onPress={objective.onPress}
            variant="hero"
            size="xl"
            style={styles.objectiveCta}
          />
        </View>

        <View style={styles.divider} />

        <Section title="Performance" index={0}>
          <View style={styles.metricGrid}>
            <BriefMetric
              label="Today"
              value={stats.todaySales}
              detail={shortOfToday > 0 ? `${shortOfToday} more today` : 'Objective complete'}
            />
            <BriefMetric
              label="This week"
              value={stats.weekSales}
              detail={`${round1(stats.requiredPerWeek)} needed`}
            />
            <BriefMetric
              label="Pace"
              value={`${stats.paceDelta >= 0 ? '+' : ''}${round1(stats.paceDelta)}`}
              detail={`${round1(stats.expectedByToday)} expected`}
            />
            <BriefMetric
              label="Streak"
              value={stats.currentStreak}
              detail={stats.currentStreak >= stats.longestStreak && stats.currentStreak > 0 ? 'Personal best' : `Best ${stats.longestStreak}`}
            />
          </View>
        </Section>

        <Section title="Outlook" index={1}>
          <View style={styles.metricGrid}>
            <BriefMetric
              label="Daily average"
              value={round1(stats.runningAverage)}
              detail={`${stats.daysElapsed} days logged`}
            />
            <BriefMetric
              label="Best day"
              value={stats.bestDay?.count ?? 0}
              detail={stats.bestDay ? shortDateLabel(parseISODate(stats.bestDay.date)) : 'Not set yet'}
            />
            <BriefMetric
              label="Projected installs"
              value={Math.round(stats.projectedInstalls)}
              detail={`${stats.retentionPercent}% retention`}
            />
            <BriefMetric
              label="Projected finish"
              value={stats.projectedFinishDate ? shortDateLabel(parseISODate(stats.projectedFinishDate)) : '—'}
              detail={stats.projectedFinishDate ? 'At this pace' : 'More days needed'}
            />
          </View>
        </Section>

        <Section
          title="Latest"
          index={2}
          right={
            <Pressable onPress={() => router.push('/(tabs)/deals')} hitSlop={8}>
              <Text style={styles.seeAll}>All deals</Text>
            </Pressable>
          }
        >
          {recent.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>The board is clear.</Text>
              <Text style={styles.emptyBody}>Your first sale starts the record.</Text>
              <Pressable onPress={() => router.push('/add-deal')} hitSlop={8}>
                <Text style={styles.emptyAction}>Log sale →</Text>
              </Pressable>
            </View>
          ) : (
            recent.map((deal) => (
              <Pressable
                key={deal.id}
                accessibilityRole="button"
                accessibilityLabel={`${deal.customerName || deal.address || 'Deal'}, ${deal.stage}`}
                style={({ pressed }) => [styles.activity, pressed && styles.activityPressed]}
                onPress={() => router.push('/(tabs)/deals')}
              >
                <View style={styles.activityText}>
                  <Text style={styles.activityName} numberOfLines={1}>
                    {deal.customerName || deal.address || 'Deal'}
                  </Text>
                  <Text style={styles.activityMeta}>
                    {shortDateLabel(parseISODate(deal.date))} · {deal.stage}
                  </Text>
                </View>
                <Text style={styles.activityArrow}>→</Text>
              </Pressable>
            ))
          )}
        </Section>

        <Pressable
          style={({ pressed }) => [styles.dayAction, pressed && styles.activityPressed]}
          accessibilityRole="button"
          accessibilityLabel={today.getHours() < 14 ? 'Roll out for the day' : 'Wrap up the day'}
          onPress={() => router.push('/day')}
        >
          <Text style={styles.dayLabel}>{today.getHours() < 14 ? 'Roll out' : 'Wrap up'}</Text>
          <Text style={styles.dayArrow}>→</Text>
        </Pressable>
      </Screen>

      <MilestoneOverlay
        milestone={pendingCelebration}
        dailyAlert={pendingDailyAlert}
        salesGoal={settings.salesGoal}
        onDismiss={pendingDailyAlert ? clearDailyAlert : clearCelebration}
      />
    </>
  );
}

const styles = StyleSheet.create({
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
  },
  greeting: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  today: {
    ...typography.eyebrow,
    color: colors.gold,
  },
  hero: {
    paddingTop: spacing.xxxl + spacing.md,
    paddingBottom: spacing.xxxl,
  },
  headline: {
    ...typography.pageTitle,
    color: colors.text,
    fontSize: 42,
    lineHeight: 46,
    marginBottom: spacing.xl,
  },
  progress: {
    ...typography.metricHero,
    color: colors.text,
    fontSize: 76,
    lineHeight: 82,
  },
  progressGoal: {
    ...typography.metric,
    fontSize: 30,
    color: colors.textFaint,
  },
  remaining: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  /** Gold is the brand thread and pace is the one line worth reading twice. */
  pace: {
    ...typography.eyebrow,
    fontSize: 11,
    color: colors.gold,
    marginTop: spacing.sm,
  },
  objective: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  objectiveLabel: { ...typography.eyebrow, color: colors.textMuted, fontSize: 10 },
  objectiveValue: { ...typography.title, color: colors.text, marginTop: spacing.sm },
  objectiveCta: { marginTop: spacing.md },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginTop: spacing.xxxl,
    marginBottom: spacing.xxl,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metric: {
    flexBasis: '50%',
    minWidth: 140,
    paddingVertical: spacing.lg,
    paddingRight: spacing.lg,
  },
  metricLabel: { ...typography.eyebrow, color: colors.textMuted, fontSize: 10 },
  metricValue: { ...typography.metric, color: colors.text, marginTop: spacing.sm + 2 },
  metricDetail: { ...typography.caption, color: colors.textMuted, fontSize: 11, marginTop: spacing.xs },
  seeAll: { ...typography.badge, color: colors.textMuted },
  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 66,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingVertical: spacing.sm,
  },
  activityPressed: { opacity: 0.62 },
  activityText: { flex: 1 },
  activityName: { ...typography.cardTitle, color: colors.text },
  activityMeta: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textFaint,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  activityArrow: { ...typography.subtitle, color: colors.textFaint },
  empty: { paddingVertical: spacing.lg },
  emptyTitle: { ...typography.subtitle, color: colors.text },
  emptyBody: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
  emptyAction: {
    ...typography.button,
    color: colors.text,
    textDecorationLine: 'underline',
    marginTop: spacing.md,
  },
  dayAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
  },
  dayLabel: { ...typography.eyebrow, color: colors.textSecondary },
  dayArrow: { ...typography.subtitle, color: colors.gold },
});
