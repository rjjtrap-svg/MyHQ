import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Membership, RepOverrideRate } from '@/src/types';
import { Banner } from '@/src/components/Banner';
import { Button } from '@/src/components/Button';
import { colors, radius, spacing, typography } from '@/src/theme';

export interface RateDraft {
  repUid: string;
  repName: string;
  amountPerDeal: number;
  effectiveFrom?: string;
}

/**
 * Setting what a leader earns per deal on one rep.
 *
 * Money entry, so the rules are stricter than a normal form: the amount is the only thing
 * that can't be left blank, it's validated as a real positive number before anything is
 * written, and the rep it applies to can't be changed once a rate exists — editing an
 * existing rate to point at a different person would silently move earnings between two
 * people's histories. Change the rep and you're creating a new rate.
 */
export function OverrideRateEditor({
  reps,
  existing,
  busy,
  onSave,
  onRemove,
  onCancel,
}: {
  /** Reps available to attach a rate to — already filtered to those without one. */
  reps: Membership[];
  existing?: RepOverrideRate;
  busy?: boolean;
  onSave: (draft: RateDraft) => Promise<void>;
  onRemove?: () => Promise<void>;
  onCancel: () => void;
}) {
  const [repUid, setRepUid] = useState(existing?.repUid ?? reps[0]?.uid ?? '');
  const [amount, setAmount] = useState(
    existing ? String(existing.amountPerDeal) : ''
  );
  const [effectiveFrom, setEffectiveFrom] = useState(existing?.effectiveFrom ?? '');
  const [error, setError] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const selectedRep = existing
    ? { uid: existing.repUid, displayName: existing.repName }
    : reps.find((r) => r.uid === repUid);

  async function save() {
    const parsed = Number(amount);
    if (!selectedRep) {
      setError('Pick a rep first.');
      return;
    }
    if (!amount.trim() || Number.isNaN(parsed)) {
      setError('Enter the amount as a number, like 50 or 12.50.');
      return;
    }
    if (parsed <= 0) {
      setError('The amount has to be more than zero.');
      return;
    }
    if (parsed > 100000) {
      // Not a real limit so much as a typo net — a slipped decimal here multiplies
      // across every deal the rep closes.
      setError('That looks like a typo. Check the amount.');
      return;
    }
    if (effectiveFrom && !/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) {
      setError('Start date needs to look like 2026-08-31.');
      return;
    }
    setError(null);
    await onSave({
      repUid: selectedRep.uid,
      repName: selectedRep.displayName,
      amountPerDeal: parsed,
      effectiveFrom: effectiveFrom.trim() || undefined,
    });
  }

  return (
    <View style={styles.sheet}>
      <Text style={styles.title}>{existing ? 'Edit override' : 'New override'}</Text>

      {existing ? (
        <View style={styles.lockedRep}>
          <Text style={styles.label}>Rep</Text>
          <Text style={styles.lockedRepName}>{existing.repName}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.label}>Rep</Text>
          {reps.length === 0 ? (
            <Text style={styles.noReps}>
              Every rep on the team already has an override with this leader.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.repRow}>
              {reps.map((r) => {
                const active = r.uid === repUid;
                return (
                  <Pressable
                    key={r.uid}
                    onPress={() => setRepUid(r.uid)}
                    style={[styles.repChip, active && styles.repChipActive]}
                  >
                    <Text style={[styles.repChipText, active && styles.repChipTextActive]}>
                      {r.displayName}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </>
      )}

      <Text style={[styles.label, styles.labelSpaced]}>Per deal</Text>
      <View style={styles.amountRow}>
        <Text style={styles.currency}>$</Text>
        <TextInput
          style={styles.amount}
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor={colors.textFaint}
          keyboardType="decimal-pad"
          inputMode="decimal"
        />
      </View>

      <Text style={[styles.label, styles.labelSpaced]}>Counting from</Text>
      <TextInput
        style={styles.dateInput}
        value={effectiveFrom}
        onChangeText={setEffectiveFrom}
        placeholder="Leave blank for all their deals"
        placeholderTextColor={colors.textFaint}
        autoCapitalize="none"
      />
      <Text style={styles.hint}>
        Blank counts every deal they have ever closed. Set a date when a rate changes, so a
        raise does not rewrite what you earned last quarter.
      </Text>

      {!!error && <Banner message={error} />}

      <View style={styles.actions}>
        <Button label="Cancel" variant="ghost" onPress={onCancel} />
        <Button
          label={existing ? 'Save' : 'Add override'}
          onPress={save}
          busy={busy}
          disabled={!selectedRep}
          style={styles.primary}
        />
      </View>

      {!!onRemove && !!existing && (
        <View style={styles.removeBlock}>
          {confirmingRemove ? (
            <>
              <Text style={styles.removeWarning}>
                Remove this override? {existing.repName}'s deals stop counting toward your
                total. Their own commission is untouched.
              </Text>
              <View style={styles.actions}>
                <Button label="Keep it" variant="ghost" onPress={() => setConfirmingRemove(false)} />
                <Button label="Remove" variant="danger" onPress={onRemove} busy={busy} style={styles.primary} />
              </View>
            </>
          ) : (
            <Pressable onPress={() => setConfirmingRemove(true)} hitSlop={8}>
              <Text style={styles.removeLink}>Remove override</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  labelSpaced: {
    marginTop: spacing.lg,
  },
  lockedRep: {
    marginBottom: spacing.xs,
  },
  lockedRepName: {
    ...typography.subtitle,
    color: colors.text,
  },
  noReps: {
    ...typography.body,
    color: colors.textMuted,
  },
  repRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  repChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  repChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  repChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
  },
  repChipTextActive: {
    color: colors.background,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  currency: {
    ...typography.scoreValue,
    fontSize: 32,
    color: colors.textFaint,
    marginRight: spacing.xs,
  },
  amount: {
    ...typography.scoreValue,
    fontSize: 32,
    color: colors.text,
    flex: 1,
    paddingVertical: 0,
  },
  dateInput: {
    ...typography.body,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  primary: {
    marginLeft: spacing.sm,
  },
  removeBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },
  removeLink: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.dangerText,
  },
  removeWarning: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 22,
  },
});
