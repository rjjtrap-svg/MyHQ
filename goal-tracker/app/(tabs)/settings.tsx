import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useDealsStore } from '@/src/store/dealsStore';
import { useAuthStore } from '@/src/store/authStore';
import { useTeamStore } from '@/src/store/teamStore';
import { signOutUser } from '@/src/firebase/auth';
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
  const profile = useAuthStore((s) => s.profile);
  const isManager = profile?.role === 'manager';
  const team = useTeamStore((s) => s.team);
  const updateTeamGoal = useTeamStore((s) => s.updateGoal);
  const regenerateCode = useTeamStore((s) => s.regenerateCode);
  const [regenerating, setRegenerating] = useState(false);

  async function copyInviteCode() {
    if (!team) return;
    await Clipboard.setStringAsync(team.inviteCode);
    Alert.alert('Copied', `Invite code ${team.inviteCode} copied to clipboard.`);
  }

  async function handleRegenerateCode() {
    setRegenerating(true);
    try {
      await regenerateCode();
    } catch (err: any) {
      Alert.alert('Couldn’t regenerate code', err?.message ?? 'Try again.');
    } finally {
      setRegenerating(false);
    }
  }

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOutUser() },
    ]);
  }

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

        {team && (
          <Section title="Team">
            <View style={styles.teamRow}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamRole}>{isManager ? 'Manager' : 'Rep'}</Text>
            </View>

            <Text style={styles.fieldLabel}>Invite code</Text>
            <View style={styles.inviteRow}>
              <Pressable style={styles.inviteCodeBox} onPress={copyInviteCode}>
                <Text style={styles.inviteCodeText}>{team.inviteCode}</Text>
                <FontAwesome name="copy" size={14} color={colors.textMuted} />
              </Pressable>
              {isManager && (
                <Pressable
                  style={[styles.regenButton, regenerating && { opacity: 0.5 }]}
                  onPress={handleRegenerateCode}
                  disabled={regenerating}
                >
                  <FontAwesome name="refresh" size={13} color={colors.primary} />
                </Pressable>
              )}
            </View>
            <Text style={styles.inviteHint}>
              Share this code — new reps enter it when they sign up to join {team.name}.
            </Text>

            {isManager && (
              <View style={styles.teamGoalsBlock}>
                <Text style={styles.fieldLabel}>Team goal (shown on the Team tab)</Text>
                <NumberField
                  label="Team sales goal"
                  value={team.salesGoal}
                  onChange={(n) => updateTeamGoal({ salesGoal: n })}
                />
                <NumberField
                  label="Team install goal"
                  value={team.installGoal}
                  onChange={(n) => updateTeamGoal({ installGoal: n })}
                />
                <DateField label="Team deadline" value={team.deadline} onChange={(v) => updateTeamGoal({ deadline: v })} />
              </View>
            )}
          </Section>
        )}

        <Section title="My personal goal">
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

        {profile && (
          <Section title="Account">
            <Text style={styles.accountName}>{profile.displayName}</Text>
            <Text style={styles.accountEmail}>{profile.email}</Text>
            <Pressable style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </Section>
        )}
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
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  teamName: {
    ...typography.subtitle,
    color: colors.text,
  },
  teamRole: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inviteCodeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  inviteCodeText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  regenButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteHint: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: spacing.xs,
  },
  teamGoalsBlock: {
    marginTop: spacing.lg,
  },
  accountName: {
    ...typography.subtitle,
    color: colors.text,
  },
  accountEmail: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  signOutText: {
    color: colors.danger,
    fontWeight: '700',
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
