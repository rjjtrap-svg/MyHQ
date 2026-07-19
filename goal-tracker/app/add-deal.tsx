import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useDealsStore } from '@/src/store/dealsStore';
import { colors, radius, spacing, typography } from '@/src/theme';
import { addDays, todayISO, toISODate } from '@/src/lib/dates';

export default function AddDealScreen() {
  const router = useRouter();
  const addDeal = useDealsStore((s) => s.addDeal);

  const [expanded, setExpanded] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [justAdded, setJustAdded] = useState(false);

  const yesterday = toISODate(addDays(new Date(), -1));

  function haptic() {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }

  function quickAdd() {
    addDeal({ date: todayISO() });
    haptic();
    setJustAdded(true);
    setTimeout(() => router.back(), 350);
  }

  function saveWithDetails() {
    addDeal({
      date,
      customerName: customerName || undefined,
      address: address || undefined,
      notes: notes || undefined,
    });
    haptic();
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Text style={styles.title}>Add Deal</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <FontAwesome name="close" size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable
            onPress={quickAdd}
            style={({ pressed }) => [
              styles.quickAddButton,
              pressed && { transform: [{ scale: 0.97 }] },
              justAdded && styles.quickAddButtonSuccess,
            ]}
          >
            <FontAwesome
              name={justAdded ? 'check' : 'plus'}
              size={40}
              color={colors.background}
            />
            <Text style={styles.quickAddLabel}>
              {justAdded ? 'Added!' : 'Tap to log one deal'}
            </Text>
          </Pressable>

          <Text style={styles.hint}>Counts instantly toward today's total. Add details below if you want.</Text>

          <Pressable style={styles.expandRow} onPress={() => setExpanded((v) => !v)}>
            <Text style={styles.expandText}>{expanded ? 'Hide details' : 'Add customer details'}</Text>
            <FontAwesome name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
          </Pressable>

          {expanded && (
            <View style={styles.form}>
              <View style={styles.dateRow}>
                <DateChip label="Today" active={date === todayISO()} onPress={() => setDate(todayISO())} />
                <DateChip label="Yesterday" active={date === yesterday} onPress={() => setDate(yesterday)} />
              </View>

              <Field label="Customer name">
                <TextInput
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Optional"
                  placeholderTextColor={colors.textFaint}
                  style={styles.input}
                />
              </Field>

              <Field label="Address">
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Optional"
                  placeholderTextColor={colors.textFaint}
                  style={styles.input}
                />
              </Field>

              <Field label="Notes">
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Optional"
                  placeholderTextColor={colors.textFaint}
                  style={[styles.input, styles.textArea]}
                  multiline
                />
              </Field>

              <Pressable style={styles.saveButton} onPress={saveWithDetails}>
                <Text style={styles.saveButtonText}>Save deal for {date}</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function DateChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  quickAddButton: {
    width: '100%',
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  quickAddButtonSuccess: {
    backgroundColor: colors.success,
  },
  quickAddLabel: {
    color: colors.background,
    fontWeight: '800',
    fontSize: 17,
  },
  hint: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  expandText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '600',
  },
  form: {
    width: '100%',
    marginTop: spacing.lg,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.primary,
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.statLabel,
    color: colors.textMuted,
    textTransform: 'uppercase',
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
});
