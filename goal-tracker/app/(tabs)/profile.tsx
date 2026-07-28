import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
import { ProfileBody, profileStyles } from '@/src/components/ProfileBody';
import { PersonalBestsEditor } from '@/src/components/PersonalBestsEditor';
import { WaveRule } from '@/src/components/WaveRule';
import { StreakFlame } from '@/src/components/StreakFlame';
import { Banner } from '@/src/components/Banner';
import { Screen } from '@/src/components/Screen';
import { colors, elevation, layout, radius, spacing, typography } from '@/src/theme';

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
  const [editingBests, setEditingBests] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myDeals = useMemo(() => deals.filter((d) => d.repUid === uid && !d.deletedAt), [deals, uid]);
  const myCommissions = useMemo(
    () => Object.values(commissionsByDealId).filter((c) => c.repUid === uid),
    [commissionsByDealId, uid]
  );

  const gradedPitches = submissions.filter((s) => s.status === 'done');

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
    <Screen testID="profile-screen" contentStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.identityRow}>
            <Pressable onPress={pickPhoto} style={styles.avatarWrap} disabled={uploading}>
              {me?.photoUrl ? (
                <Image source={{ uri: me.photoUrl }} style={profileStyles.avatar} />
              ) : (
                <View style={[profileStyles.avatar, profileStyles.avatarEmpty]}>
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
                <Text style={styles.bioCount}>{MAX_BIO_LENGTH - bioDraft.length} left</Text>
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
            <Banner message={error} />
          )}
        </View>

        {editingBests && teamId && uid ? (
          <PersonalBestsEditor
            teamId={teamId}
            uid={uid}
            initial={me?.bests}
            onDone={() => setEditingBests(false)}
          />
        ) : (
          <Pressable onPress={() => setEditingBests(true)} style={styles.editBestsRow}>
            <FontAwesome name="pencil" size={12} color={colors.accent} />
            <Text style={styles.editBestsText}>Edit my career numbers</Text>
          </Pressable>
        )}

        <ProfileBody
          deals={myDeals}
          commissions={myCommissions}
          knocksByDate={knocksByDate}
          longestStreak={stats.longestStreak}
          gradedPitches={gradedPitches.length}
          bestPitchGrade={gradedPitches.reduce((max, s) => Math.max(max, s.grade ?? 0), 0)}
          overrides={me?.bests}
        />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.md },

  card: {
    ...elevation.raised,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: layout.cardPadding,
    marginBottom: spacing.md,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarWrap: { position: 'relative' },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.brandSurface,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: { flex: 1, gap: 2 },
  roleTag: { ...typography.eyebrow, color: colors.gold },
  name: { ...typography.pageTitle, fontSize: 26, color: colors.text },
  identityMeta: { flexDirection: 'row', marginTop: spacing.xs },
  cardWave: { marginVertical: spacing.md, opacity: 0.8 },
  bio: { ...typography.body, color: colors.textMuted, lineHeight: 21 },
  bioEmpty: { ...typography.body, color: colors.textFaint, fontStyle: 'italic', lineHeight: 21 },
  bioEditor: { gap: spacing.sm },
  bioInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
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
  solidButtonText: { color: colors.onPrimary, fontSize: 13, fontWeight: '700' },

  editBestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  editBestsText: { ...typography.caption, color: colors.accent, fontWeight: '700' },

});
