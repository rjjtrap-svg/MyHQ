import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useDealsStore } from '@/src/store/dealsStore';
import { syncDailyReminder } from '@/src/lib/notifications';
import { generateId } from '@/src/lib/id';
import { formatClock } from '@/src/lib/dates';
import { Section } from '@/src/components/Section';
import { colors, radius, spacing, typography } from '@/src/theme';
import { firebaseEnabled } from '@/src/firebase/config';

function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
}) {
  const [text, setText] = useState(String(value));

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.numberRow}>
        <TextInput
          style={styles.numberInput}
          keyboardType="number-pad"
          value={text}
          onChangeText={setText}
          onBlur={() => {
            const n = Number(text);
            if (Number.isFinite(n) && n >= 0) {
              onChange(n);
            } else {
              setText(String(value));
            }
          }}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={text}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textFaint}
        onChangeText={setText}
        onBlur={() => {
          if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
            onChange(text);
          } else {
            setText(value);
            Alert.alert('Invalid date', 'Use the format YYYY-MM-DD.');
          }
        }}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const deals = useDealsStore((s) => s.deals);

  function addNotificationTime() {
    const notificationTimes = [
      ...settings.notificationTimes,
      { id: generateId(), hour: 9, minute: 0, enabled: true },
    ];
    updateSettings({ notificationTimes });
    syncDailyReminder({ ...settings, notificationTimes }, deals);
  }

  function removeNotificationTime(id: string) {
    const notificationTimes = settings.notificationTimes.filter((t) => t.id !== id);
    updateSettings({ notificationTimes });
    syncDailyReminder({ ...settings, notificationTimes }, deals);
  }

  function toggleNotificationTime(id: string, enabled: boolean) {
    const notificationTimes = settings.notificationTimes.map((t) => (t.id === id ? { ...t, enabled } : t));
    updateSettings({ notificationTimes });
    syncDailyReminder({ ...settings, notificationTimes }, deals);
  }

  async function toggleNotificationsEnabled(enabled: boolean) {
    updateSettings({ notificationsEnabled: enabled });
    await syncDailyReminder({ ...settings, notificationsEnabled: enabled }, deals);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Settings</Text>

        {!firebaseEnabled && (
          <View style={styles.notice}>
            <FontAwesome name="cloud" size={14} color={colors.textMuted} />
            <Text style={styles.noticeText}>
              Cloud sync isn't configured yet — everything is saved on this device. See the README to add Firebase.
            </Text>
          </View>
        )}

        <Section title="Goals">
          <NumberField label="Sales goal" value={settings.salesGoal} onChange={(n) => updateSettings({ salesGoal: n })} />
          <NumberField label="Install goal" value={settings.installGoal} onChange={(n) => updateSettings({ installGoal: n })} />
          <NumberField
            label="Retention"
            value={settings.retentionPercent}
            onChange={(n) => updateSettings({ retentionPercent: n })}
            suffix="%"
          />
          <NumberField
            label="Daily target"
            value={settings.dailyTarget}
            onChange={(n) => updateSettings({ dailyTarget: n })}
            suffix="/ day"
          />
        </Section>

        <Section title="Timeline">
          <DateField label="Start date" value={settings.startDate} onChange={(v) => updateSettings({ startDate: v })} />
          <DateField label="Deadline" value={settings.deadline} onChange={(v) => updateSettings({ deadline: v })} />
        </Section>

        <Section
          title="Notifications"
          right={
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={toggleNotificationsEnabled}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          }
        >
          {settings.notificationTimes.map((t) => (
            <View key={t.id} style={styles.timeRow}>
              <Switch
                value={t.enabled}
                onValueChange={(v) => toggleNotificationTime(t.id, v)}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
              <Text style={styles.timeText}>{formatClock(t.hour, t.minute)}</Text>
              <Pressable onPress={() => removeNotificationTime(t.id)} hitSlop={10}>
                <FontAwesome name="trash" size={16} color={colors.textFaint} />
              </Pressable>
            </View>
          ))}
          <Pressable style={styles.addTimeButton} onPress={addNotificationTime}>
            <FontAwesome name="plus" size={12} color={colors.primary} />
            <Text style={styles.addTimeText}>Add reminder time</Text>
          </Pressable>
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
    marginBottom: spacing.lg,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
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
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  numberInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: 15,
    minWidth: 90,
  },
  suffix: {
    color: colors.textFaint,
    fontSize: 13,
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
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timeText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  addTimeText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});
