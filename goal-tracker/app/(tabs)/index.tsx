import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useGoalStats } from '@/src/hooks/useGoalStats';
import { useUIStore } from '@/src/store/uiStore';
import { useAuthStore } from '@/src/store/authStore';
import { pendingFollowUps } from '@/src/lib/dealFollowUps';
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

type MetricIcon = React.ComponentProps<typeof FontAwesome>['name'];

function AtmosphericBackdrop() {
  return (
    <View pointerEvents="none" style={styles.atmosphere}>
      <LinearGradient
        colors={[colors.infoSurface, colors.brandSurface, colors.background]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.energyOne} />
      <View style={styles.energyTwo} />
      <Svg width="100%" height="520" viewBox="0 0 760 520" style={styles.contours}>
        <G fill="none" stroke={colors.primary} strokeWidth="1" opacity="0.1">
          <Path d="M-70 212C67 119 188 131 302 205s241 75 528-57" />
          <Path d="M-72 238C69 145 187 156 296 226s239 73 532-53" />
          <Path d="M-74 266C73 174 184 182 287 248s238 70 545-48" />
          <Path d="M-78 298C79 207 183 211 279 272s237 65 555-44" />
          <Path d="M-82 334C86 245 181 245 270 301s237 58 570-40" />
        </G>
      </Svg>
      <LinearGradient
        colors={['transparent', colors.background]}
        locations={[0.3, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function OuroborosMark({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="MyHQ ouroboros mark">
      <G fill="none" stroke={colors.textSecondary} strokeLinecap="round" strokeLinejoin="round">
        <Path
          d="M48.8 15.3C42.2 8.8 31.7 7.2 23.5 11.6 13.8 16.8 9.4 28.5 12.8 39c3.7 11.5 15.8 18.1 27.3 14.8 8.8-2.5 14.8-10.4 15.1-19.2"
          strokeWidth="5.2"
        />
        <Path d="M47.9 15.8c4.7-2.1 8.7-.7 10.5 2.8-2.1 1.5-3.6 3.5-4.5 6l-6.6-2.2-4.5 2.2 1.5-5.1-3.2-3.8 6.8.1Z" strokeWidth="2.2" fill={colors.surfaceRaised} />
        <Path d="M53.8 24.6c-3.2 4.2-3.1 8.1 1.4 10" strokeWidth="2.2" />
        <Path d="M14.5 30.1c5.1-1.9 9.5-5.5 12.5-10.1M15.1 42.4c6-1 11.3-4.2 15.1-9M24.3 52c5.2-2.2 9.5-6.1 12.3-11" strokeWidth="1" opacity="0.66" />
        <Path d="M20.2 14.1c3.5 2.6 6.1 6.3 7.3 10.4M34.2 9.4c1.4 4.4 1.3 8.7-.3 12.8M46.4 14.1c-1.3 3.5-3.6 6.7-6.6 9" strokeWidth="1" opacity="0.66" />
      </G>
      <Circle cx="52.1" cy="18.2" r="1.1" fill={colors.text} />
    </Svg>
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
          <OuroborosMark size={wide ? 64 : 58} />
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
    height: 760,
    overflow: 'hidden',
  },
  energyOne: {
    position: 'absolute',
    width: 520,
    height: 220,
    borderRadius: radius.round,
    borderWidth: 34,
    borderColor: colors.primary,
    opacity: 0.08,
    top: 104,
    left: '14%',
    transform: [{ rotate: '-14deg' }, { scaleX: 1.35 }],
  },
  energyTwo: {
    position: 'absolute',
    width: 360,
    height: 160,
    borderRadius: radius.round,
    borderWidth: 18,
    borderColor: colors.primaryMuted,
    opacity: 0.06,
    top: 238,
    right: '-22%',
    transform: [{ rotate: '21deg' }, { scaleX: 1.4 }],
  },
  contours: { position: 'absolute', top: 80, left: 0, right: 0 },
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
    color: colors.primaryMuted,
  },
  hero: {
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xxxl,
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
    borderColor: colors.premium,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  closeDayPressed: { opacity: 0.76 },
  closeDayCopy: { flex: 1, paddingRight: spacing.md },
  closeDayEyebrow: { ...typography.eyebrow, color: colors.premium, fontSize: 10 },
  closeDayTitle: { ...typography.subtitle, color: colors.text, marginTop: spacing.sm },
  closeDayBody: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  closeDayAction: { ...typography.button, color: colors.primary, maxWidth: 112, textAlign: 'right' },
});
