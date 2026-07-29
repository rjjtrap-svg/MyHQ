import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGoalStats } from '@/src/hooks/useGoalStats';
import { useUIStore } from '@/src/store/uiStore';
import { useAuthStore } from '@/src/store/authStore';
import { MilestoneOverlay } from '@/src/components/MilestoneOverlay';
import { Screen } from '@/src/components/Screen';
import { colors, radius, spacing, typography, fonts } from '@/src/theme';

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

export default function HomeScreen() {
  const router = useRouter();
  const { settings, stats } = useGoalStats();
  const profile = useAuthStore((s) => s.profile);
  const pendingCelebration = useUIStore((s) => s.pendingCelebration);
  const clearCelebration = useUIStore((s) => s.clearCelebration);
  const pendingDailyAlert = useUIStore((s) => s.pendingDailyAlert);
  const clearDailyAlert = useUIStore((s) => s.clearDailyAlert);

  const today = new Date();
  const firstName = (profile?.displayName ?? '').trim().split(' ')[0];

  const shortOfToday = Math.max(Math.ceil(stats.requiredPerDay) - stats.todaySales, 0);
  const remaining = Math.max(settings.salesGoal - stats.totalSales, 0);

  const headline =
    stats.pace === 'ahead'
      ? 'Keep the pressure on.'
      : stats.pace === 'behind'
        ? 'Take it back.'
        : 'Hold the line.';

  const paceLabel =
    stats.pace === 'ahead' ? 'AHEAD OF PACE' : stats.pace === 'behind' ? 'BEHIND PACE' : 'ON PACE';

  const paceColor =
    stats.pace === 'ahead' ? colors.ahead : stats.pace === 'behind' ? colors.behind : colors.onPace;

  return (
    <>
      <Screen testID="dashboard-screen">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            {today.getHours() < 12 ? 'Morning' : today.getHours() < 17 ? 'Afternoon' : 'Evening'}
            {firstName ? `, ${firstName}` : ''}
          </Text>
          <Text style={styles.headline}>{headline}</Text>
        </View>

        {/* Giant Progress */}
        <View style={styles.progressBlock}>
          <Text style={styles.bigNumber}>
            {stats.totalSales}
            <Text style={styles.bigGoal}> / {settings.salesGoal}</Text>
          </Text>
          <Text style={styles.subLine}>
            {remaining} left • {Math.abs(Math.round(stats.paceDelta))}{' '}
            {stats.pace === 'ahead' ? 'ahead' : stats.pace === 'behind' ? 'behind' : 'on'} plan
          </Text>

          <View style={[styles.pacePill, { borderColor: paceColor }]}>
            <View style={[styles.paceDot, { backgroundColor: paceColor }]} />
            <Text style={[styles.paceText, { color: paceColor }]}>{paceLabel}</Text>
          </View>
        </View>

        {/* Today's Focus */}
        <Pressable
          style={({ pressed }) => [styles.focusCard, pressed && styles.focusPressed]}
          onPress={() => router.push(shortOfToday > 0 ? '/add-deal' : '/day')}
        >
          <View style={styles.focusLeft}>
            <Text style={styles.focusEyebrow}>TODAY'S FOCUS</Text>
            <Text style={styles.focusHeadline}>
              {shortOfToday > 0
                ? `${shortOfToday} more close${shortOfToday === 1 ? '' : 's'}`
                : "Today's number is done"}
            </Text>
          </View>
          <View style={styles.focusButton}>
            <Text style={styles.focusButtonText}>
              {shortOfToday > 0 ? 'Log sale →' : 'Wrap up →'}
            </Text>
          </View>
        </Pressable>

        {/* Performance row */}
        <Text style={styles.sectionLabel}>Performance</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Sales today</Text>
            <Text style={styles.metricValue}>{stats.todaySales}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>This week</Text>
            <Text style={styles.metricValue}>{stats.weekSales}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Pace</Text>
            <Text style={[styles.metricValue, { color: paceColor }]}>
              {stats.paceDelta >= 0 ? '+' : ''}
              {round1(stats.paceDelta)}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Streak</Text>
            <Text style={styles.metricValue}>{stats.currentStreak}</Text>
          </View>
        </View>

        {/* Quick wrap-up */}
        <Pressable
          style={({ pressed }) => [styles.wrapCard, pressed && styles.focusPressed]}
          onPress={() => router.push('/day')}
        >
          <FontAwesome name="sun-o" size={14} color={colors.gold} />
          <Text style={styles.wrapText}>
            {today.getHours() < 14 ? 'Roll out for the day' : 'Wrap up the day'}
          </Text>
          <FontAwesome name="chevron-right" size={12} color={colors.textFaint} />
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
  header: {
    paddingTop: spacing.md,
    marginBottom: spacing.xl,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.gold,
    marginBottom: spacing.sm,
  },
  headline: {
    fontFamily: fonts.sansHeavy,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
    color: colors.text,
  },

  progressBlock: {
    alignItems: 'center',
    marginBottom: spacing.xl + 8,
  },
  bigNumber: {
    fontFamily: fonts.displayHeavy,
    fontSize: 64,
    lineHeight: 70,
    letterSpacing: -2,
    color: colors.text,
  },
  bigGoal: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: colors.textFaint,
  },
  subLine: {
    ...typography.caption,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  pacePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.round,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: spacing.md,
  },
  paceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 7,
  },
  paceText: {
    ...typography.badge,
    fontSize: 11,
  },

  focusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 18,
    marginBottom: spacing.xl,
  },
  focusPressed: {
    backgroundColor: colors.surfacePressed,
  },
  focusLeft: {
    flex: 1,
  },
  focusEyebrow: {
    ...typography.badge,
    color: colors.textMuted,
    marginBottom: 4,
  },
  focusHeadline: {
    ...typography.cardTitle,
    fontSize: 17,
    color: colors.text,
  },
  focusButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  focusButtonText: {
    ...typography.button,
    color: colors.onPrimary,
    fontSize: 14,
  },

  sectionLabel: {
    ...typography.sectionTitle,
    color: colors.text,
    marginBottom: spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.xl,
  },
  metric: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  metricLabel: {
    ...typography.badge,
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 6,
  },
  metricValue: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
  },

  wrapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 12,
    marginBottom: spacing.xxl,
  },
  wrapText: {
    ...typography.cardTitle,
    color: colors.text,
    flex: 1,
  },
});
