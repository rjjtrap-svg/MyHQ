import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGoalStats } from '@/src/hooks/useGoalStats';
import { useAuthStore } from '@/src/store/authStore';
import { useTeamStore } from '@/src/store/teamStore';
import { useDealsStore } from '@/src/store/dealsStore';
import { useCommissionStore } from '@/src/store/commissionStore';
import { useDoorKnocksStore } from '@/src/store/doorKnocksStore';
import { dailyPoints, monthlyPoints, weeklyPoints } from '@/src/lib/stats';
import {
  parseISODate,
  shortDateLabel,
  startOfWeek,
  todayISO,
  toISODate,
  weekdayLabel,
} from '@/src/lib/dates';
import {
  cancellationStats,
  followUpQuestion,
  pendingFollowUps,
} from '@/src/lib/dealFollowUps';
import { AtmosphericBackdrop } from '@/src/components/AtmosphericBackdrop';
import { BriefMetric, MetricGrid } from '@/src/components/BriefMetric';
import { FocusRow } from '@/src/components/FocusRow';
import { BarChart } from '@/src/components/BarChart';
import { Button, SegmentedToggle } from '@/src/components/Button';
import { DealEditor } from '@/src/components/DealEditor';
import { Section } from '@/src/components/Section';
import { StagePillRow } from '@/src/components/StagePill';
import { EmptyState } from '@/src/components/EmptyState';
import { Screen } from '@/src/components/Screen';
import { Surface } from '@/src/components/Surface';
import { colors, fonts, layout, radius, spacing, typography } from '@/src/theme';
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

  const [amountText, setAmountText] = useState(
    commission ? String(commission.amount) : '',
  );
  const [expanded, setExpanded] = useState(false);
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
    <Surface style={styles.dealCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${deal.customerName || 'unnamed deal'}`}
        onPress={() => setExpanded((value) => !value)}
        style={styles.dealHeaderRow}
      >
        {deal.photoUrl ? (
          <Image source={{ uri: deal.photoUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}
        <View style={styles.dealIdentity}>
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
        <FontAwesome
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.textFaint}
        />
      </Pressable>

      {expanded && confirmingDelete ? (
        <View style={styles.confirmDeleteRow}>
          <Text style={styles.confirmDeleteText}>Delete this deal?</Text>
          <View style={styles.actionRow}>
            <Button
              label="Cancel"
              variant="ghost"
              size="sm"
              onPress={() => setConfirmingDelete(false)}
              disabled={deleting}
            />
            <Button
              label="Delete"
              variant="danger"
              size="sm"
              onPress={confirmDelete}
              busy={deleting}
            />
          </View>
        </View>
      ) : expanded ? (
        <>
          <View style={styles.dealActions}>
            <Button
              label={editing ? 'Close editor' : 'Edit details'}
              variant="ghost"
              size="sm"
              onPress={() => setEditing((value) => !value)}
            />
            <Button
              label="Delete"
              variant="danger"
              size="sm"
              onPress={() => setConfirmingDelete(true)}
            />
          </View>

          <StagePillRow
            stage={deal.stage}
            onAdvance={(stage: DealStage) => advanceStage(deal.id, stage)}
          />

          {deal.stage === 'cancelled' ? (
            <View style={styles.cancelledBlock}>
              {!!deal.cancelReason && (
                <Text style={styles.cancelReason}>{deal.cancelReason}</Text>
              )}
              <Button
                label="Reinstate deal"
                variant="ghost"
                size="sm"
                onPress={() => reinstateDeal(deal.id)}
              />
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
              <View style={styles.actionRow}>
                <Button
                  label="Never mind"
                  variant="ghost"
                  size="sm"
                  onPress={() => setCancelling(false)}
                />
                <Button
                  label="Mark cancelled"
                  variant="danger"
                  size="sm"
                  onPress={async () => {
                    await cancelDeal(deal.id, cancelReason);
                    setCancelling(false);
                  }}
                />
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
      ) : null}
    </Surface>
  );
}

function NeedsAttention({ deals }: { deals: Deal[] }) {
  const advanceStage = useDealsStore((s) => s.advanceStage);
  const dismissPrompt = useDealsStore((s) => s.dismissPrompt);
  const cancelDeal = useDealsStore((s) => s.cancelDeal);

  const followUps = useMemo(() => pendingFollowUps(deals), [deals]);
  if (followUps.length === 0) return null;

  return (
    <Section title={`Needs attention (${followUps.length})`} index={1}>
      {followUps.map((f) => (
        <Surface key={`${f.deal.id}-${f.kind}`} level="raised" style={styles.followUpCard}>
          <Text style={styles.followUpQuestion}>{followUpQuestion(f)}</Text>
          <Text style={styles.followUpMeta}>
            {f.kind === 'install'
              ? `Install was booked for ${shortDateLabel(parseISODate(f.dueDate))}`
              : `Payday was ${shortDateLabel(parseISODate(f.dueDate))}`}
          </Text>
          <View style={styles.followUpButtons}>
            <Button
              label="Not yet"
              variant="ghost"
              size="sm"
              onPress={() => dismissPrompt(f.deal.id, f.kind)}
            />
            {f.kind === 'install' && (
              <Button
                label="It cancelled"
                variant="danger"
                size="sm"
                onPress={() => cancelDeal(f.deal.id)}
              />
            )}
            <Button
              label="Yes"
              size="sm"
              onPress={() =>
                advanceStage(f.deal.id, f.kind === 'install' ? 'installed' : 'paid')
              }
            />
          </View>
        </Surface>
      ))}
    </Section>
  );
}

function ClosingKpis({
  todaySales,
  weekSales,
}: {
  todaySales: number;
  weekSales: number;
}) {
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
    [doorKnocksByDate, weekStartIso],
  );

  const [text, setText] = useState(String(doorsToday || ''));

  function save() {
    const parsed = Number(text.replace(/[^0-9]/g, ''));
    if (!uid || !teamId || !Number.isFinite(parsed)) return;
    setDoorKnocksToday(teamId, uid, today, parsed);
  }

  return (
    <Section title="Closing efficiency" index={3}>
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
      <MetricGrid>
        <BriefMetric
          label="Closing % today"
          value={formatPercent(todaySales, doorsToday)}
          detail={`${todaySales} / ${doorsToday}`}
          icon="percent"
        />
        <BriefMetric
          label="Closing % this week"
          value={formatPercent(weekSales, doorsThisWeek)}
          detail={`${weekSales} / ${doorsThisWeek}`}
          icon="line-chart"
        />
      </MetricGrid>
    </Section>
  );
}

export default function DealsScreen() {
  const router = useRouter();
  const { deals, stats } = useGoalStats();
  const commissions = useCommissionStore((s) => s.byDealId);
  const [chartRange, setChartRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

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

  const cancels = useMemo(
    () => cancellationStats(deals, commissions),
    [deals, commissions],
  );
  const livePipeline = useMemo(
    () => deals.filter((d) => !d.deletedAt && d.stage !== 'cancelled'),
    [deals],
  );
  const cancelledDeals = useMemo(
    () => deals.filter((d) => !d.deletedAt && d.stage === 'cancelled'),
    [deals],
  );
  const followUps = useMemo(() => pendingFollowUps(deals), [deals]);

  const daily = useMemo(() => dailyPoints(deals, 14), [deals]);
  const weekly = useMemo(() => weeklyPoints(deals, 8), [deals]);
  const monthly = useMemo(() => monthlyPoints(deals, 6), [deals]);

  const dailyChart = daily.map((p) => ({
    label: weekdayLabel(parseISODate(p.date))[0],
    value: p.count,
  }));
  const weeklyChart = weekly.map((p) => ({
    label: shortDateLabel(parseISODate(p.weekStart)),
    value: p.count,
  }));
  const monthlyChart = monthly.map((p) => ({ label: p.label, value: p.count }));
  const chartData =
    chartRange === 'daily'
      ? dailyChart
      : chartRange === 'weekly'
        ? weeklyChart
        : monthlyChart;
  const chartCaption =
    chartRange === 'daily'
      ? 'Last 14 days'
      : chartRange === 'weekly'
        ? 'Last 8 weeks'
        : 'Last 6 months';

  return (
    <Screen testID="deals-screen">
      <AtmosphericBackdrop height={520} />

      <View style={styles.intro}>
        <View>
          <Text style={styles.eyebrow}>Your book</Text>
          <Text style={styles.pageTitle}>Deals</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Total commission</Text>
        <Text style={styles.heroValue}>{formatMoney(myCommissionTotals.total)}</Text>
        <Text style={styles.heroMeta}>
          Paid {formatMoney(myCommissionTotals.paid)} · Pending{' '}
          {formatMoney(myCommissionTotals.pending)}
        </Text>
      </View>

      {followUps.length > 0 ? (
        <FocusRow
          label="Needs attention"
          value={`${followUps.length} ${
            followUps.length === 1 ? 'deal needs' : 'deals need'
          } review`}
          action="Review"
          onPress={() => {}}
        />
      ) : (
        <FocusRow
          label="Today's move"
          value="Log a new sale"
          action="Add deal"
          onPress={() => router.push('/add-deal')}
        />
      )}

      <NeedsAttention deals={deals} />

      <Section title={`Pipeline (${livePipeline.length})`} index={2}>
        {livePipeline.length === 0 ? (
          <EmptyState
            icon="briefcase"
            title="Your pipeline is ready"
            body="Log your first deal and it will appear here."
            actionLabel="Log sale"
            onAction={() => router.push('/add-deal')}
          />
        ) : (
          livePipeline.map((deal) => <DealRow key={deal.id} deal={deal} />)
        )}
      </Section>

      <ClosingKpis todaySales={stats.todaySales} weekSales={stats.weekSales} />

      <Section
        title="Sales history"
        index={4}
        right={<Text style={styles.rangeLabel}>{chartCaption}</Text>}
      >
        <SegmentedToggle
          options={[
            { key: 'daily', label: 'Daily' },
            { key: 'weekly', label: 'Weekly' },
            { key: 'monthly', label: 'Monthly' },
          ]}
          value={chartRange}
          onChange={setChartRange}
          stretch
        />
        <View style={styles.chart}>
          <BarChart data={chartData} highlightLastBar />
        </View>
      </Section>

      <Section title="Performance" index={5}>
        <MetricGrid>
          <BriefMetric
            label="Running average"
            value={stats.runningAverage.toFixed(1)}
            detail="sales / day"
            icon="signal"
          />
          <BriefMetric
            label="Best day"
            value={stats.bestDay ? String(stats.bestDay.count) : '—'}
            detail={
              stats.bestDay
                ? shortDateLabel(parseISODate(stats.bestDay.date))
                : undefined
            }
            icon="trophy"
          />
          <BriefMetric
            label="Current streak"
            value={`${stats.currentStreak}d`}
            detail={`Best ${stats.longestStreak}d`}
            icon="circle-o-notch"
          />
          <BriefMetric
            label="This month"
            value={String(stats.monthSales)}
            icon="calendar"
          />
        </MetricGrid>
      </Section>

      {cancelledDeals.length > 0 && (
        <Section title={`Cancelled (${cancelledDeals.length})`} index={6}>
          <MetricGrid>
            <BriefMetric
              label="Cancel rate"
              value={`${cancels.cancelRate.toFixed(1)}%`}
              detail={`${cancels.cancelled} of ${cancels.cancelled + livePipeline.length}`}
              icon="times-circle"
              accent={colors.danger}
            />
            <BriefMetric
              label="Commission lost"
              value={formatMoney(cancels.lost)}
              icon="usd"
              accent={colors.danger}
            />
          </MetricGrid>
          {cancelledDeals.map((deal) => (
            <DealRow key={deal.id} deal={deal} />
          ))}
        </Section>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  pageTitle: {
    ...typography.eyebrow,
    color: colors.primaryMuted,
  },
  hero: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  heroLabel: {
    ...typography.eyebrow,
    color: colors.textMuted,
    fontSize: 10,
  },
  heroValue: {
    ...typography.metricHero,
    color: colors.text,
    marginTop: spacing.sm,
  },
  heroMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  rangeLabel: {
    ...typography.caption,
    color: colors.textFaint,
  },
  chart: {
    marginTop: spacing.md,
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
    borderColor: colors.borderStrong,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: 15,
  },
  dealCard: {
    marginBottom: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.brandSurface,
  },
  dealHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: layout.minTouchTarget,
  },
  dealIdentity: {
    flex: 1,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
  },
  thumbPlaceholder: {
    backgroundColor: colors.surfaceRaised,
  },
  dealName: {
    ...typography.cardTitle,
    color: colors.text,
  },
  dealDate: {
    ...typography.caption,
    color: colors.textFaint,
  },
  dealActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.xs,
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
    backgroundColor: colors.surface,
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
    paddingVertical: spacing.xs + 2,
    paddingLeft: 2,
    minWidth: 60,
  },
  confirmDeleteRow: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  confirmDeleteText: {
    ...typography.body,
    color: colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelLinkRow: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  cancelLink: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textFaint,
    fontFamily: fonts.sansSemiBold,
  },
  cancelBlock: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  cancelPrompt: {
    ...typography.caption,
    color: colors.textMuted,
  },
  cancelInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 14,
  },
  cancelledBlock: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cancelReason: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  followUpCard: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  followUpQuestion: {
    ...typography.cardTitle,
    color: colors.text,
  },
  followUpMeta: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textFaint,
  },
  followUpButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
