import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useDealsStore, DealDetailsInput } from '@/src/store/dealsStore';
import { Deal } from '@/src/types';
import { Banner } from '@/src/components/Banner';
import { SaleDateField, isValidSaleDate } from '@/src/components/SaleDateField';
import { colors, radius, spacing, typography } from '@/src/theme';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  multiline,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad';
  multiline?: boolean;
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline, !!error && styles.inputError]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        autoCapitalize={keyboardType === 'phone-pad' ? 'none' : 'words'}
      />
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

/**
 * Everything on a deal that's optional. None of it is needed to log a sale — it's the
 * detail a rep fills in afterwards, when they have a second, so the record is useful later.
 */
export function DealEditor({ deal, onDone }: { deal: Deal; onDone: () => void }) {
  const updateDealDetails = useDealsStore((s) => s.updateDealDetails);

  const [firstName, setFirstName] = useState(deal.firstName ?? '');
  const [lastName, setLastName] = useState(deal.lastName ?? '');
  const [phone, setPhone] = useState(deal.phone ?? '');
  const [address, setAddress] = useState(deal.address ?? '');
  const [saleDate, setSaleDate] = useState(deal.date);
  const [installDate, setInstallDate] = useState(deal.scheduledInstallDate ?? '');
  const [notes, setNotes] = useState(deal.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const installDateInvalid = installDate.trim() !== '' && !ISO_DATE.test(installDate.trim());
  const saleDateInvalid = !isValidSaleDate(saleDate);

  async function save() {
    if (installDateInvalid || saleDateInvalid) return;
    setSaving(true);
    setError(null);
    try {
      const patch: DealDetailsInput = {
        firstName,
        lastName,
        phone,
        address,
        notes,
        // The date the sale counts against. Editable here because a deal logged days
        // late was stamped with the day it was typed in, and that single wrong field
        // throws off today's count, the streak, pace, best day and every override total
        // downstream. This is how existing records get corrected.
        date: saleDate,
        scheduledInstallDate: installDate,
      };
      // Keep the display name in step with the parts, so the deal list and the follow-up
      // reminders both have something to call this customer.
      const combined = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
      if (combined) patch.customerName = combined;
      await updateDealDetails(deal.id, patch);
      onDone();
    } catch (err: any) {
      setError(err?.message ?? 'Could not save those changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="First name" value={firstName} onChange={setFirstName} placeholder="Jane" />
        </View>
        <View style={styles.half}>
          <Field label="Last name" value={lastName} onChange={setLastName} placeholder="Doe" />
        </View>
      </View>

      <SaleDateField value={saleDate} onChange={setSaleDate} label="Sale date" />

      <Field label="Phone" value={phone} onChange={setPhone} placeholder="(555) 123-4567" keyboardType="phone-pad" />
      <Field label="Address" value={address} onChange={setAddress} placeholder="123 Main St" />
      <Field
        label="Install date"
        value={installDate}
        onChange={setInstallDate}
        placeholder="YYYY-MM-DD"
        error={installDateInvalid ? 'Use YYYY-MM-DD, e.g. 2026-08-14.' : undefined}
      />
      <Text style={styles.installHint}>
        Setting this turns on the reminders: one when the install date passes, one the Friday
        after to check the pay landed.
      </Text>
      <Field label="Notes" value={notes} onChange={setNotes} placeholder="Gate code, dog, best time to call…" multiline />

      {!!error && (
        <Banner message={error} />
      )}

      <View style={styles.buttons}>
        <Pressable onPress={onDone} style={styles.ghostButton} disabled={saving}>
          <Text style={styles.ghostButtonText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={save}
          style={[styles.solidButton, installDateInvalid && styles.solidButtonDisabled]}
          disabled={saving || installDateInvalid}
        >
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
  wrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
  field: { marginBottom: spacing.sm },
  fieldLabel: { ...typography.eyebrow, fontSize: 10, color: colors.textMuted, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 14,
  },
  inputMultiline: { minHeight: 64, textAlignVertical: 'top' },
  inputError: { borderColor: colors.dangerBorder },
  fieldError: { ...typography.caption, fontSize: 11, color: colors.dangerText, marginTop: 2 },
  installHint: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textFaint,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.xs },
  ghostButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  ghostButtonText: { ...typography.caption, color: colors.textMuted, fontWeight: '700' },
  solidButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    minWidth: 84,
    alignItems: 'center',
  },
  solidButtonDisabled: { opacity: 0.5 },
  solidButtonText: { color: colors.onPrimary, fontSize: 13, fontWeight: '700' },
});
