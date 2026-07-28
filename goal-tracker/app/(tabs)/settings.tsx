import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useDealsStore } from '@/src/store/dealsStore';
import { useAuthStore } from '@/src/store/authStore';
import { useTeamStore } from '@/src/store/teamStore';
import { signOutUser } from '@/src/firebase/auth';
import { updateMemberRole, assignOverseer } from '@/src/firebase/teams';
import { syncDailyReminder } from '@/src/lib/notifications';
import { getWebPushPermission, isWebPushSupported, requestWebPushPermission } from '@/src/lib/push';
import { generateId } from '@/src/lib/id';
import { formatClock } from '@/src/lib/dates';
import { confirmAction, notify } from '@/src/lib/dialogs';
import { Section } from '@/src/components/Section';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { fonts, colors, layout, radius, spacing, typography } from '@/src/theme';
import { firebaseEnabled } from '@/src/firebase/config';
import { Membership, Role } from '@/src/types';

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
            notify('Invalid date', 'Use the format YYYY-MM-DD.');
          }
        }}
      />
    </View>
  );
}

const ROLE_LABELS: Record<Role, string> = { rep: 'Rep', team_lead: 'Team Lead', manager: 'Manager' };
const ROLE_ORDER: Role[] = ['rep', 'team_lead', 'manager'];

function RolePicker({
  value,
  onChange,
  disabled,
}: {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.rolePickerRow, disabled && { opacity: 0.4 }]}>
      {ROLE_ORDER.map((role) => (
        <Pressable
          key={role}
          style={[styles.rolePill, value === role && styles.rolePillActive]}
          onPress={() => !disabled && onChange(role)}
          disabled={disabled}
        >
          <Text style={[styles.rolePillText, value === role && styles.rolePillTextActive]}>{ROLE_LABELS[role]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function MemberManagementRow({
  member,
  myUid,
  teamLeads,
  busy,
  onChangeRole,
  onChangeOverseer,
}: {
  member: Membership;
  myUid?: string;
  teamLeads: Membership[];
  busy: boolean;
  onChangeRole: (uid: string, role: Role) => void;
  onChangeOverseer: (uid: string, overseerUid: string | null) => void;
}) {
  const isSelf = member.uid === myUid;
  return (
    <View style={styles.memberRow}>
      <Text style={styles.memberName}>
        {member.displayName}
        {isSelf ? ' (you)' : ''}
      </Text>
      <RolePicker
        value={member.role}
        onChange={(role) => onChangeRole(member.uid, role)}
        disabled={isSelf || busy}
      />
      {member.role === 'rep' && teamLeads.length > 0 && (
        <View style={styles.overseerBlock}>
          <Text style={styles.overseerLabel}>Oversees</Text>
          <View style={styles.overseerChipRow}>
            <Pressable
              style={[styles.overseerChip, !member.overseerUid && styles.overseerChipActive]}
              onPress={() => onChangeOverseer(member.uid, null)}
              disabled={busy}
            >
              <Text style={[styles.overseerChipText, !member.overseerUid && styles.overseerChipTextActive]}>
                None
              </Text>
            </Pressable>
            {teamLeads.map((lead) => (
              <Pressable
                key={lead.uid}
                style={[styles.overseerChip, member.overseerUid === lead.uid && styles.overseerChipActive]}
                onPress={() => onChangeOverseer(member.uid, lead.uid)}
                disabled={busy}
              >
                <Text
                  style={[
                    styles.overseerChipText,
                    member.overseerUid === lead.uid && styles.overseerChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {lead.displayName}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const deals = useDealsStore((s) => s.deals);
  const profile = useAuthStore((s) => s.profile);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const router = useRouter();
  const isManager = profile?.role === 'manager';
  const team = useTeamStore((s) => s.team);
  const members = useTeamStore((s) => s.members);
  const updateTeamGoal = useTeamStore((s) => s.updateGoal);
  const regenerateCode = useTeamStore((s) => s.regenerateCode);
  const [regenerating, setRegenerating] = useState(false);
  const [memberBusyUid, setMemberBusyUid] = useState<string | null>(null);
  const [pushPermission, setPushPermission] = useState(getWebPushPermission());
  const [pushBusy, setPushBusy] = useState(false);

  const teamLeads = members.filter((m) => m.role === 'team_lead');

  async function handleChangeRole(uid: string, role: Role) {
    if (!team) return;
    setMemberBusyUid(uid);
    try {
      await updateMemberRole(team.id, uid, role);
    } catch (err: any) {
      notify('Couldn’t change role', err?.message ?? 'Try again.');
    } finally {
      setMemberBusyUid(null);
    }
  }

  async function handleChangeOverseer(uid: string, overseerUid: string | null) {
    if (!team) return;
    setMemberBusyUid(uid);
    try {
      await assignOverseer(team.id, uid, overseerUid);
    } catch (err: any) {
      notify('Couldn’t assign team lead', err?.message ?? 'Try again.');
    } finally {
      setMemberBusyUid(null);
    }
  }

  async function handleEnablePush() {
    if (!firebaseUser || !team) return;
    setPushBusy(true);
    try {
      const granted = await requestWebPushPermission(firebaseUser.uid, team.id);
      setPushPermission(getWebPushPermission());
      if (!granted) {
        notify(
          'Notifications not enabled',
          "Your browser didn't grant permission. On iPhone/iPad, this only works if you've added the app to your Home Screen first."
        );
      }
    } finally {
      setPushBusy(false);
    }
  }

  async function copyInviteCode() {
    if (!team) return;
    await Clipboard.setStringAsync(team.inviteCode);
    notify('Copied', `Invite code ${team.inviteCode} copied to clipboard.`);
  }

  async function handleRegenerateCode() {
    setRegenerating(true);
    try {
      await regenerateCode();
    } catch (err: any) {
      notify('Couldn’t regenerate code', err?.message ?? 'Try again.');
    } finally {
      setRegenerating(false);
    }
  }

  async function handleSignOut() {
    // Was Alert.alert, which renders nothing on web — the confirm never appeared, so the
    // sign-out callback never ran and the button looked broken.
    if (await confirmAction('Sign out', 'Are you sure you want to sign out?', 'Sign out')) {
      await signOutUser();
    }
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

  async function toggleDealLogReminder(enabled: boolean) {
    updateSettings({ dealLogReminderEnabled: enabled });
    await syncDailyReminder({ ...settings, dealLogReminderEnabled: enabled }, deals);
  }

  async function setDealLogReminderTime(hour: number, minute: number) {
    updateSettings({ dealLogReminderHour: hour, dealLogReminderMinute: minute });
    await syncDailyReminder({ ...settings, dealLogReminderHour: hour, dealLogReminderMinute: minute }, deals);
  }

  async function handleCompanyChange(company: string) {
    await updateTeamGoal({ company });
  }

  async function toggleAutoFillDisabled(autoFillDisabled: boolean) {
    await updateTeamGoal({ autoFillDisabled });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader eyebrow="Your setup" title="Settings" />

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
              <Text style={styles.teamRole}>{profile ? ROLE_LABELS[profile.role] : ''}</Text>
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
                {/* The three fields below carry their own labels — a group heading in the
                    same eyebrow style just read as a duplicated label above the first one. */}
                <Text style={styles.groupNote}>These show on the Team tab for everyone.</Text>
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

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Company</Text>
                  <TextInput
                    style={styles.input}
                    defaultValue={team.company ?? ''}
                    placeholder="e.g. Cityside"
                    placeholderTextColor={colors.textFaint}
                    onEndEditing={(e) => handleCompanyChange(e.nativeEvent.text)}
                  />
                </View>
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>Skip photo auto-fill</Text>
                    <Text style={styles.switchHint}>
                      Turn on if this company's confirmation screen never shows customer info —
                      Add Deal goes straight to manual entry instead of waiting on a scan.
                    </Text>
                  </View>
                  <Switch
                    value={!!team.autoFillDisabled}
                    onValueChange={toggleAutoFillDisabled}
                    trackColor={{ true: colors.primary, false: colors.border }}
                  />
                </View>
              </View>
            )}
          </Section>
        )}

        {/* A team_lead can see their own book but not set rates — the rules make writes
            manager-only, so showing them an editor they can't use would just fail. */}
        {(isManager || profile?.role === 'team_lead') && team && (
          <Section title="Overrides">
            <Pressable style={styles.overrideLink} onPress={() => router.push('/overrides')}>
              <View style={styles.overrideText}>
                <Text style={styles.overrideTitle}>Override earnings</Text>
                <Text style={styles.overrideHint}>
                  {isManager
                    ? 'Set what each rep earns you per deal'
                    : 'What your reps earn you per deal'}
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color={colors.accent} />
            </Pressable>
          </Section>
        )}

        {isManager && team && (
          <Section title="Team Members">
            {members.map((member) => (
              <MemberManagementRow
                key={member.uid}
                member={member}
                myUid={firebaseUser?.uid}
                teamLeads={teamLeads}
                busy={memberBusyUid === member.uid}
                onChangeRole={handleChangeRole}
                onChangeOverseer={handleChangeOverseer}
              />
            ))}
          </Section>
        )}

        <Section title="My Personal Goal">
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

        <Section
          title="Log Your Deals Reminder"
          right={
            <Switch
              value={settings.dealLogReminderEnabled}
              onValueChange={toggleDealLogReminder}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          }
        >
          <Text style={styles.rangeLabel}>A simple end-of-day nudge if you haven't logged anything.</Text>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatClock(settings.dealLogReminderHour, settings.dealLogReminderMinute)}</Text>
            <Pressable
              style={styles.stepperButton}
              onPress={() =>
                setDealLogReminderTime((settings.dealLogReminderHour + 23) % 24, settings.dealLogReminderMinute)
              }
            >
              <FontAwesome name="minus" size={12} color={colors.primary} />
            </Pressable>
            <Pressable
              style={styles.stepperButton}
              onPress={() =>
                setDealLogReminderTime((settings.dealLogReminderHour + 1) % 24, settings.dealLogReminderMinute)
              }
            >
              <FontAwesome name="plus" size={12} color={colors.primary} />
            </Pressable>
          </View>
        </Section>

        {isWebPushSupported() && (
          <Section title="Push Notifications">
            <Text style={styles.rangeLabel}>
              Get a push alert when anyone on the team hits 2, 6, 8, or 10 sales in a day.
            </Text>
            <Text style={styles.rangeLabel}>
              On iPhone/iPad: add this app to your Home Screen first (Share → Add to Home
              Screen) — regular Safari tabs can't receive push notifications on iOS.
            </Text>
            {pushPermission === 'granted' ? (
              <View style={styles.pushEnabledRow}>
                <FontAwesome name="check-circle" size={14} color={colors.success} />
                <Text style={styles.pushEnabledText}>Notifications enabled</Text>
              </View>
            ) : pushPermission === 'denied' ? (
              <Text style={styles.rangeLabel}>
                Notifications are blocked in your browser settings for this site.
              </Text>
            ) : (
              <Pressable
                style={[styles.addTimeButton, pushBusy && { opacity: 0.5 }]}
                onPress={handleEnablePush}
                disabled={pushBusy}
              >
                <FontAwesome name="bell" size={12} color={colors.primary} />
                <Text style={styles.addTimeText}>{pushBusy ? 'Requesting…' : 'Enable notifications'}</Text>
              </Pressable>
            )}
          </Section>
        )}

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
  overrideLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  overrideText: { flex: 1 },
  overrideTitle: { ...typography.subtitle, color: colors.text },
  overrideHint: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
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
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.textMuted,
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
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.gold,
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
    fontFamily: fonts.sansHeavy,
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
  groupNote: {
    ...typography.caption,
    color: colors.textFaint,
    marginBottom: spacing.sm,
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
    fontFamily: fonts.sansBold,
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
    fontFamily: fonts.sansSemiBold,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  addTimeText: {
    color: colors.primary,
    fontFamily: fonts.sansBold,
    fontSize: 13,
  },
  rangeLabel: {
    ...typography.caption,
    color: colors.textFaint,
    marginBottom: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  switchLabel: {
    ...typography.subtitle,
    fontSize: 14,
    color: colors.text,
  },
  switchHint: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: 2,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pushEnabledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pushEnabledText: {
    ...typography.caption,
    color: colors.success,
    fontFamily: fonts.sansBold,
  },
  memberRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  memberName: {
    ...typography.subtitle,
    fontSize: 15,
    color: colors.text,
  },
  rolePickerRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    gap: 3,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  rolePillActive: {
    backgroundColor: colors.primaryMuted,
  },
  rolePillText: {
    color: colors.textMuted,
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
  },
  rolePillTextActive: {
    color: colors.primary,
  },
  overseerBlock: {
    marginTop: spacing.xs,
  },
  overseerLabel: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.textFaint,
    marginBottom: spacing.xs,
  },
  overseerChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  overseerChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    maxWidth: 140,
  },
  overseerChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  overseerChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.sansSemiBold,
  },
  overseerChipTextActive: {
    color: colors.primary,
  },
});
