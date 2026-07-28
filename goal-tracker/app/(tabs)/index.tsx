import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
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
  const { settings, stats } = useGoalStats();
  const pendingCelebration = useUIStore((s) => s.pendingCelebration);
  const clearCelebration = useUIStore((s) => s.clearCelebration);
  const pendingDailyAlert = useUIStore((s) => s.pendingDailyAlert);
  const clearDailyAlert = useUIStore((s) => s.clearDailyAlert);
  const today = new Date();
  const goalComplete = stats.salesRemaining === 0;
  const nextTarget = Math.max(Math.ceil(stats.requiredPerDay), 1);
  const todayRemaining = Math.max(nextTarget - stats.todaySales, 0);
  const momentumCopy = goalComplete
    ? 'Goal complete. Strong finish.'
    : stats.pace === 'ahead'
      ? 'You are pacing ahead. Keep the pressure on.'
      : stats.pace === 'on-pace'
        ? 'Momentum is building. Stay on the number.'
        : `${todayRemaining || 1} more ${todayRemaining === 1 ? 'sale' : 'sales'} to build momentum today.`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow={`${weekdayLabel(today)} · ${shortDateLabel(today)}`}
          title="Performance"
          subtitle={momentumCopy}
        />

        <LinearGradient colors={colors.gradientPerformance} style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroEyebrow}>Current goal</Text>
              <Text style={styles.heroTitle}>{goalComplete ? 'Target secured' : 'Sales progress'}</Text>
            </View>
            <PaceBadge pace={stats.pace} />
          </View>

          <View style={styles.heroBody}>
            <CircularProgress
              progress={stats.percentComplete}
              size={176}
              strokeWidth={13}
              color={goalComplete ? colors.success : colors.primary}
            >
              <Text style={styles.ringPercent}>{Math.round(stats.percentComplete * 100)}%</Text>
              <Text style={styles.ringCaption}>complete</Text>
            </CircularProgress>
            <View style={styles.heroDetails}>
              <Text style={styles.heroValue}>{stats.totalSales}</Text>
              <Text style={styles.heroValueLabel}>of {settings.salesGoal} sales</Text>
              <View style={styles.heroDivider} />
              <Text style={styles.heroSupporting}>
                {goalComplete ? 'You delivered.' : `${stats.salesRemaining} remaining · ${stats.daysRemaining} days left`}
              </Text>
              <StreakFlame streak={stats.currentStreak} />
            </View>
          </View>
        </LinearGradient>

        <Section title="Today">
          <View style={styles.grid}>
            <StatTile label="Sales today" value={String(stats.todaySales)} tone="success" accent={colors.success} />
            <StatTile label="This week" value={String(stats.weekSales)} tone="info" accent={colors.info} />
            <StatTile
              label="Required / day"
              value={round1(Math.max(stats.requiredPerDay, 0))}
              sublabel={`${stats.daysRemaining} days left`}
              tone="warning"
            />
            <StatTile
              label="Pace vs. plan"
              value={`${stats.paceDelta >= 0 ? '+' : ''}${round1(stats.paceDelta)}`}
              sublabel={stats.pace === 'ahead' ? 'Pacing ahead' : stats.pace === 'behind' ? 'Opportunity today' : 'Right on target'}
              accent={stats.pace === 'ahead' ? colors.ahead : stats.pace === 'behind' ? colors.behind : colors.onPace}
            />
          </View>
        </Section>

        <Section title="Goal outlook">
          <View style={styles.outlookCard}>
            <View style={styles.outlookRow}>
              <View style={styles.outlookIcon}><Feather name="target" size={19} color={colors.accent} /></View>
              <View style={styles.outlookCopy}>
                <Text style={styles.outlookLabel}>Next milestone</Text>
                <Text style={styles.outlookValue}>{stats.nextMilestone ?? settings.salesGoal} sales</Text>
              </View>
              <Text style={styles.outlookMeta}>{stats.monthSales} this month</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.grid}>
              <StatTile label="Sales remaining" value={String(stats.salesRemaining)} />
              <StatTile
                label="Projected installs"
                value={String(Math.round(stats.projectedInstalls))}
                sublabel={`${stats.retentionPercent}% retention`}
                tone="premium"
                accent={colors.premium}
              />
              <StatTile label="Total sales" value={String(stats.totalSales)} />
              <StatTile
                label="Projected finish"
                value={stats.projectedFinishDate ? shortDateLabel(parseISODate(stats.projectedFinishDate)) : '—'}
              />
            </View>
          </View>
        </Section>

        <Section title="Next move">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log a new deal"
            onPress={() => router.push('/add-deal')}
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
          >
            <LinearGradient colors={colors.gradientPrimary} style={styles.actionGradient}>
              <View style={styles.actionIcon}><Feather name="plus" size={24} color={colors.text} /></View>
              <View style={styles.actionCopy}>
                <Text style={styles.actionTitle}>Log the next win</Text>
                <Text style={styles.actionSubtitle}>Add a deal and keep your dashboard current.</Text>
              </View>
              <Feather name="arrow-up-right" size={22} color={colors.text} />
            </LinearGradient>
          </Pressable>
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
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  heroCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  heroEyebrow: { ...typography.eyebrow, color: colors.accent },
  heroTitle: { ...typography.sectionTitle, color: colors.text, marginTop: spacing.xs },
  heroBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, gap: spacing.md },
  ringPercent: { ...typography.title, color: colors.text },
  ringCaption: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  heroDetails: { flex: 1, alignItems: 'flex-start' },
  heroValue: { ...typography.performanceValue, color: colors.text },
  heroValueLabel: { ...typography.supporting, color: colors.textMuted },
  heroDivider: { height: 1, width: '100%', backgroundColor: colors.divider, marginVertical: spacing.md },
  heroSupporting: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  outlookCard: { backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  outlookRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  outlookIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryMuted },
  outlookCopy: { flex: 1 },
  outlookLabel: { ...typography.caption, color: colors.textMuted },
  outlookValue: { ...typography.cardTitle, color: colors.text, marginTop: 2 },
  outlookMeta: { ...typography.badge, color: colors.warning },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  actionCard: { borderRadius: radius.lg, overflow: 'hidden' },
  actionCardPressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  actionGradient: { minHeight: 84, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardHighlight },
  actionCopy: { flex: 1 },
  actionTitle: { ...typography.cardTitle, color: colors.text },
  actionSubtitle: { ...typography.caption, color: colors.text, opacity: 0.8, marginTop: 2 },
});
