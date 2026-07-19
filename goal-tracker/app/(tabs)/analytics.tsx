import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoalStats } from '@/src/hooks/useGoalStats';
import { dailyPoints, monthlyPoints, weeklyPoints } from '@/src/lib/stats';
import { parseISODate, shortDateLabel, weekdayLabel } from '@/src/lib/dates';
import { BarChart } from '@/src/components/BarChart';
import { Section } from '@/src/components/Section';
import { StatTile } from '@/src/components/StatTile';
import { colors, spacing, typography } from '@/src/theme';

export default function AnalyticsScreen() {
  const { deals, stats } = useGoalStats();

  const daily = useMemo(() => dailyPoints(deals, 14), [deals]);
  const weekly = useMemo(() => weeklyPoints(deals, 8), [deals]);
  const monthly = useMemo(() => monthlyPoints(deals, 6), [deals]);

  const dailyChart = daily.map((p) => ({ label: weekdayLabel(parseISODate(p.date))[0], value: p.count }));
  const weeklyChart = weekly.map((p) => ({ label: shortDateLabel(parseISODate(p.weekStart)), value: p.count }));
  const monthlyChart = monthly.map((p) => ({ label: p.label, value: p.count }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Analytics</Text>

        <Section title="Daily sales" right={<Text style={styles.rangeLabel}>Last 14 days</Text>}>
          <BarChart data={dailyChart} />
        </Section>

        <Section title="Weekly sales" right={<Text style={styles.rangeLabel}>Last 8 weeks</Text>}>
          <BarChart data={weeklyChart} color={colors.accent} />
        </Section>

        <Section title="Monthly sales" right={<Text style={styles.rangeLabel}>Last 6 months</Text>}>
          <BarChart data={monthlyChart} color={colors.gold} />
        </Section>

        <Section title="Performance">
          <View style={styles.grid}>
            <StatTile label="Running average" value={stats.runningAverage.toFixed(1)} sublabel="sales / day" />
            <StatTile
              label="Best day"
              value={stats.bestDay ? String(stats.bestDay.count) : '—'}
              sublabel={stats.bestDay ? shortDateLabel(parseISODate(stats.bestDay.date)) : undefined}
            />
            <StatTile
              label="Best week"
              value={stats.bestWeek ? String(stats.bestWeek.count) : '—'}
              sublabel={stats.bestWeek ? `wk of ${shortDateLabel(parseISODate(stats.bestWeek.weekStart))}` : undefined}
            />
            <StatTile label="Current streak" value={`${stats.currentStreak}d`} />
            <StatTile label="Longest streak" value={`${stats.longestStreak}d`} />
            <StatTile label="This month" value={String(stats.monthSales)} />
          </View>
        </Section>
      </ScrollView>
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
  heading: {
    ...typography.hero,
    fontSize: 28,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  rangeLabel: {
    ...typography.caption,
    color: colors.textFaint,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
