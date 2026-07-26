import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useGoalStats } from '@/src/hooks/useGoalStats';
import { useAuthStore } from '@/src/store/authStore';
import { useTeamStore } from '@/src/store/teamStore';
import { useDealsStore } from '@/src/store/dealsStore';
import { useCommissionStore } from '@/src/store/commissionStore';
import { useDoorKnocksStore } from '@/src/store/doorKnocksStore';
import { dailyPoints, monthlyPoints, weeklyPoints } from '@/src/lib/stats';
import { parseISODate, shortDateLabel, startOfWeek, todayISO, toISODate, weekdayLabel } from '@/src/lib/dates';
import { cancellationStats, followUpQuestion, pendingFollowUps } from '@/src/lib/dealFollowUps';
import { BarChart } from '@/src/components/BarChart';
import { DealEditor } from '@/src/components/DealEditor';
import { Section } from '@/src/components/Section';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { StatTile } from '@/src/components/StatTile';
import { StagePillRow } from '@/src/components/StagePill';
import { colors, radius, spacing, typography } from '@/src/theme';
import { Deal, DealStage } from '@/src/types';

function formatPercent(numerator: number, denominator: number): string {
  if (denominator <= 0) return '—';
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function formatMoney(amount: number): string {
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function DealRow({ deal }: { deal: Deal }) {
  const teamId = useTeamStore((s) => s.teamId);
  const advanceStage = useDealsStore((s) => s.advanceStage);
  const deleteDeal = useDealsStore((s) => s.deleteDeal);
  const cancelDeal = useDealsStore((s) => s.cancelDeal);
  const reinstateDeal = useDealsStore((s) => s.reinstateDeal);
  const commission = useCommissionStore((s) => s.byDealId[deal.id]);
  const setCommission = useCommissionStore((s) => s.setCommission);

  const [amountText, setAmountText] = useState(commission ? String(commission.amount) : '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  function saveAmount() {
    const parsed = Number(amountText.replace(/[^0-9.]/g, ''));
    if (!teamId || Number.isNaN(parsed)) return;
    setCommission(teamId, deal.id, deal.repUid, parsed);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteDeal(deal.id);
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <View style={styles.dealCard}>
      <View style={styles.dealHeaderRow}>
        {deal.photoUrl ? (
          <Image source={{ uri: deal.photoUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.dealName} numberOfLines={1}>
            {deal.customerName || 'Unnamed deal'}
          </Text>
          <Text style={styles.dealDate}>
            {shortDateLabel(parseISODate(deal.date))}
            {deal.scheduledInstallDate
              ? ` · installs ${shortDateLabel(parseISODate(deal.scheduledInstallDate))}`
              : ''}
          </Text>
        </View>
        <Pressable hitSlop={10} onPress={() => setEditing((v) => !v)} style={styles.rowAction}>
          <FontAwesome name={editing ? 'chevron-up' : 'pencil'} size={16} color={colors.textFaint} />
        </Pressable>
        <Pressable hitSlop={10} onPress={() => setConfirmingDelete(true)}>
          <FontAwesome name="trash-o" size={18} color={colors.textFaint} />
        </Pressable>
      </View>

      {confirmingDelete ? (
        <View style={styles.confirmDeleteRow}>
          <Text style={styles.confirmDeleteText}>Delete this deal?</Text>
          <View style={styles.confirmDeleteButtons}>
            <Pressable
              style={styles.confirmCancelButton}
              onPress={() => setConfirmingDelete(false)}
              disabled={deleting}
            >
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.confirmDeleteButton} onPress={confirmDelete} disabled={deleting}>
              <Text style={styles.confirmDeleteButtonText}>{deleting ? 'Deleting…' : 'Delete'}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <StagePillRow stage={deal.stage} onAdvance={(stage: DealStage) => advanceStage(deal.id, stage)} />

          {deal.stage === 'cancelled' ? (
            <View style={styles.cancelledBlock}>
              {!!deal.cancelReason && <Text style={styles.cancelReason}>{deal.cancelReason}</Text>}
              <Pressable onPress={() => reinstateDeal(deal.id)}>
                <Text style={styles.linkText}>Reinstate this deal</Text>
              </Pressable>
            </View>
          ) : cancelling ? (
            <View style={styles.cancelBlock}>
              <Text style={styles.cancelPrompt}>Why did it cancel? (optional)</Text>
              <TextInput
                style={styles.cancelInput}
                value={cancelReason}
                onChangeText={setCancelReason}
                placeholder="Credit, buyer's remorse, no-show…"
                placeholderTextColor={colors.textFaint}
              />
              <View style={styles.cancelButtons}>
                <Pressable onPress={() => setCancelling(false)} style={styles.confirmCancelButton}>
                  <Text style={styles.confirmCancelText}>Never mind</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    await cancelDeal(deal.id, cancelReason);
                    setCancelling(false);
                  }}
                  style={styles.confirmDeleteButton}
                >
                  <Text style={styles.confirmDeleteButtonText}>Mark cancelled</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable onPress={() => setCancelling(true)} style={styles.cancelLinkRow}>
              <Text style={styles.cancelLink}>Mark cancelled</Text>
            </Pressable>
          )}

          <View style={styles.commissionRow}>
            <Text style={styles.commissionLabel}>Commission</Text>
            <View style={styles.commissionInputWrap}>
              <Text style={styles.commissionPrefix}>$</Text>
              <TextInput
                value={amountText}
                onChangeText={setAmountText}
                onBlur={saveAmount}
                placeholder="0"
                placeholderTextColor={colors.textFaint}
                keyboardType="decimal-pad"
                style={styles.commissionInput}
              />
            </View>
          </View>

          {editing && <DealEditor deal={deal} onDone={() => setEditing(false)} />}
        </>
      )}
    </View>
  );
}

/** The deals waiting on the rep to confirm an install happened or a cheque landed. */
function NeedsAttention({ deals }: { deals: Deal[] }) {
  const advanceStage = useDealsStore((s) => s.advanceStage);
  const dismissPrompt = useDealsStore((s) => s.dismissPrompt);
  const cancelDeal = useDealsStore((s) => s.cancelDeal);

  const followUps = useMemo(() => pendingFollowUps(deals), [deals]);
  if (followUps.length === 0) return null;

  return (
    <Section title={`Needs attention (${followUps.length})`}>
      {followUps.map((f) => (
        <View key={`${f.deal.id}-${f.kind}`} style={styles.followUpCard}>
          <Text style={styles.followUpQuestion}>{followUpQuestion(f)}</Text>
          <Text style={styles.followUpMeta}>
            {f.kind === 'install'
              ? `Install was booked for ${shortDateLabel(parseISODate(f.dueDate))}`
              : `Payday was ${shortDateLabel(parseISODate(f.dueDate))}`}
          </Text>
          <View style={styles.followUpButtons}>
            <Pressable
              onPress={() => dismissPrompt(f.deal.id, f.kind)}
              style={styles.confirmCancelButton}
            >
              <Text style={styles.confirmCancelText}>Not yet</Text>
            </Pressable>
            {f.kind === 'install' && (
              <Pressable onPress={() => cancelDeal(f.deal.id)} style={styles.confirmCancelButton}>
                <Text style={styles.confirmCancelText}>It cancelled</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => advanceStage(f.deal.id, f.kind === 'install' ? 'installed' : 'paid')}
              style={styles.followUpYesButton}
            >
              <Text style={styles.followUpYesText}>Yes</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </Section>
  );
}

function ClosingKpis({ todaySales, weekSales }: { todaySales: number; weekSales: number }) {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const teamId = useTeamStore((s) => s.teamId);
  const doorKnocksByDate = useDoorKnocksStore((s) => s.byDate);
  const setDoorKnocksToday = useDoorKnocksStore((s) => s.setToday);

  const today = todayISO();
  const weekStartIso = toISODate(startOfWeek(new Date()));
  const doorsToday = doorKnocksByDate[today] ?? 0;
  const doorsThisWeek = useMemo(
    () =>
      Object.entries(doorKnocksByDate)
        .filter(([date]) => date >= weekStartIso)
        .reduce((sum, [, count]) => sum + count, 0),
    [doorKnocksByDate, weekStartIso]
  );

  const [text, setText] = useState(String(doorsToday || ''));

  function save() {
    const parsed = Number(text.replace(/[^0-9]/g, ''));
    if (!uid || !teamId || !Number.isFinite(parsed)) return;
    setDoorKnocksToday(teamId, uid, today, parsed);
  }

  return (
    <Section title="Closing % (KPIs)">
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Doors knocked today</Text>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          onBlur={save}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.textFaint}
        />
      </View>
      <View style={styles.grid}>
        <StatTile label="Closing % today" value={formatPercent(todaySales, doorsToday)} sublabel={`${todaySales} / ${doorsToday}`} />
        <StatTile
          label="Closing % this week"
          value={formatPercent(weekSales, doorsThisWeek)}
          sublabel={`${weekSales} / ${doorsThisWeek}`}
        />
      </View>
    </Section>
  );
}

export default function DealsScreen() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const { deals, stats } = useGoalStats();
  const commissions = useCommissionStore((s) => s.byDealId);

  const myCommissionTotals = useMemo(() => {
    let paid = 0;
    let pending = 0;
    for (const deal of deals) {
      if (deal.stage === 'cancelled') continue;
      const amount = commissions[deal.id]?.amount ?? 0;
      if (deal.stage === 'paid') paid += amount;
      else pending += amount;
    }
    return { paid, pending, total: paid + pending };
  }, [deals, commissions]);

  const cancels = useMemo(() => cancellationStats(deals, commissions), [deals, commissions]);
  const livePipeline = useMemo(
    () => deals.filter((d) => !d.deletedAt && d.stage !== 'cancelled'),
    [deals]
  );
  const cancelledDeals = useMemo(
    () => deals.filter((d) => !d.deletedAt && d.stage === 'cancelled'),
    [deals]
  );

  const daily = useMemo(() => dailyPoints(deals, 14), [deals]);
  const weekly = useMemo(() => weeklyPoints(deals, 8), [deals]);
  const monthly = useMemo(() => monthlyPoints(deals, 6), [deals]);

  const dailyChart = daily.map((p) => ({ label: weekdayLabel(parseISODate(p.date))[0], value: p.count }));
  const weeklyChart = weekly.map((p) => ({ label: shortDateLabel(parseISODate(p.weekStart)), value: p.count }));
  const monthlyChart = monthly.map((p) => ({ label: p.label, value: p.count }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="Your book"
          title="My Deals"
          subtitle="Private to you — only you and your manager see commission."
        />

        <View style={styles.grid}>
          <StatTile label="Total commission" value={formatMoney(myCommissionTotals.total)} accent={colors.gold} />
          <StatTile label="Paid out" value={formatMoney(myCommissionTotals.paid)} accent={colors.success} />
        </View>

        <NeedsAttention deals={deals} />

        <ClosingKpis todaySales={stats.todaySales} weekSales={stats.weekSales} />

        <Section title={`Pipeline (${livePipeline.length})`}>
          {livePipeline.length === 0 ? (
            <Text style={styles.emptyText}>No deals logged yet — tap the + button to add one.</Text>
          ) : (
            livePipeline.map((deal) => <DealRow key={deal.id} deal={deal} />)
          )}
        </Section>

        {cancelledDeals.length > 0 && (
          <Section title={`Cancelled (${cancelledDeals.length})`}>
            <View style={styles.grid}>
              <StatTile
                label="Cancel rate"
                value={`${cancels.cancelRate.toFixed(1)}%`}
                sublabel={`${cancels.cancelled} of ${cancels.cancelled + livePipeline.length}`}
                accent={colors.danger}
              />
              <StatTile label="Commission lost" value={formatMoney(cancels.lost)} accent={colors.danger} />
            </View>
            {cancelledDeals.map((deal) => (
              <DealRow key={deal.id} deal={deal} />
            ))}
          </Section>
        )}

        <Section title="Daily Sales" right={<Text style={styles.rangeLabel}>Last 14 Days</Text>}>
          <BarChart data={dailyChart} />
        </Section>

        <Section title="Weekly Sales" right={<Text style={styles.rangeLabel}>Last 8 Weeks</Text>}>
          <BarChart data={weeklyChart} color={colors.accent} />
        </Section>

        <Section title="Monthly Sales" right={<Text style={styles.rangeLabel}>Last 6 Months</Text>}>
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
  },
  subheading: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: spacing.xs,
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
  emptyText: {
    ...typography.body,
    color: colors.textFaint,
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: 15,
  },
  dealCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  dealHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
  },
  thumbPlaceholder: {
    backgroundColor: colors.surfaceElevated,
  },
  dealName: {
    ...typography.subtitle,
    fontSize: 15,
    color: colors.text,
  },
  dealDate: {
    ...typography.caption,
    color: colors.textFaint,
  },
  commissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commissionLabel: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.textMuted,
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
  confirmDeleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  confirmDeleteText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  confirmDeleteButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  confirmCancelButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmCancelText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  confirmDeleteButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerBorder,
  },
  confirmDeleteButtonText: {
    color: colors.dangerText,
    fontWeight: '700',
    fontSize: 13,
  },
  rowAction: {
    padding: 4,
  },
  cancelLinkRow: {
    alignSelf: 'flex-start',
  },
  cancelLink: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textFaint,
    fontWeight: '600',
  },
  cancelBlock: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  cancelPrompt: {
    ...typography.caption,
    color: colors.textMuted,
  },
  cancelInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 14,
  },
  cancelButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelledBlock: {
    gap: spacing.xs,
  },
  cancelReason: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  linkText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.accent,
    fontWeight: '700',
  },
  followUpCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  followUpQuestion: {
    ...typography.subtitle,
    fontSize: 15,
    color: colors.text,
  },
  followUpMeta: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textFaint,
  },
  followUpButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  followUpYesButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
  },
  followUpYesText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '700',
  },
});
