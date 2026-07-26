import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/authStore';
import { useTeamStore } from '@/src/store/teamStore';
import { useDealsStore } from '@/src/store/dealsStore';
import { useCommissionStore } from '@/src/store/commissionStore';
import { buildLeaderboard } from '@/src/lib/stats';
import { CircularProgress } from '@/src/components/CircularProgress';
import { Section } from '@/src/components/Section';
import { colors, spacing, typography } from '@/src/theme';

function formatMoney(amount: number): string {
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export default function TeamScreen() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const isManager = useAuthStore((s) => s.profile?.role === 'manager');
  const team = useTeamStore((s) => s.team);
  const members = useTeamStore((s) => s.members);
  const deals = useDealsStore((s) => s.deals);
  const commissions = useCommissionStore((s) => s.byDealId);

  const leaderboard = useMemo(() => buildLeaderboard(deals, members), [deals, members]);
  const teamTotalSales = useMemo(() => deals.filter((d) => !d.deletedAt).length, [deals]);
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
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centerContent}>
          <Text style={styles.body}>Loading your team…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>{team.name}</Text>
        <Text style={styles.subheading}>{members.length} member{members.length === 1 ? '' : 's'}</Text>

        <View style={styles.ringWrap}>
          <CircularProgress progress={teamProgress} size={190} strokeWidth={16} color={colors.accent}>
            <Text style={styles.ringPercent}>{Math.round(teamProgress * 100)}%</Text>
            <Text style={styles.ringFraction}>
              {teamTotalSales} / {team.salesGoal} sales
            </Text>
          </CircularProgress>
        </View>

        <Section title="Leaderboard">
          {leaderboard.map((entry, i) => (
            <View key={entry.uid} style={styles.leaderRow}>
              <Text style={styles.rank}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.leaderName}>
                  {entry.displayName}
                  {entry.uid === uid ? ' (you)' : ''}
                  {entry.role === 'manager' ? '  ·  manager' : ''}
                </Text>
                {entry.todaySales > 0 && (
                  <Text style={styles.leaderSub}>{entry.todaySales} today</Text>
                )}
              </View>
              <Text style={styles.leaderCount}>{entry.totalSales}</Text>
            </View>
          ))}
        </Section>

        {isManager && (
          <Section title="Team commissions" right={<FontAwesome name="lock" size={12} color={colors.textFaint} />}>
            <Text style={styles.rangeLabel}>Only visible to you as manager.</Text>
            {members.map((member) => {
              const totals = commissionByRep[member.uid] ?? { paid: 0, pending: 0 };
              return (
                <View key={member.uid} style={styles.commissionRow}>
                  <Text style={styles.leaderName}>{member.displayName}</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.commissionTotal}>{formatMoney(totals.paid + totals.pending)}</Text>
                    <Text style={styles.commissionSub}>
                      {formatMoney(totals.paid)} paid · {formatMoney(totals.pending)} pending
                    </Text>
                  </View>
                </View>
              );
            })}
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
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
  },
  subheading: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  ringWrap: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  ringPercent: {
    ...typography.hero,
    fontSize: 32,
    color: colors.text,
  },
  ringFraction: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  rangeLabel: {
    ...typography.caption,
    color: colors.textFaint,
    marginBottom: spacing.sm,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rank: {
    width: 24,
    textAlign: 'center',
    color: colors.textFaint,
    fontWeight: '700',
  },
  leaderName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  leaderSub: {
    ...typography.caption,
    color: colors.accent,
  },
  leaderCount: {
    ...typography.statValue,
    fontSize: 18,
    color: colors.text,
  },
  commissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  commissionTotal: {
    ...typography.subtitle,
    fontSize: 15,
    color: colors.gold,
  },
  commissionSub: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
