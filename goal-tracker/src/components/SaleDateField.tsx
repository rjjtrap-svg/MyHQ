import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { addDays, parseISODate, shortDateLabel, todayISO, toISODate, weekdayLabel } from '@/src/lib/dates';
import { colors, radius, spacing, typography } from '@/src/theme';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Human label for a date the user has typed or picked. */
export function saleDateLabel(iso: string): string {
  if (!ISO.test(iso)) return '';
  const today = todayISO();
  if (iso === today) return 'Today';
  if (iso === toISODate(addDays(new Date(), -1))) return 'Yesterday';
  if (iso === toISODate(addDays(new Date(), 1))) return 'Tomorrow';
  const d = parseISODate(iso);
  return `${weekdayLabel(d)}, ${shortDateLabel(d)}`;
}

export function isValidSaleDate(iso: string): boolean {
  if (!ISO.test(iso)) return false;
  const d = parseISODate(iso);
  return !Number.isNaN(d.getTime());
}

/**
 * The date a sale counts against — not the date it was typed in.
 *
 * This is the single most consequential field in the app and it used to offer two choices,
 * Today and Yesterday. Every deal logged late got stamped with the day someone remembered
 * to enter it, which quietly corrupts today's count, the streak, pace, best day, and every
 * override total downstream. Backdating isn't a convenience here, it's what makes the
 * numbers true.
 *
 * Future dates are allowed on purpose: reps sit down and log a sale they've just written
 * for an install that books tomorrow, and blocking that only teaches them to lie.
 */
export function SaleDateField({
  value,
  onChange,
  label = 'Sale date',
}: {
  value: string;
  onChange: (iso: string) => void;
  label?: string;
}) {
  const today = todayISO();
  const yesterday = toISODate(addDays(new Date(), -1));
  const twoBack = toISODate(addDays(new Date(), -2));
  const tomorrow = toISODate(addDays(new Date(), 1));

  const quick = [
    { iso: twoBack, label: shortDateLabel(parseISODate(twoBack)) },
    { iso: yesterday, label: 'Yesterday' },
    { iso: today, label: 'Today' },
    { iso: tomorrow, label: 'Tomorrow' },
  ];

  const valid = isValidSaleDate(value);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.chipRow}>
        {quick.map((q) => {
          const active = value === q.iso;
          return (
            <Pressable
              key={q.iso}
              onPress={() => onChange(q.iso)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{q.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.exactRow}>
        <Text style={styles.exactLabel}>Or exact</Text>
        <TextInput
          style={[styles.exactInput, !valid && !!value && styles.exactInvalid]}
          value={value}
          onChangeText={onChange}
          placeholder="2026-07-14"
          placeholderTextColor={colors.textFaint}
          autoCapitalize="none"
          autoCorrect={false}
          inputMode="numeric"
        />
      </View>

      {valid ? (
        <Text style={styles.resolved}>Counts as {saleDateLabel(value)}</Text>
      ) : (
        <Text style={styles.invalid}>Use the format 2026-07-14.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.badge,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
  exactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  exactLabel: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.textFaint,
    marginRight: spacing.md,
  },
  exactInput: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    paddingVertical: 0,
  },
  exactInvalid: {
    color: colors.dangerText,
  },
  resolved: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textFaint,
    marginTop: spacing.sm,
  },
  invalid: {
    ...typography.caption,
    fontSize: 11,
    color: colors.dangerText,
    marginTop: spacing.sm,
  },
});
