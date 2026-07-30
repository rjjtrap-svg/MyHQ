import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { useTeamStore } from '@/src/store/teamStore';
import { useDealsStore } from '@/src/store/dealsStore';
import { computeGoalStats } from '@/src/lib/stats';
import { useSettingsStore } from '@/src/store/settingsStore';
import { ProfileBody, profileStyles } from '@/src/components/ProfileBody';
import { StreakFlame } from '@/src/components/StreakFlame';
import { Screen } from '@/src/components/Screen';
import { fonts, colors, elevation, radius, spacing, typography } from '@/src/theme';

/**
 * A teammate's profile card. Deliberately hides commission — the Firestore rules don't let
 * a rep read someone else's commission docs anyway, so there is nothing to show and
 * pretending otherwise would just render a wall of $0.
 *
 * Door-knock counts are also per-rep private, so a teammate's close rate is shown from
 * whatever they chose to publish in their career numbers rather than from live knock data.
 */
export default function MemberProfileScreen() {
  const { uid: memberUid } = useLocalSearchParams<{ uid: string }>();
  const router = useRouter();

  const myUid = useAuthStore((s) => s.firebaseUser?.uid);
  const members = useTeamStore((s) => s.members);
  const deals = useDealsStore((s) => s.deals);
  const settings = useSettingsStore((s) => s.settings);

  const member = members.find((m) => m.uid === memberUid);

  const theirDeals = useMemo(
    () => deals.filter((d) => d.repUid === memberUid && !d.deletedAt),
    [deals, memberUid]
  );
  const theirStats = useMemo(() => computeGoalStats(theirDeals, settings), [theirDeals, settings]);

  const roleLabel =
    member?.role === 'manager' ? 'Manager' : member?.role === 'team_lead' ? 'Team Lead' : 'Rep';

  if (!member) {
    return (
      <Screen testID="member-screen" contentStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <FontAwesome name="chevron-left" size={13} color={colors.accent} />
          <Text style={styles.backText}>Team</Text>
        </Pressable>
        <Text style={styles.missing}>That teammate isn't on this team anymore.</Text>
      </Screen>
    );
  }

  return (
    <Screen testID="member-screen" contentStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <FontAwesome name="chevron-left" size={13} color={colors.accent} />
        <Text style={styles.backText}>Team</Text>
      </Pressable>

      <View style={styles.card}>
        <View style={styles.identityRow}>
          {member.photoUrl ? (
            <Image source={{ uri: member.photoUrl }} style={profileStyles.avatar} />
          ) : (
            <View style={[profileStyles.avatar, profileStyles.avatarEmpty]}>
              <FontAwesome name="user" size={30} color={colors.textFaint} />
            </View>
          )}
          <View style={styles.identityText}>
            <Text style={styles.roleTag}>{roleLabel}</Text>
            <Text style={styles.name}>
              {member.displayName}
              {member.uid === myUid ? ' (You)' : ''}
            </Text>
            <View style={styles.identityMeta}>
              <StreakFlame streak={theirStats.currentStreak} />
            </View>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <Text style={member.bio ? styles.bio : styles.bioEmpty}>
          {member.bio || 'No bio yet.'}
        </Text>
      </View>

      <ProfileBody
        deals={theirDeals}
        commissions={[]}
        knocksByDate={{}}
        longestStreak={theirStats.longestStreak}
        gradedPitches={0}
        bestPitchGrade={0}
        overrides={member.bests}
        showMoney={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  backText: { ...typography.caption, color: colors.accent, fontFamily: fonts.sansBold },
  missing: { ...typography.body, color: colors.textFaint },
  // Matches profile.tsx's identity card exactly, since this is the same content shown
  // for a teammate instead of yourself — the two screens should be visually identical.
  card: {
    ...elevation.raised,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identityText: { flex: 1, gap: 2 },
  roleTag: { ...typography.eyebrow, color: colors.gold },
  name: { ...typography.pageTitle, fontSize: 26, color: colors.text },
  identityMeta: { flexDirection: 'row', marginTop: spacing.xs },
  cardDivider: { height: 1, backgroundColor: colors.borderSubtle, marginVertical: spacing.md },
  bio: { ...typography.body, color: colors.textMuted, lineHeight: 21 },
  bioEmpty: { ...typography.body, color: colors.textFaint, fontStyle: 'italic' },
});
