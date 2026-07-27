import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LockInNote } from '@/src/types';
import { colors, radius, spacing, typography } from '@/src/theme';

function writtenOn(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * The signature element of this tab, and the only loud thing in it.
 *
 * Everywhere else in the app is someone else's numbers — goals, leaderboards, close rates.
 * This is the one card that is the rep's own words, so it gets the full brown field, the
 * serif at size, and all the air. Nothing else in Lock In competes with it.
 */
export function WhyCard({
  why,
  onPress,
}: {
  why?: LockInNote;
  onPress: () => void;
}) {
  if (!why) {
    // An empty state is an invitation, not an apology. No "you haven't set up..." framing.
    return (
      <Pressable style={[styles.card, styles.empty]} onPress={onPress}>
        <Text style={styles.eyebrowMuted}>Your why</Text>
        <Text style={styles.emptyLine}>
          The reason you knock the next door after the last one slammed.
        </Text>
        <Text style={styles.emptyCta}>Write it →</Text>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.eyebrow}>Your why</Text>
      <Text style={styles.body}>{why.body}</Text>
      <View style={styles.rule} />
      <Text style={styles.meta}>Written {writtenOn(why.createdAt)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  empty: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.gold,
    marginBottom: spacing.md,
  },
  eyebrowMuted: {
    ...typography.eyebrow,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.quote,
    fontSize: 22,
    lineHeight: 32,
    color: colors.background,
  },
  rule: {
    height: 1,
    backgroundColor: colors.accent,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  meta: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.primaryMuted,
  },
  emptyLine: {
    ...typography.quote,
    fontSize: 18,
    color: colors.textMuted,
  },
  emptyCta: {
    ...typography.eyebrow,
    color: colors.accent,
    marginTop: spacing.lg,
  },
});
