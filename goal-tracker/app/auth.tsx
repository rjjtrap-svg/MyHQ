import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { signInWithEmail, signUpWithEmail } from '@/src/firebase/auth';
import { createTeamAndProfile, joinTeamByCode } from '@/src/firebase/teams';
import { useAuthStore } from '@/src/store/authStore';
import { firebaseEnabled } from '@/src/firebase/config';
import { colors, radius, spacing, typography } from '@/src/theme';

type Mode = 'sign-in' | 'sign-up';
type TeamChoice = 'create' | 'join';

export default function AuthScreen() {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [mode, setMode] = useState<Mode>('sign-in');
  const [teamChoice, setTeamChoice] = useState<TeamChoice>('create');
  const [busy, setBusy] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  if (firebaseUser && profile) {
    return <Redirect href="/" />;
  }

  if (!firebaseEnabled) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContent}>
          <Text style={styles.heading}>Setup needed</Text>
          <Text style={styles.body}>
            Team accounts, shared deal visibility, and photo uploads all need a real Firebase project.
            Add your Firebase config to `.env` (see the README), then reload.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  async function handleSignIn() {
    if (!email || !password) {
      Alert.alert('Missing info', 'Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      Alert.alert('Sign in failed', err?.message ?? 'Check your email and password.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp() {
    if (!displayName || !email || !password) {
      Alert.alert('Missing info', 'Fill in your name, email, and password.');
      return;
    }
    if (teamChoice === 'create' && !teamName) {
      Alert.alert('Missing info', 'Give your team a name.');
      return;
    }
    if (teamChoice === 'join' && !inviteCode) {
      Alert.alert('Missing info', 'Enter the invite code your manager gave you.');
      return;
    }

    setBusy(true);
    try {
      const user = await signUpWithEmail(email, password, displayName);
      if (teamChoice === 'create') {
        await createTeamAndProfile(user.uid, email, displayName, teamName);
      } else {
        await joinTeamByCode(user.uid, email, displayName, inviteCode);
      }
      await refreshProfile();
    } catch (err: any) {
      Alert.alert('Sign up failed', err?.message ?? 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Goal Tracker</Text>
        <Text style={styles.subtitle}>
          {mode === 'sign-in' ? 'Welcome back.' : 'Create your account to get started.'}
        </Text>

        <View style={styles.modeRow}>
          <ModeTab label="Sign in" active={mode === 'sign-in'} onPress={() => setMode('sign-in')} />
          <ModeTab label="Sign up" active={mode === 'sign-up'} onPress={() => setMode('sign-up')} />
        </View>

        {mode === 'sign-up' && (
          <Field label="Your name">
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Jordan Rep"
              placeholderTextColor={colors.textFaint}
              style={styles.input}
              autoCapitalize="words"
            />
          </Field>
        )}

        <Field label="Email">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </Field>

        <Field label="Password">
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            secureTextEntry
          />
        </Field>

        {mode === 'sign-up' && (
          <>
            <View style={styles.modeRow}>
              <ModeTab
                label="Start a team"
                active={teamChoice === 'create'}
                onPress={() => setTeamChoice('create')}
              />
              <ModeTab label="Join a team" active={teamChoice === 'join'} onPress={() => setTeamChoice('join')} />
            </View>

            {teamChoice === 'create' ? (
              <Field label="Team name">
                <TextInput
                  value={teamName}
                  onChangeText={setTeamName}
                  placeholder="Cityside Solar Blitz"
                  placeholderTextColor={colors.textFaint}
                  style={styles.input}
                />
              </Field>
            ) : (
              <Field label="Invite code">
                <TextInput
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  placeholder="ABC123"
                  placeholderTextColor={colors.textFaint}
                  style={styles.input}
                  autoCapitalize="characters"
                />
              </Field>
            )}
          </>
        )}

        <Pressable
          style={[styles.submitButton, busy && { opacity: 0.6 }]}
          onPress={mode === 'sign-in' ? handleSignIn : handleSignUp}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.submitText}>{mode === 'sign-in' ? 'Sign in' : 'Create account'}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ModeTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.modeTab, active && styles.modeTabActive]} onPress={onPress}>
      <Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>{label}</Text>
    </Pressable>
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  title: {
    ...typography.hero,
    fontSize: 32,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  heading: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: spacing.lg,
  },
  modeTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  modeTabActive: {
    backgroundColor: colors.primaryMuted,
  },
  modeTabText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  modeTabTextActive: {
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
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
});
