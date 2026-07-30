
import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { useTeamStore } from '@/src/store/teamStore';
import { useDealsStore } from '@/src/store/dealsStore';
import { useCommissionStore } from '@/src/store/commissionStore';
import { buildLeaderboard } from '@/src/lib/stats';
import { CircularProgress } from '@/src/components/CircularProgress';
import { Section } from '@/src/components/Section';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SegmentedToggle } from '@/src/components/Button';
import { Screen } from '@/src/components/Screen';
import { colors, radius, spacing, typography } from '@/src/theme';
import { LeaderboardEntry } from '@/src/types';

function formatMoney(amount: number): string {
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

type BoardRange = 'today' | 'week' | 'allTime';

function LeaderboardRow({
  entry,
  index,
  myUid,
  metric,
  photoUrl,
}: {
  entry: LeaderboardEntry;
  index: number;
  myUid?: string;
  metric: BoardRange;
  photoUrl?: string;
}) {
  const router = useRouter();
  const value =
    metric === 'today'
      ? entry.todaySales
      : metric === 'week'
        ? entry.weekSales
        : entry.totalSales;
  const isFirst = index === 0 && value > 0;
  const isSecond = index === 1 && value > 0;
  const isThird = index === 2 && value > 0;
  const isPodium = isFirst || isSecond || isThird;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${entry.displayName}'s profile, rank ${index + 1}, ${value} sales`}
      style={({ pressed }) => [
        styles.leaderRow,
        isFirst && styles.leaderRowFirst,
        isSecond && styles.leaderRowSecond,
        isThird && styles.leaderRowThird,
        pressed && styles.leaderRowPressed,
      ]}
      onPress={() => router.push(`/member/${entry.uid}`)}
    >
      <View
        style={[
          styles.rankBadge,
          isFirst && styles.rankBadgeFirst,
          isSecond && styles.rankBadgeSecond,
          isThird && styles.rankBadgeThird,
        ]}
      >
        <Text style={[styles.rankBadgeText, isFirst && styles.rankBadgeTextFirst]}>
          {index + 1}
        </Text>
      </View>

      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={[styles.leaderAvatar, isPodium && styles.podiumAvatar]}
        />
      ) : (
        <View
          style={[
            styles.leaderAvatar,
            styles.leaderAvatarEmpty,
            isPodium && styles.podiumAvatar,
          ]}
        >
          <FontAwesome name="user" size={13} color={colors.textFaint} />
        </View>
      )}

      <View style={styles.leaderIdentity}>
        <Text
          style={[styles.leaderName, isPodium && styles.podiumName]}
          numberOfLines={1}
        >
          {entry.displayName}
          {entry.uid === myUid ? ' (You)' : ''}
        </Text>

        {entry.role !== 'rep' && (
          <Text style={styles.leaderRole} numberOfLines={1}>
            {entry.role === 'manager' ? 'Manager' : 'Team Lead'}
          </Text>
        )}
      </View>

      <View style={styles.leaderResult}>
        <Text style={[styles.leaderCount, isFirst && styles.leaderCountFirst]}>
          {value}
        </Text>
        <Text style={styles.salesLabel}>Sales</Text>
      </View>

      <FontAwesome name="chevron-right" size={11} color={colors.textFaint} />
    </Pressable>
  );
}

export default function TeamScreen() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const role = useAuthStore((s) => s.profile?.role);
  const isManager = role === 'manager';
  const team = useTeamStore((s) => s.team);
  const members = useTeamStore((s) => s.members);
  const deals = useDealsStore((s) => s.deals);
  const commissions = useCommissionStore((s) => s.byDealId);
  const [range, setRange] = useState<BoardRange>('today');

  const leaderboard = useMemo(() => buildLeaderboard(deals, members), [deals, members]);

  const rankedLeaderboard = useMemo(() => {
    const key =
      range === 'today'
        ? 'todaySales'
        : range === 'week'
          ? 'weekSales'
          : 'totalSales';

    return [...leaderboard].sort(
      (a, b) => b[key] - a[key] || b.totalSales - a.totalSales,
    );
  }, [leaderboard, range]);

  const teamTotalSales = useMemo(
    () => deals.filter((d) => !d.deletedAt).length,
    [deals],
  );
  const teamProgress = team && team.salesGoal > 0 ? teamTotalSales / team.salesGoal : 0;

  const commissionByRep = useMemo(() => {
    const totals: Record<string, { paid: number; pending: number }> = {};

    for (const deal of deals) {
      const amount = commissions[deal.id]?.amount ?? 0;
      if (!amount) continue;

      const bucket = totals[deal.repUid] ?? { paid: 0, pending: 0 };

      if (deal.stage === 'paid') bucket.paid += amount;
      else bucket.pending += amount;

      totals[deal.repUid] = bucket;
    }

    return totals;
  }, [deals, commissions]);

  if (!team) {
    return (
      <Screen scroll={false} testID="team-screen">
        <View style={styles.centerContent}>
          <Text style={styles.body}>Loading your team…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen testID="team-screen">
        <ScreenHeader
          eyebrow="The crew"
          title={team.name}
          subtitle={`${members.length} member${members.length === 1 ? '' : 's'}`}
        />

        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>Team Goal</Text>

          <View style={styles.ringWrap}>
            <CircularProgress
              progress={teamProgress}
              size={190}
              strokeWidth={16}
              color={colors.accent}
            >
              <Text style={styles.ringPercent}>
                {Math.round(teamProgress * 100)}%
              </Text>
              <Text style={styles.ringFraction}>
                {teamTotalSales} / {team.salesGoal} Sales
              </Text>
            </CircularProgress>
          </View>
        </View>

        <Section
          title="Leaderboard"
          right={
            <SegmentedToggle
              options={[
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'Week' },
                { key: 'allTime', label: 'All time' },
              ]}
              value={range}
              onChange={setRange}
            />
          }
        >
          <Text style={styles.rangeLabel}>
            Tap anyone to see their profile.
          </Text>

          <View style={styles.leaderboardCard}>
            {rankedLeaderboard.map((entry, i) => (
              <LeaderboardRow
                key={entry.uid}
                entry={entry}
                index={i}
                myUid={uid}
                metric={range}
                photoUrl={members.find((m) => m.uid === entry.uid)?.photoUrl}
              />
            ))}
          </View>
        </Section>

        {isManager && (
          <Section
            title="Team Commissions"
            right={
              <FontAwesome name="lock" size={12} color={colors.textFaint} />
            }
          >
            <Text style={styles.rangeLabel}>
              Only visible to you as manager.
            </Text>

            <View style={styles.commissionCard}>
              {members.map((member) => {
                const totals = commissionByRep[member.uid] ?? {
                  paid: 0,
                  pending: 0,
                };

                return (
                  <View key={member.uid} style={styles.commissionRow}>
                    <Text style={styles.commissionName} numberOfLines={1}>
                      {member.displayName}
                    </Text>

                    <View style={styles.commissionAmounts}>
                      <Text style={styles.commissionTotal}>
                        {formatMoney(totals.paid + totals.pending)}
                      </Text>
                      <Text style={styles.commissionSub} numberOfLines={1}>
                        {formatMoney(totals.paid)} Paid ·{' '}
                        {formatMoney(totals.pending)} Pending
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Section>
        )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
  progressCard: {
    alignItems: 'center',
    backgroundColor: colors.brandSurface,
    borderRadius: radius.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    marginBottom: spacing.xl,
  },
  progressLabel: {
    ...typography.eyebrow,
    color: colors.textMuted,
    alignSelf: 'flex-start',
    marginLeft: spacing.md,
    marginBottom: spacing.sm,
  },
  ringWrap: {
    alignItems: 'center',
  },
  ringPercent: {
    ...typography.scoreValue,
    color: colors.text,
  },
  ringFraction: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  rangeLabel: {
    ...typography.caption,
    color: colors.textFaint,
    marginBottom: spacing.sm,
  },
  leaderboardCard: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  leaderRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  leaderRowFirst: {
    minHeight: 76,
    backgroundColor: colors.surfaceRaised,
  },
  leaderRowSecond: {
    minHeight: 70,
    backgroundColor: colors.surfaceElevated,
  },
  leaderRowThird: {
    minHeight: 68,
    backgroundColor: colors.brandSurface,
  },
  leaderRowPressed: {
    backgroundColor: colors.surfacePressed,
  },
  leaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceElevated,
  },
  podiumAvatar: {
    width: 40,
    height: 40,
  },
  leaderAvatarEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeFirst: {
    width: 34,
    height: 34,
    backgroundColor: colors.gold,
  },
  rankBadgeSecond: {
    width: 32,
    height: 32,
    backgroundColor: colors.surfacePressed,
  },
  rankBadgeThird: {
    width: 30,
    height: 30,
    backgroundColor: colors.surfaceRaised,
  },
  rankBadgeText: {
    ...typography.badge,
    color: colors.textMuted,
  },
  rankBadgeTextFirst: {
    color: colors.onPrimary,
  },
  leaderIdentity: {
    flex: 1,
    minWidth: 0,
  },
  leaderName: {
    ...typography.body,
    color: colors.text,
  },
  podiumName: {
    ...typography.cardTitle,
    color: colors.text,
  },
  leaderRole: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  leaderResult: {
    minWidth: 42,
    alignItems: 'flex-end',
  },
  leaderCount: {
    ...typography.scoreValue,
    fontSize: 22,
    lineHeight: 25,
    color: colors.text,
  },
  leaderCountFirst: {
    fontSize: 28,
    lineHeight: 31,
  },
  salesLabel: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.textFaint,
  },
  commissionCard: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  commissionRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  commissionName: {
    ...typography.body,
    flex: 1,
    color: colors.text,
  },
  commissionAmounts: {
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  commissionTotal: {
    ...typography.scoreValue,
    fontSize: 20,
    lineHeight: 23,
    color: colors.text,
  },
  commissionSub: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: spacing.xs,
  },
});
