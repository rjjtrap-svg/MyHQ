import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useGoalStats } from '@/src/hooks/useGoalStats';
import { useUIStore } from '@/src/store/uiStore';
import { useAuthStore } from '@/src/store/authStore';
import { pendingFollowUps } from '@/src/lib/dealFollowUps';
import { MilestoneOverlay } from '@/src/components/MilestoneOverlay';
import { Section } from '@/src/components/Section';
import { Screen } from '@/src/components/Screen';
import { Mark } from '@/src/components/Mark';
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

type MetricIcon = React.ComponentProps<typeof FontAwesome>['name'];

// A single quiet wash, not a pattern — contour lines and glow rings read as decoration
// competing with the numbers, and the app's own design system rules that out on purpose.
function AtmosphericBackdrop() {
  return (
    <View pointerEvents="none" style={styles.atmosphere}>
      <LinearGradient
        colors={[colors.goldSurface, colors.brandSurface, colors.background]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function BriefMetric({
  label,
  value,
  detail,
  icon,
  wide,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: MetricIcon;
  wide: boolean;
}) {
  return (
    <View style={[styles.metric, wide && styles.metricWide]}>
      <View style={styles.metricHead}>
        <FontAwesome name={icon} size={11} color={colors.primary} />
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
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
        }
      : shortOfToday > 0
        ? {
            label: "Today's focus",
            value: `${shortOfToday} more ${shortOfToday === 1 ? 'close' : 'closes'}`,
            action: 'Log sale',
            onPress: () => router.push('/add-deal'),
          }
        : {
            label: "Today's focus",
            value: 'Complete',
            action: 'Close the day',
            onPress: () => router.push('/day'),
          };

  return (
    <>
      <Screen testID="dashboard-screen">
        <AtmosphericBackdrop />
        <View style={styles.intro}>
          <View>
            <Text style={styles.greeting}>
              {greeting(today)}{firstName ? `, ${firstName}` : ''}
            </Text>
            <Text style={styles.today}>Today</Text>
          </View>
          <Mark size={32} />
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

        <Pressable
          onPress={objective.onPress}
          accessibilityRole="button"
          accessibilityLabel={`${objective.label}. ${objective.value}. ${objective.action}`}
          style={({ pressed }) => [styles.focus, pressed && styles.focusPressed]}
        >
          <View style={styles.focusCopy}>
            <Text style={styles.focusLabel}>{objective.label}</Text>
            <Text style={styles.focusValue}>{objective.value}</Text>
          </View>
          <Text style={styles.focusAction}>{objective.action} →</Text>
        </Pressable>

        <Section title="Performance">
          <View style={styles.metricGrid}>
            <BriefMetric
              label="Today"
              value={stats.todaySales}
              detail={shortOfToday > 0 ? `${shortOfToday} more today` : 'Objective complete'}
              icon="bolt"
              wide={wide}
            />
            <BriefMetric
              label="This week"
              value={stats.weekSales}
              detail={`${round1(stats.requiredPerWeek)} needed`}
              icon="calendar"
              wide={wide}
            />
            <BriefMetric
              label="Pace"
              value={`${stats.paceDelta >= 0 ? '+' : ''}${round1(stats.paceDelta)}`}
              detail={`${round1(stats.expectedByToday)} expected`}
              icon="line-chart"
              wide={wide}
            />
            <BriefMetric
              label="Streak"
              value={stats.currentStreak}
              detail={stats.currentStreak >= stats.longestStreak && stats.currentStreak > 0 ? 'Personal best' : `Best ${stats.longestStreak}`}
              icon="circle-o-notch"
              wide={wide}
            />
          </View>
        </Section>

        <Section title="Outlook">
          <View style={styles.metricGrid}>
            <BriefMetric
              label="Daily average"
              value={round1(stats.runningAverage)}
              detail={`${stats.daysElapsed} days logged`}
              icon="signal"
              wide={wide}
            />
            <BriefMetric
              label="Best day"
              value={stats.bestDay?.count ?? 0}
              detail={stats.bestDay ? shortDateLabel(parseISODate(stats.bestDay.date)) : 'Not set yet'}
              icon="trophy"
              wide={wide}
            />
            <BriefMetric
              label="Projected installs"
              value={Math.round(stats.projectedInstalls)}
              detail={`${stats.retentionPercent}% retention`}
              icon="check-circle-o"
              wide={wide}
            />
            <BriefMetric
              label="Projected finish"
              value={stats.projectedFinishDate ? shortDateLabel(parseISODate(stats.projectedFinishDate)) : '—'}
              detail={stats.projectedFinishDate ? 'At this pace' : 'More days needed'}
              icon="flag-checkered"
              wide={wide}
            />
          </View>
        </Section>

        <Section
          title="Latest"
          right={
            <Pressable onPress={() => router.push('/(tabs)/deals')} hitSlop={8}>
              <Text style={styles.seeAll}>View all deals</Text>
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
          style={({ pressed }) => [styles.closeDay, pressed && styles.closeDayPressed]}
          accessibilityRole="button"
          accessibilityLabel="Close the day. Review, reflect, and reset."
          onPress={() => router.push('/day')}
        >
          <LinearGradient
            colors={[colors.brandSurface, colors.surfaceElevated]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.closeDayCopy}>
            <Text style={styles.closeDayEyebrow}>Close the day</Text>
            <Text style={styles.closeDayTitle}>Review. Reflect. Reset.</Text>
            <Text style={styles.closeDayBody}>Close strong and prepare for tomorrow.</Text>
          </View>
          <Text style={styles.closeDayAction}>Close the day →</Text>
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
  atmosphere: {
    position: 'absolute',
    top: 0,
    left: -spacing.xl,
    right: -spacing.xl,
    height: 420,
    overflow: 'hidden',
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
  },
  greeting: {
    ...typography.eyebrow,
    color: colors.textMuted,
    marginBottom: spacing.xs + 2,
  },
  today: {
    ...typography.eyebrow,
    color: colors.primary,
  },
  hero: {
    paddingTop: spacing.xxl + spacing.xl,
    paddingBottom: spacing.xxxl + spacing.md,
  },
  headline: {
    ...typography.pageTitle,
    color: colors.text,
    fontSize: 38,
    lineHeight: 44,
    marginBottom: spacing.lg,
  },
  progress: {
    ...typography.metricHero,
    color: colors.text,
    fontSize: 64,
    lineHeight: 72,
  },
  progressGoal: {
    ...typography.metric,
    color: colors.textFaint,
  },
  remaining: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  pace: {
    ...typography.caption,
    color: colors.primaryMuted,
    marginTop: spacing.sm,
  },
  focus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 88,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  focusPressed: { opacity: 0.65 },
  focusCopy: { flex: 1, paddingRight: spacing.md },
  focusLabel: { ...typography.eyebrow, color: colors.textMuted, fontSize: 10 },
  focusValue: { ...typography.subtitle, color: colors.text, marginTop: spacing.sm },
  focusAction: { ...typography.button, color: colors.primary },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metric: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 140,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.brandSurface,
  },
  metricWide: { flexBasis: '23%', minWidth: 0 },
  metricHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metricLabel: { ...typography.eyebrow, color: colors.textMuted, fontSize: 9, flex: 1 },
  metricValue: { ...typography.metric, color: colors.text, marginTop: spacing.sm },
  metricDetail: { ...typography.caption, color: colors.textMuted, fontSize: 11, marginTop: spacing.xs },
  seeAll: { ...typography.badge, color: colors.primary },
  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    backgroundColor: colors.brandSurface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
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
  emptyAction: { ...typography.button, color: colors.primary, marginTop: spacing.md },
  closeDay: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  closeDayPressed: { opacity: 0.76 },
  closeDayCopy: { flex: 1, paddingRight: spacing.md },
  closeDayEyebrow: { ...typography.eyebrow, color: colors.primary, fontSize: 10 },
  closeDayTitle: { ...typography.subtitle, color: colors.text, marginTop: spacing.sm },
  closeDayBody: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  closeDayAction: { ...typography.button, color: colors.primary, maxWidth: 112, textAlign: 'right' },
});
