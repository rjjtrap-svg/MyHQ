import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/src/store/authStore';
import { useTeamStore } from '@/src/store/teamStore';
import { useDealsStore } from '@/src/store/dealsStore';
import { useCommissionStore } from '@/src/store/commissionStore';
import { useDoorKnocksStore } from '@/src/store/doorKnocksStore';
import { usePitchCoachStore } from '@/src/store/pitchCoachStore';
import { useGoalStats } from '@/src/hooks/useGoalStats';
import { MAX_BIO_LENGTH, updateMyProfile, uploadProfilePhoto } from '@/src/firebase/profile';
import { computeProfileStats, recentMonthlySales } from '@/src/lib/profileStats';
import { BADGES, BADGE_GROUP_LABELS, BadgeContext, BadgeDef } from '@/src/lib/badges';
import { BadgePatch } from '@/src/components/BadgePatch';
import { Section } from '@/src/components/Section';
import { WaveRule } from '@/src/components/WaveRule';
import { StreakFlame } from '@/src/components/StreakFlame';
import { parseISODate, shortDateLabel } from '@/src/lib/dates';
import { colors, radius, spacing, typography } from '@/src/theme';

function money(n: number): string {
  if (!n) return '$0';
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

function pct(n: number): string {
  return `${n.toFixed(1)}%`;
}

/** A single scoreboard line: serif numeral on the left, caps label under it. */
function ScoreTile({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <View style={styles.scoreTile}>
      <Text style={styles.scoreValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <View style={styles.scoreRule} />
      <Text style={styles.scoreLabel}>{label}</Text>
      {sub ? <Text style={styles.scoreSub}>{sub}</Text> : null}
    </View>
  );
}

/** Direction arrow + delta, for the trend rows. */
function TrendRow({ label, now, before, format }: { label: string; now: number; before: number; format: (n: number) => string }) {
  const delta = now - before;
  const flat = Math.abs(delta) < 0.05;
  const color = flat ? colors.textMuted : delta > 0 ? colors.ahead : colors.behind;
  const icon = flat ? 'minus' : delta > 0 ? 'arrow-up' : 'arrow-down';
  return (
    <View style={styles.trendRow}>
      <Text style={styles.trendLabel}>{label}</Text>
      <Text style={styles.trendNow}>{format(now)}</Text>
      <View style={styles.trendDelta}>
        <FontAwesome name={icon} size={10} color={color} />
        <Text style={[styles.trendDeltaText, { color }]}>
          {flat ? 'flat' : `${format(Math.abs(delta))} vs. prior`}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const profile = useAuthStore((s) => s.profile);
  const teamId = useTeamStore((s) => s.teamId);
  const members = useTeamStore((s) => s.members);
  const deals = useDealsStore((s) => s.deals);
  const commissionsByDealId = useCommissionStore((s) => s.byDealId);
  const knocksByDate = useDoorKnocksStore((s) => s.byDate);
  const submissions = usePitchCoachStore((s) => s.submissions);
  const { stats } = useGoalStats();

  const uid = firebaseUser?.uid;
  const me = members.find((m) => m.uid === uid);

  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myDeals = useMemo(() => deals.filter((d) => d.repUid === uid && !d.deletedAt), [deals, uid]);
  const myCommissions = useMemo(
    () => Object.values(commissionsByDealId).filter((c) => c.repUid === uid),
    [commissionsByDealId, uid]
  );
  const ps = useMemo(
    () => computeProfileStats(myDeals, myCommissions, knocksByDate),
    [myDeals, myCommissions, knocksByDate]
  );
  const monthly = useMemo(() => recentMonthlySales(myDeals, 6), [myDeals]);

  const gradedPitches = submissions.filter((s) => s.status === 'done');
  const badgeContext: BadgeContext = {
    totalKnocks: ps.totalKnocks,
    totalSales: ps.totalSales,
    bestDaySales: ps.bestDay?.count ?? 0,
    bestWeekSales: ps.bestWeek?.count ?? 0,
    longestStreak: stats.longestStreak,
    closeRate: ps.closeRate,
    gradedPitches: gradedPitches.length,
    bestPitchGrade: gradedPitches.reduce((max, s) => Math.max(max, s.grade ?? 0), 0),
  };

  const byGroup = useMemo(() => {
    const groups: Record<string, BadgeDef[]> = {};
    for (const b of BADGES) {
      (groups[b.group] ??= []).push(b);
    }
    return groups;
  }, []);

  const earnedCount = BADGES.filter((b) => b.progress(badgeContext) >= 1).length;
  const maxMonth = Math.max(1, ...monthly.map((m) => m.count));

  async function saveBio() {
    if (!teamId || !uid) return;
    setSaving(true);
    setError(null);
    try {
      await updateMyProfile(teamId, uid, { bio: bioDraft.trim().slice(0, MAX_BIO_LENGTH) });
      setEditingBio(false);
    } catch (err: any) {
      setError(err?.message ?? 'Could not save your bio.');
    } finally {
      setSaving(false);
    }
  }

  async function pickPhoto() {
    if (!teamId || !uid) return;
    setError(null);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError('Allow photo access to set a profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled) return;
      setUploading(true);
      const photoUrl = await uploadProfilePhoto(teamId, uid, result.assets[0].uri);
      await updateMyProfile(teamId, uid, { photoUrl });
    } catch (err: any) {
      setError(err?.message ?? 'Could not update your picture.');
    } finally {
      setUploading(false);
    }
  }

  const roleLabel =
    profile?.role === 'manager' ? 'Manager' : profile?.role === 'team_lead' ? 'Team Lead' : 'Rep';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* --- Identity card --- */}
        <View style={styles.card}>
          <View style={styles.identityRow}>
            <Pressable onPress={pickPhoto} style={styles.avatarWrap} disabled={uploading}>
              {me?.photoUrl ? (
                <Image source={{ uri: me.photoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarEmpty]}>
                  <FontAwesome name="user" size={30} color={colors.textFaint} />
                </View>
              )}
              <View style={styles.avatarBadge}>
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <FontAwesome name="camera" size={11} color={colors.background} />
                )}
              </View>
            </Pressable>

            <View style={styles.identityText}>
              <Text style={styles.roleTag}>{roleLabel}</Text>
              <Text style={styles.name}>{profile?.displayName ?? 'You'}</Text>
              <View style={styles.identityMeta}>
                <StreakFlame streak={stats.currentStreak} />
              </View>
            </View>
          </View>

          <WaveRule style={styles.cardWave} color={colors.border} />

          {editingBio ? (
            <View style={styles.bioEditor}>
              <TextInput
                style={styles.bioInput}
                value={bioDraft}
                onChangeText={setBioDraft}
                placeholder="A line about you — where you knock, what you're chasing."
                placeholderTextColor={colors.textFaint}
                multiline
                maxLength={MAX_BIO_LENGTH}
              />
              <View style={styles.bioButtons}>
                <Text style={styles.bioCount}>
                  {MAX_BIO_LENGTH - bioDraft.length} left
                </Text>
                <Pressable onPress={() => setEditingBio(false)} style={styles.ghostButton} disabled={saving}>
                  <Text style={styles.ghostButtonText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={saveBio} style={styles.solidButton} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Text style={styles.solidButtonText}>Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setBioDraft(me?.bio ?? '');
                setEditingBio(true);
              }}
            >
              <Text style={me?.bio ? styles.bio : styles.bioEmpty}>
                {me?.bio || 'Add a short bio — your teammates can see it. Tap to write one.'}
              </Text>
            </Pressable>
          )}

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}
        </View>

        {/* --- Career line --- */}
        <Section title="Career">
          <View style={styles.scoreGrid}>
            <ScoreTile value={String(ps.totalSales)} label="Total sales" />
            <ScoreTile value={ps.totalKnocks.toLocaleString('en-US')} label="Doors knocked" />
            <ScoreTile value={pct(ps.closeRate)} label="Close rate" sub="Sales ÷ doors" />
            <ScoreTile value={money(ps.totalEarned)} label="Total earned" />
          </View>
        </Section>

        {/* --- Personal bests --- */}
        <Section title="Personal Bests">
          <View style={styles.scoreGrid}>
            <ScoreTile
              value={String(ps.bestDay?.count ?? 0)}
              label="Best day"
              sub={ps.bestDay ? shortDateLabel(parseISODate(ps.bestDay.date)) : 'Not yet'}
            />
            <ScoreTile
              value={String(ps.bestWeek?.count ?? 0)}
              label="Best week"
              sub={ps.bestWeek ? `Week of ${shortDateLabel(parseISODate(ps.bestWeek.weekStart))}` : 'Not yet'}
            />
            <ScoreTile
              value={String(ps.bestMonth?.count ?? 0)}
              label="Best month"
              sub={ps.bestMonth?.label ?? 'Not yet'}
            />
            <ScoreTile value={String(stats.longestStreak)} label="Longest streak" sub="Days in a row" />
            <ScoreTile value={money(ps.biggestPaycheck)} label="Biggest paycheck" sub="One deal" />
            <ScoreTile
              value={money(ps.biggestCommissionDay?.amount ?? 0)}
              label="Biggest day"
              sub={
                ps.biggestCommissionDay
                  ? shortDateLabel(parseISODate(ps.biggestCommissionDay.date))
                  : 'Not yet'
              }
            />
          </View>

          <View style={styles.projectionCard}>
            <Text style={styles.projectionEyebrow}>Projected this quarter</Text>
            <Text style={styles.projectionValue}>{money(ps.quarterlyProjectedEarnings)}</Text>
            <Text style={styles.projectionSub}>
              {money(ps.quarterEarnedSoFar)} banked so far, at your current pace.
            </Text>
          </View>
        </Section>

        {/* --- Trends --- */}
        <Section title="Trends">
          <View style={styles.card}>
            <TrendRow label="Sales, last 7 days" now={ps.last7} before={ps.prev7} format={(n) => String(Math.round(n))} />
            <View style={styles.hairline} />
            <TrendRow label="Sales, last 30 days" now={ps.last30} before={ps.prev30} format={(n) => String(Math.round(n))} />
            <View style={styles.hairline} />
            <TrendRow
              label="Close rate, last 30 days"
              now={ps.closeRateLast30}
              before={ps.closeRatePrev30}
              format={(n) => `${n.toFixed(1)}%`}
            />
            <View style={styles.hairline} />
            <View style={styles.trendRow}>
              <Text style={styles.trendLabel}>Favorite knocking day</Text>
              <Text style={styles.trendNow}>{ps.favoriteKnockingDay?.day ?? '—'}</Text>
              <View style={styles.trendDelta}>
                <Text style={styles.trendDeltaText}>
                  {ps.favoriteKnockingDay
                    ? `${ps.favoriteKnockingDay.knocks.toLocaleString('en-US')} doors`
                    : 'Log some knocks'}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.card, styles.sparkCard]}>
            <Text style={styles.sparkTitle}>Last 6 months</Text>
            <View style={styles.sparkRow}>
              {monthly.map((m) => (
                <View key={m.label} style={styles.sparkCol}>
                  <Text style={styles.sparkCount}>{m.count}</Text>
                  <View style={styles.sparkTrack}>
                    <View style={[styles.sparkFill, { height: `${(m.count / maxMonth) * 100}%` }]} />
                  </View>
                  <Text style={styles.sparkLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </Section>

        {/* --- Badges --- */}
        <Section title="Patches" right={<Text style={styles.badgeCount}>{earnedCount}/{BADGES.length}</Text>}>
          {(Object.keys(byGroup) as BadgeDef['group'][]).map((group) => (
            <View key={group} style={styles.badgeGroup}>
              <Text style={styles.badgeGroupLabel}>{BADGE_GROUP_LABELS[group]}</Text>
              <View style={styles.badgeRow}>
                {byGroup[group].map((b) => (
                  <BadgePatch key={b.id} badge={b} progress={b.progress(badgeContext)} />
                ))}
              </View>
            </View>
          ))}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, paddingTop: spacing.md },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.surfaceElevated,
  },
  avatarEmpty: { alignItems: 'center', justifyContent: 'center' },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: { flex: 1, gap: 2 },
  roleTag: { ...typography.eyebrow, color: colors.gold },
  name: { ...typography.title, fontSize: 26, color: colors.text },
  identityMeta: { flexDirection: 'row', marginTop: spacing.xs },
  cardWave: { marginVertical: spacing.md, opacity: 0.8 },
  bio: { ...typography.body, color: colors.textMuted, lineHeight: 21 },
  bioEmpty: { ...typography.body, color: colors.textFaint, fontStyle: 'italic', lineHeight: 21 },
  bioEditor: { gap: spacing.sm },
  bioInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 2,
    color: colors.text,
    fontSize: 15,
    minHeight: 76,
    textAlignVertical: 'top',
  },
  bioButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.sm },
  bioCount: { ...typography.caption, color: colors.textFaint, marginRight: 'auto' },
  ghostButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  ghostButtonText: { ...typography.caption, color: colors.textMuted, fontWeight: '700' },
  solidButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    minWidth: 76,
    alignItems: 'center',
  },
  solidButtonText: { color: colors.background, fontSize: 13, fontWeight: '700' },

  scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  scoreTile: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  scoreValue: { ...typography.scoreValue, color: colors.text },
  scoreRule: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  scoreLabel: { ...typography.eyebrow, fontSize: 10, color: colors.textMuted },
  scoreSub: { ...typography.caption, fontSize: 11, color: colors.textFaint, marginTop: 2 },

  projectionCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xs,
  },
  projectionEyebrow: { ...typography.eyebrow, color: colors.gold },
  projectionValue: {
    ...typography.scoreValue,
    fontSize: 42,
    color: colors.background,
    marginTop: spacing.xs,
  },
  projectionSub: { ...typography.caption, color: colors.primaryMuted, marginTop: spacing.xs },

  hairline: { height: 1, backgroundColor: colors.border },
  trendRow: { paddingVertical: spacing.sm + 2, gap: 2 },
  trendLabel: { ...typography.eyebrow, fontSize: 10, color: colors.textMuted },
  trendNow: { ...typography.scoreValue, fontSize: 26, color: colors.text },
  trendDelta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  trendDeltaText: { ...typography.caption, fontSize: 12, color: colors.textFaint },

  sparkCard: { paddingBottom: spacing.md },
  sparkTitle: { ...typography.eyebrow, fontSize: 10, color: colors.textMuted, marginBottom: spacing.md },
  sparkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130 },
  sparkCol: { flex: 1, alignItems: 'center', gap: spacing.xs },
  sparkCount: { ...typography.caption, fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  sparkTrack: {
    width: 20,
    height: 80,
    backgroundColor: colors.track,
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  sparkFill: { width: '100%', backgroundColor: colors.accent, borderRadius: radius.sm },
  sparkLabel: { ...typography.eyebrow, fontSize: 9, color: colors.textFaint },

  badgeCount: { ...typography.eyebrow, color: colors.gold },
  badgeGroup: { marginBottom: spacing.md },
  badgeGroupLabel: { ...typography.eyebrow, fontSize: 10, color: colors.textMuted, marginBottom: spacing.md },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  errorBanner: {
    backgroundColor: '#F3DCD5',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D9A68F',
    padding: spacing.sm + 2,
    marginTop: spacing.sm,
  },
  errorBannerText: { color: '#8A3324', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
