import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { RepOverrideRate } from '@/src/types';
import { computeOverrides, formatMoney } from '@/src/lib/overrideEarnings';
import { useAuthStore } from '@/src/store/authStore';
import { useTeamStore } from '@/src/store/teamStore';
import { useDealsStore } from '@/src/store/dealsStore';
import { useOverrideRateStore } from '@/src/store/overrideRateStore';
import { OverrideRateEditor, RateDraft } from '@/src/components/overrides/OverrideRateEditor';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { Section } from '@/src/components/Section';
import { Banner } from '@/src/components/Banner';
import { Button } from '@/src/components/Button';
import { colors, layout, radius, spacing, typography } from '@/src/theme';

export default function OverridesScreen() {
  const router = useRouter();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const profile = useAuthStore((s) => s.profile);
  const teamId = useTeamStore((s) => s.teamId);
  const members = useTeamStore((s) => s.members);
  const deals = useDealsStore((s) => s.deals);

  const rates = useOverrideRateStore((s) => s.rates);
  const subscribe = useOverrideRateStore((s) => s.subscribe);
  const saveRate = useOverrideRateStore((s) => s.save);
  const removeRate = useOverrideRateStore((s) => s.remove);

  const [editing, setEditing] = useState<RepOverrideRate | 'new' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uid = firebaseUser?.uid;
  const isManager = profile?.role === 'manager';

  // A manager sets the whole comp structure, so they read every rate. Anyone else only
  // ever sees the ones they earn — the rules reject an unfiltered read from a team lead.
  useEffect(() => {
    if (!teamId || !uid) return;
    return subscribe(teamId, isManager ? 'all' : uid);
  }, [teamId, uid, isManager, subscribe]);

  // The screen always shows ONE leader's book. A manager looking at the team still sees
  // their own total here — a combined figure across several leaders would be a number
  // nobody actually gets paid.
  const myRates = useMemo(() => rates.filter((r) => r.leaderUid === uid), [rates, uid]);
  const totals = useMemo(() => computeOverrides(myRates, deals), [myRates, deals]);

  const availableReps = useMemo(
    () =>
      members.filter(
        (m) => m.role === 'rep' && m.uid !== uid && !myRates.some((r) => r.repUid === m.uid)
      ),
    [members, uid, myRates]
  );

  if (!teamId || !uid) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Banner message="Sign in to your team to see overrides." tone="info" />
        </View>
      </SafeAreaView>
    );
  }

  async function handleSave(draft: RateDraft) {
    if (!teamId || !uid) return;
    setBusy(true);
    setError(null);
    try {
      await saveRate({
        teamId,
        leaderUid: uid,
        leaderName: profile?.displayName ?? 'Unknown',
        repUid: draft.repUid,
        repName: draft.repName,
        amountPerDeal: draft.amountPerDeal,
        effectiveFrom: draft.effectiveFrom,
        setByUid: uid,
      });
      setEditing(null);
    } catch (err: any) {
      setError(err?.message ?? "That didn't save. Check you're a manager on this team.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(rate: RepOverrideRate) {
    if (!teamId) return;
    setBusy(true);
    setError(null);
    try {
      await removeRate(teamId, rate.leaderUid, rate.repUid);
      setEditing(null);
    } catch (err: any) {
      setError(err?.message ?? "That didn't delete. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          eyebrow="Your book"
          title="Overrides"
          subtitle="What your reps earn you, per deal."
          right={<Button label="Done" variant="ghost" size="sm" onPress={() => router.back()} />}
        />

        {/* Booked is the headline, but paid sits right beside it. A leader looking at one
            number needs to know whether it's money in the account or money that still
            depends on installs happening. */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Booked</Text>
          <Text style={styles.heroValue}>{formatMoney(totals.booked)}</Text>
          <View style={styles.heroSplit}>
            <View style={styles.heroPart}>
              <Text style={styles.heroPartValue}>{formatMoney(totals.paid)}</Text>
              <Text style={styles.heroPartLabel}>Paid out</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroPart}>
              <Text style={styles.heroPartValue}>{formatMoney(totals.pending)}</Text>
              <Text style={styles.heroPartLabel}>Still pending</Text>
            </View>
          </View>
        </View>

        {!!error && <Banner message={error} />}

        {editing === 'new' && (
          <OverrideRateEditor
            reps={availableReps}
            busy={busy}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}

        {editing && editing !== 'new' && (
          <OverrideRateEditor
            reps={availableReps}
            existing={editing}
            busy={busy}
            onSave={handleSave}
            onRemove={() => handleRemove(editing)}
            onCancel={() => setEditing(null)}
          />
        )}

        <Section
          title="Per rep"
          right={
            isManager && !editing ? (
              <Button label="Add" size="sm" onPress={() => setEditing('new')} />
            ) : undefined
          }
        >
          {totals.lines.length === 0 ? (
            <Text style={styles.empty}>
              {isManager
                ? 'No overrides set. Add one to start tracking what your team earns you.'
                : 'Your manager has not set any overrides for you yet.'}
            </Text>
          ) : (
            totals.lines.map((line) => {
              const rate = myRates.find((r) => r.repUid === line.repUid);
              const row = (
                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowName}>{line.repName}</Text>
                    <Text style={styles.rowMeta}>
                      {formatMoney(line.amountPerDeal)} × {line.deals}{' '}
                      {line.deals === 1 ? 'deal' : 'deals'}
                      {line.paidDeals < line.deals ? ` · ${line.paidDeals} paid` : ''}
                    </Text>
                    {!!line.effectiveFrom && (
                      <Text style={styles.rowFrom}>Counting from {line.effectiveFrom}</Text>
                    )}
                  </View>
                  <View style={styles.rowAmounts}>
                    <Text style={styles.rowBooked}>{formatMoney(line.booked)}</Text>
                    {line.paid !== line.booked && (
                      <Text style={styles.rowPaid}>{formatMoney(line.paid)} paid</Text>
                    )}
                  </View>
                </View>
              );

              return isManager && rate ? (
                <Pressable key={line.repUid} onPress={() => setEditing(rate)}>
                  {row}
                </Pressable>
              ) : (
                <View key={line.repUid}>{row}</View>
              );
            })
          )}
        </Section>

        <Text style={styles.footnote}>
          {isManager
            ? 'Cancelled deals never count toward an override. Only a manager can set rates.'
            : 'Rates are set by your manager. Cancelled deals never count toward an override.'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: {
    backgroundColor: colors.brandSurface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroLabel: {
    ...typography.eyebrow,
    color: colors.gold,
  },
  heroValue: {
    ...typography.scoreValue,
    fontSize: 46,
    color: colors.onPrimary,
    marginTop: spacing.xs,
  },
  heroSplit: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },
  heroPart: { flex: 1 },
  heroDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  heroPartValue: {
    ...typography.subtitle,
    color: colors.onPrimary,
  },
  heroPartLabel: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.primaryMuted,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1, paddingRight: spacing.md },
  rowName: {
    ...typography.subtitle,
    color: colors.text,
  },
  rowMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowFrom: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.textFaint,
    marginTop: 2,
  },
  rowAmounts: { alignItems: 'flex-end' },
  rowBooked: {
    ...typography.scoreValue,
    fontSize: 22,
    color: colors.text,
  },
  rowPaid: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.success,
    marginTop: 2,
  },
  empty: {
    ...typography.quote,
    fontSize: 16,
    color: colors.textFaint,
    paddingVertical: spacing.lg,
  },
  footnote: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
