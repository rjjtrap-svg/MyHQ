import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { signInWithEmail, signUpWithEmail } from '@/src/firebase/auth';
import { joinTeamByCode } from '@/src/firebase/teams';
import { useAuthStore } from '@/src/store/authStore';
import { firebaseEnabled } from '@/src/firebase/config';
import { Banner } from '@/src/components/Banner';
import { Mark } from '@/src/components/Mark';
import { Button } from '@/src/components/Button';
import { fonts, colors, layout, radius, spacing, typography } from '@/src/theme';

type Mode = 'sign-in' | 'sign-up';
type FieldName = 'name' | 'email' | 'password' | 'code';

const COPY: Record<
  Mode,
  { title: string; subtitle: string; action: string; prompt: string; switchTo: string }
> = {
  'sign-in': {
    title: 'Sign in',
    subtitle: 'Your board is where you left it.',
    action: 'Sign in',
    prompt: 'No account yet?',
    switchTo: 'Create one',
  },
  'sign-up': {
    title: 'Create your account',
    subtitle: "You'll need your team's invite code to finish.",
    action: 'Create account',
    prompt: 'Already have an account?',
    switchTo: 'Sign in',
  },
};

export default function AuthScreen() {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [mode, setMode] = useState<Mode>('sign-in');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<FieldName | null>(null);

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
          <Mark size={40} />
          <Text style={styles.setupTitle}>Finish the setup</Text>
          <Text style={styles.setupBody}>
            Team accounts, shared deals and photo uploads all need a Firebase project. Add your
            Firebase config to `.env` — the README lists the exact keys — then reload.
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

  const copy = COPY[mode];
  const inputStyle = (name: FieldName) => [styles.input, focused === name && styles.inputFocused];
  const bind = (name: FieldName) => ({
    onFocus: () => setFocused(name),
    onBlur: () => setFocused((f) => (f === name ? null : f)),
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          {/* The mark alone. The product name doesn't need saying on the one screen where
              nobody is confused about which app they opened. */}
          <View style={styles.lockup}>
            <Mark size={44} />
          </View>

          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.subtitle}>{copy.subtitle}</Text>

          <View style={styles.formTop} />

          {mode === 'sign-up' && (
            <Field label="Your name">
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Jordan Rep"
                placeholderTextColor={colors.textFaint}
                style={inputStyle('name')}
                autoCapitalize="words"
                {...bind('name')}
              />
            </Field>
          )}

          <Field label="Email">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textFaint}
              style={inputStyle('email')}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              {...bind('email')}
            />
          </Field>

          <Field label="Password">
            <View style={styles.passwordRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textFaint}
                style={[inputStyle('password'), styles.passwordInput]}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                {...bind('password')}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <FontAwesome
                  name={showPassword ? 'eye-slash' : 'eye'}
                  size={17}
                  color={focused === 'password' ? colors.text : colors.textMuted}
                />
              </Pressable>
            </View>
          </Field>

          {mode === 'sign-up' && (
            <Field label="Invite code" hint="The code your manager gave you.">
              <TextInput
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="ABC123"
                placeholderTextColor={colors.textFaint}
                style={[inputStyle('code'), styles.codeInput]}
                autoCapitalize="characters"
                autoCorrect={false}
                {...bind('code')}
              />
            </Field>
          )}

          {error && <Banner message={error} />}

          <Button
            label={copy.action}
            onPress={mode === 'sign-in' ? handleSignIn : handleSignUp}
            size="lg"
            busy={busy}
            style={styles.submit}
          />

          {/* The only way to change mode. A segmented toggle here put a second saturated
              blue block directly above the primary button and the two competed — on a form
              there is exactly one action, and it should be the only thing shouting. */}
          <View style={styles.switchRow}>
            <Text style={styles.switchPrompt}>{copy.prompt}</Text>
            <Pressable
              onPress={() => {
                setError(null);
                setMode((m) => (m === 'sign-in' ? 'sign-up' : 'sign-in'));
              }}
              hitSlop={10}
              accessibilityRole="link"
            >
              <Text style={styles.switchAction}>{copy.switchTo}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {!!hint && <Text style={styles.fieldHint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // flexGrow lets the form sit centred on a tall screen and scroll normally on a short one
  // once the keyboard is up.
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: layout.formMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.screenGutter,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: layout.screenGutter,
  },

  lockup: {
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },

  title: {
    ...typography.pageTitle,
    fontSize: 32,
    lineHeight: 38,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 21,
  },

  formTop: {
    height: spacing.xl,
  },

  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: spacing.xs + 2,
  },
  fieldHint: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textFaint,
    marginTop: spacing.xs + 2,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    minHeight: layout.minTouchTarget,
    color: colors.text,
    fontSize: 16,
  },
  // The only state change on the form. A focus ring is the one affordance a dark form needs
  // and the old screen had none — you could not tell which field you were typing into.
  inputFocused: {
    borderColor: colors.glassBorderStrong,
    backgroundColor: colors.surfaceElevated,
  },
  codeInput: {
    letterSpacing: 3,
    fontFamily: fonts.sansBold,
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

  submit: {
    marginTop: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: spacing.lg,
  },
  switchPrompt: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textFaint,
  },
  switchAction: {
    ...typography.caption,
    fontSize: 13,
    fontFamily: fonts.sansBold,
    color: colors.text,
    textDecorationLine: 'underline',
  },

  setupTitle: {
    ...typography.pageTitle,
    color: colors.text,
    marginTop: spacing.lg,
  },
  setupBody: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 22,
    maxWidth: layout.formMaxWidth,
  },
});
