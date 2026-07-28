import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { updateMyBests } from '@/src/firebase/profile';
import { PERSONAL_BEST_FIELDS, PersonalBestOverrides } from '@/src/types';
import { Banner } from '@/src/components/Banner';
import { fonts, colors, radius, spacing, typography } from '@/src/theme';

/**
 * Lets a rep type in what they did before this app existed. The profile shows whichever is
 * bigger — the number typed here or the one computed from logged deals — so installing the
 * app doesn't reset a career to zero, and logging real deals eventually overtakes the
 * typed-in figure on its own.
 */
export function PersonalBestsEditor({
  teamId,
  uid,
  initial,
  onDone,
}: {
  teamId: string;
  uid: string;
  initial?: PersonalBestOverrides;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const f of PERSONAL_BEST_FIELDS) {
      const v = initial?.[f.key];
      out[f.key] = typeof v === 'number' ? String(v) : '';
    }
    return out;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const bests: PersonalBestOverrides = {};
      for (const f of PERSONAL_BEST_FIELDS) {
        const raw = draft[f.key].replace(/[^0-9.]/g, '');
        const n = Number(raw);
        if (raw !== '' && Number.isFinite(n)) bests[f.key] = n;
      }
      await updateMyBests(teamId, uid, bests);
      onDone();
    } catch (err: any) {
      setError(err?.message ?? 'Could not save your bests.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.intro}>
        Your numbers from before this app. We'll show whichever is higher — these, or what
        you log from here on.
      </Text>

      {PERSONAL_BEST_FIELDS.map((f) => (
        <View key={f.key} style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>{f.label}</Text>
            <Text style={styles.rowHint}>{f.hint}</Text>
          </View>
          <View style={styles.inputWrap}>
            {f.money && <Text style={styles.prefix}>$</Text>}
            <TextInput
              style={styles.input}
              value={draft[f.key]}
              onChangeText={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
              placeholder="—"
              placeholderTextColor={colors.textFaint}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      ))}

      {!!error && (
        <Banner message={error} />
      )}

      <View style={styles.buttons}>
        <Pressable onPress={onDone} style={styles.ghostButton} disabled={saving}>
          <Text style={styles.ghostButtonText}>Cancel</Text>
        </Pressable>
        <Pressable onPress={save} style={styles.solidButton} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.solidButtonText}>Save</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  intro: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  rowText: { flex: 1 },
  rowLabel: { ...typography.eyebrow, fontSize: 10, color: colors.text },
  rowHint: { ...typography.caption, fontSize: 11, color: colors.textFaint, marginTop: 2 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  prefix: { color: colors.textFaint, fontSize: 14 },
  input: { color: colors.text, fontSize: 15, paddingVertical: 8, paddingLeft: 2, minWidth: 72, textAlign: 'right' },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  ghostButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  ghostButtonText: { ...typography.caption, color: colors.textMuted, fontFamily: fonts.sansBold },
  solidButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    minWidth: 84,
    alignItems: 'center',
  },
  solidButtonText: { color: colors.onPrimary, fontSize: 13, fontFamily: fonts.sansBold },
});
