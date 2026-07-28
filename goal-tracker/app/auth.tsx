import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { signInWithEmail, signUpWithEmail } from '@/src/firebase/auth';
import { joinTeamByCode } from '@/src/firebase/teams';
import { useAuthStore } from '@/src/store/authStore';
import { firebaseEnabled } from '@/src/firebase/config';
import { Banner } from '@/src/components/Banner';
import { Emblem } from '@/src/components/Emblem';
import { WaveRule } from '@/src/components/WaveRule';
import { Button, SegmentedToggle } from '@/src/components/Button';
import { colors, layout, radius, spacing, typography } from '@/src/theme';

type Mode = 'sign-in' | 'sign-up';

export default function AuthScreen() {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [mode, setMode] = useState<Mode>('sign-in');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  if (firebaseUser && profile) {
    return <Redirect href="/" />;
  }

  if (!firebaseEnabled) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContent}>
          <Text style={styles.heading}>Setup Needed</Text>
          <Text style={styles.body}>
            Team accounts, shared deal visibility, and photo uploads all need a real Firebase project.
            Add your Firebase config to `.env` (see the README), then reload.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  async function handleSignIn() {
    setError(null);
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      setError(err?.message ?? 'Check your email and password.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp() {
    setError(null);
    if (!displayName || !email || !password) {
      setError('Fill in your name, email, and password.');
      return;
    }
    if (!inviteCode) {
      setError('Enter the invite code your manager gave you.');
      return;
    }

    setBusy(true);
    try {
      const user = await signUpWithEmail(email, password, displayName);
      await joinTeamByCode(user.uid, email, displayName, inviteCode);
      await refreshProfile();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Emblem size={92} />
          <Text style={styles.eyebrow}>Door to door</Text>
          <Text style={styles.title}>Goal Tracker</Text>
          <Text style={styles.subtitle}>
            {mode === 'sign-in' ? 'Welcome back.' : 'Create your account to get started.'}
          </Text>
        </View>

        <WaveRule style={styles.brandWave} color={colors.border} />

        <View style={styles.modeRow}>
          <SegmentedToggle
            options={[
              { key: 'sign-in', label: 'Sign in' },
              { key: 'sign-up', label: 'Sign up' },
            ]}
            value={mode}
            onChange={setMode}
            stretch
          />
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
          <View style={styles.passwordRow}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textFaint}
              style={[styles.input, styles.passwordInput]}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={10}
            >
              <FontAwesome
                name={showPassword ? 'eye-slash' : 'eye'}
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        </Field>

        {mode === 'sign-up' && (
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

        {error && (
          <Banner message={error} />
        )}

        <Button
          label={mode === 'sign-in' ? 'Sign in' : 'Create account'}
          onPress={mode === 'sign-in' ? handleSignIn : handleSignUp}
          size="lg"
          busy={busy}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
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
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  title: {
    ...typography.hero,
    fontSize: 34,
    color: colors.text,
    marginTop: 2,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
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
    marginBottom: spacing.lg,
  },
  brand: {
    alignItems: 'center',
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.gold,
    marginTop: spacing.md,
  },
  brandWave: {
    marginVertical: spacing.lg,
    opacity: 0.9,
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
  passwordRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: spacing.xl + spacing.md,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    padding: spacing.xs,
  },
  errorText: {
    color: colors.dangerText,
    fontSize: 13,
    fontWeight: '600',
  },
});
