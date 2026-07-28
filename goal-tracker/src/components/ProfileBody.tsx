import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Commission, Deal, Membership, PersonalBestOverrides } from '@/src/types';
import { computeProfileStats, recentMonthlySales } from '@/src/lib/profileStats';
import { BADGES, BADGE_GROUP_LABELS, BadgeContext, BadgeDef } from '@/src/lib/badges';
import { BadgePatch } from './BadgePatch';
import { Section } from './Section';
import { parseISODate, shortDateLabel } from '@/src/lib/dates';
import { fonts, colors, elevation, layout, radius, spacing, typography } from '@/src/theme';

function money(n: number): string {
  if (!n) return '$0';
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

/** Whichever is larger: what they logged here, or what they told us they did before. */
function best(computed: number, entered?: number): number {
  return Math.max(computed, entered ?? 0);
}

function ScoreTile({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <View style={styles.scoreTile}>
      <Text style={styles.scoreValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <View style={styles.scoreRule} />
      <Text style={styles.scoreLabel}>{label}</Text>
      {sub ? <Text style={styles.scoreSub}>{sub}</Text> : null}
    </View>
  );
}

function TrendRow({
  label,
  now,
  before,
  format,
}: {
  label: string;
  now: number;
  before: number;
  format: (n: number) => string;
}) {
  const delta = now - before;
  const flat = Math.abs(delta) < 0.05;
  const color = flat ? colors.textMuted : delta > 0 ? colors.ahead : colors.behind;
  const icon = flat ? 'minus' : delta > 0 ? 'arrow-up' : 'arrow-down';
  return (
    <View style={styles.trendRow}>
      <Text style={styles.trendLabel}>{label}</Text>
      <Text style={styles.trendNow}>{format(now)}</Text>
      <View style={styles.trendDelta}>
        <FontAwesome name={icon} size={10} color={color} />
        <Text style={[styles.trendDeltaText, { color }]}>
          {flat ? 'flat' : `${format(Math.abs(delta))} vs. prior`}
        </Text>
      </View>
    </View>
  );
}

/**
 * The stats half of a profile — career line, personal bests, trends and patches. Shared by
 * the Profile tab (your own) and the Team tab (a teammate's), so both always show the same
 * numbers computed the same way; only the editing controls differ.
 */
export function ProfileBody({
  deals,
  commissions,
  knocksByDate,
  longestStreak,
  gradedPitches,
  bestPitchGrade,
  overrides,
  showMoney = true,
}: {
  deals: Deal[];
  commissions: Commission[];
  knocksByDate: Record<string, number>;
  longestStreak: number;
  gradedPitches: number;
  bestPitchGrade: number;
  overrides?: PersonalBestOverrides;
  /** Commission is private — hidden when viewing someone else's profile. */
  showMoney?: boolean;
}) {
  const ps = useMemo(
    () => computeProfileStats(deals, commissions, knocksByDate),
    [deals, commissions, knocksByDate]
  );
  const monthly = useMemo(() => recentMonthlySales(deals, 6), [deals]);
  const maxMonth = Math.max(1, ...monthly.map((m) => m.count));

  const totalSales = best(ps.totalSales, overrides?.careerSales);
  const totalKnocks = best(ps.totalKnocks, overrides?.careerKnocks);
  const closeRate = totalKnocks > 0 ? (totalSales / totalKnocks) * 100 : 0;
  const bestDay = best(ps.bestDay?.count ?? 0, overrides?.bestDay);
  const bestWeek = best(ps.bestWeek?.count ?? 0, overrides?.bestWeek);
  const bestMonth = best(ps.bestMonth?.count ?? 0, overrides?.bestMonth);
  const streak = best(longestStreak, overrides?.longestStreak);
  const biggestPaycheck = best(ps.biggestPaycheck, overrides?.biggestPaycheck);
  const biggestDay = best(ps.biggestCommissionDay?.amount ?? 0, overrides?.biggestCommissionDay);

  const badgeContext: BadgeContext = {
    totalKnocks,
    totalSales,
    bestDaySales: bestDay,
    bestWeekSales: bestWeek,
    longestStreak: streak,
    closeRate,
    gradedPitches,
    bestPitchGrade,
  };

  const byGroup = useMemo(() => {
    const groups: Record<string, BadgeDef[]> = {};
    for (const b of BADGES) (groups[b.group] ??= []).push(b);
    return groups;
  }, []);
  const earnedCount = BADGES.filter((b) => b.progress(badgeContext) >= 1).length;

  return (
    <>
      <Section title="Career">
        <View style={styles.scoreGrid}>
          <ScoreTile value={String(totalSales)} label="Total sales" />
          <ScoreTile value={totalKnocks.toLocaleString('en-US')} label="Doors knocked" />
          <ScoreTile value={`${closeRate.toFixed(1)}%`} label="Close rate" sub="Sales ÷ doors" />
          {showMoney && <ScoreTile value={money(ps.totalEarned)} label="Total earned" />}
        </View>
      </Section>

      <Section title="Personal Bests">
        <View style={styles.scoreGrid}>
          <ScoreTile
            value={String(bestDay)}
            label="Best day"
            sub={ps.bestDay ? shortDateLabel(parseISODate(ps.bestDay.date)) : 'Not yet'}
          />
          <ScoreTile
            value={String(bestWeek)}
            label="Best week"
            sub={ps.bestWeek ? `Week of ${shortDateLabel(parseISODate(ps.bestWeek.weekStart))}` : 'Not yet'}
          />
          <ScoreTile value={String(bestMonth)} label="Best month" sub={ps.bestMonth?.label ?? 'Not yet'} />
          <ScoreTile value={String(streak)} label="Longest streak" sub="Days in a row" />
          {showMoney && (
            <>
              <ScoreTile value={money(biggestPaycheck)} label="Biggest paycheck" sub="One deal" />
              <ScoreTile
                value={money(biggestDay)}
                label="Biggest day"
                sub={
                  ps.biggestCommissionDay
                    ? shortDateLabel(parseISODate(ps.biggestCommissionDay.date))
                    : 'Not yet'
                }
              />
            </>
          )}
        </View>

        {showMoney && (
          <View style={styles.projectionCard}>
            <Text style={styles.projectionEyebrow}>Projected this quarter</Text>
            <Text style={styles.projectionValue}>{money(ps.quarterlyProjectedEarnings)}</Text>
            <Text style={styles.projectionSub}>
              {money(ps.quarterEarnedSoFar)} banked so far, at your current pace.
            </Text>
          </View>
        )}
      </Section>

      <Section title="Trends">
        <View style={styles.card}>
          <TrendRow label="Sales, last 7 days" now={ps.last7} before={ps.prev7} format={(n) => String(Math.round(n))} />
          <View style={styles.hairline} />
          <TrendRow label="Sales, last 30 days" now={ps.last30} before={ps.prev30} format={(n) => String(Math.round(n))} />
          <View style={styles.hairline} />
          <TrendRow
            label="Close rate, last 30 days"
            now={ps.closeRateLast30}
            before={ps.closeRatePrev30}
            format={(n) => `${n.toFixed(1)}%`}
          />
          <View style={styles.hairline} />
          <View style={styles.trendRow}>
            <Text style={styles.trendLabel}>Favorite knocking day</Text>
            <Text style={styles.trendNow}>{ps.favoriteKnockingDay?.day ?? '—'}</Text>
            <View style={styles.trendDelta}>
              <Text style={styles.trendDeltaText}>
                {ps.favoriteKnockingDay
                  ? `${ps.favoriteKnockingDay.knocks.toLocaleString('en-US')} doors`
                  : 'No knocks logged'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.sparkCard]}>
          <Text style={styles.sparkTitle}>Last 6 months</Text>
          <View style={styles.sparkRow}>
            {monthly.map((m) => (
              <View key={m.label} style={styles.sparkCol}>
                <Text style={styles.sparkCount}>{m.count}</Text>
                <View style={styles.sparkTrack}>
                  <View style={[styles.sparkFill, { height: `${(m.count / maxMonth) * 100}%` }]} />
                </View>
                <Text style={styles.sparkLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </Section>

      <Section title="Patches" right={<Text style={styles.badgeCount}>{earnedCount}/{BADGES.length}</Text>}>
        {(Object.keys(byGroup) as BadgeDef['group'][]).map((group) => (
          <View key={group} style={styles.badgeGroup}>
            <Text style={styles.badgeGroupLabel}>{BADGE_GROUP_LABELS[group]}</Text>
            <View style={styles.badgeRow}>
              {byGroup[group].map((b) => (
                <BadgePatch key={b.id} badge={b} progress={b.progress(badgeContext)} />
              ))}
            </View>
          </View>
        ))}
      </Section>
    </>
  );
}

/** The photo + name + bio header, shared by your profile and a teammate's. */
export function ProfileHeader({
  member,
  roleLabel,
  avatar,
  children,
}: {
  member?: Membership;
  roleLabel: string;
  avatar: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.identityRow}>
        {avatar}
        <View style={styles.identityText}>
          <Text style={styles.roleTag}>{roleLabel}</Text>
          <Text style={styles.name}>{member?.displayName ?? 'Rep'}</Text>
          {children}
        </View>
      </View>
    </View>
  );
}

export const profileStyles = StyleSheet.create({
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.surfaceElevated,
  },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
});

const styles = StyleSheet.create({
  card: {
    ...elevation.card,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: layout.cardPadding,
    marginBottom: spacing.lg,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identityText: { flex: 1, gap: 2 },
  roleTag: { ...typography.eyebrow, color: colors.gold },
  name: { ...typography.pageTitle, fontSize: 26, color: colors.text },

  scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  scoreTile: {
    width: '48.5%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  scoreValue: { ...typography.metric, color: colors.text },
  scoreRule: { height: 1, backgroundColor: colors.borderSubtle, marginVertical: spacing.sm },
  scoreLabel: { ...typography.label, color: colors.textMuted },
  scoreSub: { ...typography.caption, fontSize: 11, color: colors.textFaint, marginTop: 2 },

  projectionCard: {
    backgroundColor: colors.brandSurface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xs,
  },
  projectionEyebrow: { ...typography.eyebrow, color: colors.gold },
  projectionValue: { ...typography.scoreValue, fontSize: 42, color: colors.onPrimary, marginTop: spacing.xs },
  projectionSub: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },

  hairline: { height: 1, backgroundColor: colors.borderSubtle },
  trendRow: { paddingVertical: spacing.sm + 2, gap: 2 },
  trendLabel: { ...typography.eyebrow, fontSize: 10, color: colors.textMuted },
  trendNow: { ...typography.scoreValue, fontSize: 26, color: colors.text },
  trendDelta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  trendDeltaText: { ...typography.caption, fontSize: 12, color: colors.textFaint },

  sparkCard: { paddingBottom: spacing.md },
  sparkTitle: { ...typography.eyebrow, fontSize: 10, color: colors.textMuted, marginBottom: spacing.md },
  sparkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130 },
  sparkCol: { flex: 1, alignItems: 'center', gap: spacing.xs },
  sparkCount: { ...typography.caption, fontSize: 11, color: colors.textMuted, fontFamily: fonts.sansBold },
  sparkTrack: {
    width: 20,
    height: 80,
    backgroundColor: colors.track,
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  sparkFill: { width: '100%', backgroundColor: colors.accent, borderRadius: radius.sm },
  sparkLabel: { ...typography.eyebrow, fontSize: 9, color: colors.textFaint },

  badgeCount: { ...typography.eyebrow, color: colors.gold },
  badgeGroup: { marginBottom: spacing.md },
  badgeGroupLabel: { ...typography.eyebrow, fontSize: 10, color: colors.textMuted, marginBottom: spacing.md },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
