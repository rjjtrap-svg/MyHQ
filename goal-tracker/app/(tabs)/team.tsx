import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { useTeamStore } from '@/src/store/teamStore';
import { useDealsStore } from '@/src/store/dealsStore';
import { useCommissionStore } from '@/src/store/commissionStore';
import { useOverrideStore } from '@/src/store/overrideStore';
import { buildLeaderboard } from '@/src/lib/stats';
import { parseISODate, shortDateLabel } from '@/src/lib/dates';
import { CircularProgress } from '@/src/components/CircularProgress';
import { Section } from '@/src/components/Section';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SegmentedToggle } from '@/src/components/Button';
import { colors, radius, spacing, typography } from '@/src/theme';
import { Deal, LeaderboardEntry } from '@/src/types';

function formatMoney(amount: number): string {
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

type BoardRange = 'today' | 'week';

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
  const value = metric === 'today' ? entry.todaySales : entry.weekSales;
  const isTop = index === 0 && value > 0;
  return (
    <Pressable
      style={[styles.leaderRow, isTop && styles.leaderRowTop]}
      onPress={() => router.push(`/member/${entry.uid}`)}
    >
      <View style={[styles.rankBadge, isTop && styles.rankBadgeTop]}>
        <Text style={[styles.rankBadgeText, isTop && styles.rankBadgeTextTop]}>{index + 1}</Text>
      </View>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.leaderAvatar} />
      ) : (
        <View style={[styles.leaderAvatar, styles.leaderAvatarEmpty]}>
          <FontAwesome name="user" size={12} color={colors.textFaint} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.leaderName}>
          {entry.displayName}
          {entry.uid === myUid ? ' (You)' : ''}
        </Text>
        {entry.role !== 'rep' && <Text style={styles.leaderRole}>{entry.role === 'manager' ? 'Manager' : 'Team Lead'}</Text>}
      </View>
      <Text style={[styles.leaderCount, isTop && styles.leaderCountTop]}>{value}</Text>
      <FontAwesome name="chevron-right" size={11} color={colors.textFaint} />
    </Pressable>
  );
}

function OverridesSection({ overseenRepUids }: { overseenRepUids: string[] }) {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const team = useTeamStore((s) => s.team);
  const members = useTeamStore((s) => s.members);
  const deals = useDealsStore((s) => s.deals);
  const overrides = useOverrideStore((s) => s.byDealId);
  const setOverride = useOverrideStore((s) => s.setOverride);
  const [expandedUid, setExpandedUid] = useState<string | null>(null);

  const overseenMembers = members.filter((m) => overseenRepUids.includes(m.uid));

  if (overseenMembers.length === 0) return null;

  return (
    <Section title="Rep Overrides" right={<FontAwesome name="lock" size={12} color={colors.textFaint} />}>
      <Text style={styles.rangeLabel}>Only visible to you — never shown to the rep.</Text>
      {overseenMembers.map((member) => {
        const isExpanded = expandedUid === member.uid;
        const repDeals = deals.filter((d) => d.repUid === member.uid && !d.deletedAt);
        return (
          <View key={member.uid} style={styles.overrideMemberBlock}>
            <Pressable style={styles.overrideMemberHeader} onPress={() => setExpandedUid(isExpanded ? null : member.uid)}>
              <Text style={styles.leaderName}>{member.displayName}</Text>
              <FontAwesome name={isExpanded ? 'chevron-up' : 'chevron-down'} size={12} color={colors.textFaint} />
            </Pressable>
            {isExpanded &&
              (repDeals.length === 0 ? (
                <Text style={styles.rangeLabel}>No deals yet.</Text>
              ) : (
                repDeals.map((deal) => (
                  <OverrideRow
                    key={deal.id}
                    deal={deal}
                    amount={overrides[deal.id]?.amount}
                    onSave={(amount) => {
                      if (!team || !uid) return;
                      setOverride(team.id, deal.id, member.uid, amount, uid);
                    }}
                  />
                ))
              ))}
          </View>
        );
      })}
    </Section>
  );
}

function OverrideRow({ deal, amount, onSave }: { deal: Deal; amount: number | undefined; onSave: (amount: number) => void }) {
  const [text, setText] = useState(amount !== undefined ? String(amount) : '');

  function save() {
    const parsed = Number(text.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(parsed)) return;
    onSave(parsed);
  }

  return (
    <View style={styles.overrideDealRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.overrideDealName}>{deal.customerName || 'Unnamed deal'}</Text>
        <Text style={styles.rangeLabel}>{shortDateLabel(parseISODate(deal.date))}</Text>
      </View>
      <View style={styles.commissionInputWrap}>
        <Text style={styles.commissionPrefix}>$</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          onBlur={save}
          placeholder="0"
          placeholderTextColor={colors.textFaint}
          keyboardType="decimal-pad"
          style={styles.commissionInput}
        />
      </View>
    </View>
  );
}

export default function TeamScreen() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const role = useAuthStore((s) => s.profile?.role);
  const isManager = role === 'manager';
  const isTeamLead = role === 'team_lead';
  const team = useTeamStore((s) => s.team);
  const members = useTeamStore((s) => s.members);
  const deals = useDealsStore((s) => s.deals);
  const commissions = useCommissionStore((s) => s.byDealId);
  const [range, setRange] = useState<BoardRange>('today');

  const leaderboard = useMemo(() => buildLeaderboard(deals, members), [deals, members]);
  const rankedLeaderboard = useMemo(() => {
    const key = range === 'today' ? 'todaySales' : 'weekSales';
    return [...leaderboard].sort((a, b) => b[key] - a[key] || b.totalSales - a.totalSales);
  }, [leaderboard, range]);

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

  const overseenRepUids = useMemo(() => {
    if (isManager) return members.filter((m) => m.role === 'rep').map((m) => m.uid);
    if (isTeamLead) return members.filter((m) => m.role === 'rep' && m.overseerUid === uid).map((m) => m.uid);
    return [];
  }, [members, isManager, isTeamLead, uid]);

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
        <ScreenHeader
          eyebrow="The crew"
          title={team.name}
          subtitle={`${members.length} member${members.length === 1 ? '' : 's'}`}
        />

        <View style={styles.ringWrap}>
          <CircularProgress progress={teamProgress} size={190} strokeWidth={16} color={colors.accent}>
            <Text style={styles.ringPercent}>{Math.round(teamProgress * 100)}%</Text>
            <Text style={styles.ringFraction}>
              {teamTotalSales} / {team.salesGoal} Sales
            </Text>
          </CircularProgress>
        </View>

        <Section
          title="Leaderboard"
          right={
            <SegmentedToggle
              options={[
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'Week' },
              ]}
              value={range}
              onChange={setRange}
            />
          }
        >
          <Text style={styles.rangeLabel}>Tap anyone to see their profile.</Text>
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
        </Section>

        {isManager && (
          <Section title="Team Commissions" right={<FontAwesome name="lock" size={12} color={colors.textFaint} />}>
            <Text style={styles.rangeLabel}>Only visible to you as manager.</Text>
            {members.map((member) => {
              const totals = commissionByRep[member.uid] ?? { paid: 0, pending: 0 };
              return (
                <View key={member.uid} style={styles.commissionRow}>
                  <Text style={styles.leaderName}>{member.displayName}</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.commissionTotal}>{formatMoney(totals.paid + totals.pending)}</Text>
                    <Text style={styles.commissionSub}>
                      {formatMoney(totals.paid)} Paid · {formatMoney(totals.pending)} Pending
                    </Text>
                  </View>
                </View>
              );
            })}
          </Section>
        )}

        {(isManager || isTeamLead) && <OverridesSection overseenRepUids={overseenRepUids} />}
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
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leaderRowTop: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderBottomWidth: 0,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  leaderAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leaderAvatarEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeTop: {
    backgroundColor: colors.gold,
  },
  rankBadgeText: {
    color: colors.textFaint,
    fontWeight: '800',
    fontSize: 13,
  },
  rankBadgeTextTop: {
    color: colors.onPrimary,
  },
  leaderName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  leaderRole: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  leaderCount: {
    ...typography.scoreValue,
    fontSize: 20,
    color: colors.text,
  },
  leaderCountTop: {
    color: colors.gold,
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
  overrideMemberBlock: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  overrideMemberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  overrideDealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  overrideDealName: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  commissionInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  commissionPrefix: {
    color: colors.textFaint,
    fontSize: 14,
  },
  commissionInput: {
    color: colors.text,
    fontSize: 14,
    paddingVertical: 6,
    paddingLeft: 2,
    minWidth: 60,
  },
});
