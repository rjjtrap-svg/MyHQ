import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  KNOCK_DISPOSITIONS,
  KNOCK_DISPOSITION_LABELS,
  KnockDisposition,
} from '@/src/types';
import { Banner } from '@/src/components/Banner';
import { Button } from '@/src/components/Button';
import { colors, radius, spacing, typography } from '@/src/theme';

const DISPOSITION_COLOR: Record<KnockDisposition, string> = {
  not_home: colors.knockNotHome,
  not_interested: colors.knockNotInterested,
  callback: colors.knockCallback,
  sold: colors.knockSold,
  do_not_knock: colors.knockDoNotKnock,
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Logging a door. This gets used standing on a porch, one-handed, often in the cold and
 * sometimes in the rain — so the disposition buttons are full-width rows rather than a
 * neat grid of chips, and the only thing you must type is the address.
 */
export function KnockLogger({
  initialAddress = '',
  doNotKnock,
  onLog,
}: {
  initialAddress?: string;
  /** Lowercased addresses somebody has asked not to be knocked. */
  doNotKnock: Set<string>;
  onLog: (v: {
    address: string;
    disposition: KnockDisposition;
    notes?: string;
    callbackDate?: string;
  }) => Promise<void>;
}) {
  const [address, setAddress] = useState(initialAddress);
  const [disposition, setDisposition] = useState<KnockDisposition | null>(null);
  const [callbackDate, setCallbackDate] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flagged = useMemo(
    () => !!address.trim() && doNotKnock.has(address.trim().toLowerCase()),
    [address, doNotKnock]
  );

  async function save() {
    if (!address.trim()) {
      setError('Which door?');
      return;
    }
    if (!disposition) {
      setError('Pick what happened.');
      return;
    }
    // A rep can still record a fresh outcome for a flagged address — they might be
    // clearing it — but never anything that implies another attempt at the pitch.
    if (flagged && disposition !== 'do_not_knock') {
      setError('This address is marked do not knock. Leave it.');
      return;
    }
    if (callbackDate && !/^\d{4}-\d{2}-\d{2}$/.test(callbackDate)) {
      setError('Come-back date needs to look like 2026-08-31.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onLog({
        address: address.trim(),
        disposition,
        notes: notes.trim() || undefined,
        callbackDate: disposition === 'callback' ? callbackDate || todayISO() : undefined,
      });
      setAddress('');
      setDisposition(null);
      setCallbackDate('');
      setNotes('');
    } catch (err: any) {
      setError(err?.message ?? "That didn't save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      <TextInput
        style={styles.address}
        value={address}
        onChangeText={setAddress}
        placeholder="1423 W Oak Ridge"
        placeholderTextColor={colors.textFaint}
        autoCapitalize="words"
        autoCorrect={false}
      />

      {flagged && <Banner message="Marked do not knock. Do not pitch this address." />}

      <View style={styles.dispositions}>
        {KNOCK_DISPOSITIONS.map((d) => {
          const active = disposition === d;
          return (
            <Pressable
              key={d}
              onPress={() => setDisposition(active ? null : d)}
              style={[
                styles.disposition,
                active && { backgroundColor: DISPOSITION_COLOR[d], borderColor: DISPOSITION_COLOR[d] },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: DISPOSITION_COLOR[d] }]} />
              <Text style={[styles.dispositionLabel, active && styles.dispositionLabelActive]}>
                {KNOCK_DISPOSITION_LABELS[d]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {disposition === 'callback' && (
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Come back</Text>
          <TextInput
            style={styles.rowInput}
            value={callbackDate}
            onChangeText={setCallbackDate}
            placeholder={todayISO()}
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
          />
        </View>
      )}

      <TextInput
        style={styles.notes}
        value={notes}
        onChangeText={setNotes}
        placeholder="Anything worth remembering (optional)"
        placeholderTextColor={colors.textFaint}
        multiline
      />

      {!!error && <Banner message={error} />}

      <Button label="Log door" onPress={save} busy={busy} size="lg" style={styles.save} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  address: {
    ...typography.title,
    fontSize: 20,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  dispositions: {
    marginBottom: spacing.sm,
  },
  disposition: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.round,
    marginRight: spacing.md,
  },
  dispositionLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  dispositionLabelActive: {
    color: colors.onPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  rowLabel: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.textMuted,
    marginRight: spacing.md,
  },
  rowInput: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  notes: {
    ...typography.body,
    color: colors.text,
    minHeight: 44,
    paddingTop: spacing.sm,
  },
  save: {
    marginTop: spacing.md,
  },
});
