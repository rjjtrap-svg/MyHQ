import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
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
import { BarChart } from '@/src/components/BarChart';
import { Button, SegmentedToggle } from '@/src/components/Button';
import { DealEditor } from '@/src/components/DealEditor';
import { Section } from '@/src/components/Section';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { StatTile } from '@/src/components/StatTile';
import { StagePillRow } from '@/src/components/StagePill';
import { EmptyState } from '@/src/components/EmptyState';
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
              <Text style={styles.cancelPrompt}>
                Why did it cancel? (optional)
              </Text>
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
            <Pressable
              onPress={() => setCancelling(true)}
              style={styles.cancelLinkRow}
            >
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

          {editing && (
            <DealEditor deal={deal} onDone={() => setEditing(false)} />
          )}
        </>
      ) : null}
    </Surface>
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
        <Surface
          key={`${f.deal.id}-${f.kind}`}
          level="raised"
          style={styles.followUpCard}
        >
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
                advanceStage(
                  f.deal.id,
                  f.kind === 'install' ? 'installed' : 'paid',
                )
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
    <Section title="Closing efficiency">
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
        <StatTile
          label="Closing % today"
          value={formatPercent(todaySales, doorsToday)}
          sublabel={`${todaySales} / ${doorsToday}`}
        />
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
  const { deals, stats } = useGoalStats();
  const commissions = useCommissionStore((s) => s.byDealId);
  const [chartRange, setChartRange] = useState<'daily' | 'weekly' | 'monthly'>(
    'daily',
  );

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
    <SafeAreaView style={styles.safe} edges={['top']} testID="deals-screen">
      <FlatList
        data={livePipeline}
        keyExtractor={(deal) => deal.id}
        renderItem={({ item }) => <DealRow deal={item} />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // The pipeline is the one list here that grows unbounded with real usage (25-40+
        // deals/day, day after day) — everything else stays in the header/footer and renders
        // once, same as before. FlatList only windows the `data` prop, so the pipeline is the
        // part that actually needed virtualizing.
        ListHeaderComponent={
          <>
            <ScreenHeader
              eyebrow="Your book"
              title="My Deals"
              subtitle="Private to you — only you and your manager see commission."
            />

            <Surface level="raised" style={styles.commissionHero}>
              <Text style={styles.heroLabel}>Total commission</Text>
              <Text style={styles.heroValue}>
                {formatMoney(myCommissionTotals.total)}
              </Text>
              <View style={styles.heroMetaRow}>
                <Text style={styles.heroMeta}>
                  Paid {formatMoney(myCommissionTotals.paid)}
                </Text>
                <Text style={styles.heroMeta}>
                  Pending {formatMoney(myCommissionTotals.pending)}
                </Text>
              </View>
            </Surface>

            <NeedsAttention deals={deals} />

            {livePipeline.length === 0 ? (
              <Section title={`Pipeline (${livePipeline.length})`}>
                <EmptyState
                  icon="briefcase"
                  title="Your pipeline is ready"
                  body="Log your first deal with the center action and it will appear here."
                />
              </Section>
            ) : (
              <View style={styles.pipelineHeader}>
                <Text style={styles.pipelineTitle}>{`Pipeline (${livePipeline.length})`}</Text>
                <View style={styles.pipelineRule} />
              </View>
            )}
          </>
        }
        ListFooterComponent={
          <>
            {livePipeline.length > 0 && <View style={styles.pipelineFootSpacer} />}

            <ClosingKpis todaySales={stats.todaySales} weekSales={stats.weekSales} />

            <Section
              title="Sales history"
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

            <Section title="Performance">
              <View style={styles.grid}>
                <StatTile
                  label="Running average"
                  value={stats.runningAverage.toFixed(1)}
                  sublabel="sales / day"
                />
                <StatTile
                  label="Best day"
                  value={stats.bestDay ? String(stats.bestDay.count) : '—'}
                  sublabel={
                    stats.bestDay
                      ? shortDateLabel(parseISODate(stats.bestDay.date))
                      : undefined
                  }
                />
                <StatTile
                  label="Best week"
                  value={stats.bestWeek ? String(stats.bestWeek.count) : '—'}
                  sublabel={
                    stats.bestWeek
                      ? `wk of ${shortDateLabel(parseISODate(stats.bestWeek.weekStart))}`
                      : undefined
                  }
                />
                <StatTile label="Current streak" value={`${stats.currentStreak}d`} />
                <StatTile label="Longest streak" value={`${stats.longestStreak}d`} />
                <StatTile label="This month" value={String(stats.monthSales)} />
              </View>
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
                  <StatTile
                    label="Commission lost"
                    value={formatMoney(cancels.lost)}
                    accent={colors.danger}
                  />
                </View>
                {cancelledDeals.map((deal) => (
                  <DealRow key={deal.id} deal={deal} />
                ))}
              </Section>
            )}
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Matches Screen's own SafeAreaView + content container exactly, since this screen
  // swapped Screen's ScrollView for a FlatList to virtualize the pipeline.
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.screenGutter,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  // Mirrors Section's own header row exactly (title + trailing hairline) — split out
  // because the pipeline's rows are now FlatList `data`, not Section children.
  pipelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  pipelineTitle: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  pipelineRule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
  // Replaces Section's own marginBottom: spacing.xl, which would otherwise land right
  // after the (now childless) pipeline header instead of after the last row.
  pipelineFootSpacer: { height: spacing.xl },
  rangeLabel: {
    ...typography.caption,
    color: colors.textFaint,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  commissionHero: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  heroLabel: {
    ...typography.eyebrow,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  heroValue: {
    ...typography.metricHero,
    color: colors.textPrimary,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  heroMeta: {
    ...typography.caption,
    color: colors.textMuted,
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
