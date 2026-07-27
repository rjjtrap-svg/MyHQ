import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/src/theme';

/**
 * Floor mottos. Deliberately not "motivational quotes" from famous people — these are
 * things a sales manager actually says on a morning huddle, which is what makes them land
 * with a door-knocking team instead of reading like a poster in a dentist's office.
 */
const MOTTOS: { line: string; attribution: string }[] = [
  { line: 'The next door owes you nothing. Knock it anyway.', attribution: 'House rule' },
  { line: 'Nobody ever got a no at a door they never knocked.', attribution: 'House rule' },
  { line: 'Slow mornings make long afternoons.', attribution: 'House rule' },
  { line: 'You are one conversation from a good day.', attribution: 'House rule' },
  { line: 'Pressure is a privilege. So is a full territory.', attribution: 'House rule' },
  { line: 'Rejection is just data with an attitude.', attribution: 'House rule' },
  { line: 'Win the street, not the sale.', attribution: 'House rule' },
];

/** Rotates daily rather than per-render, so the app has a "quote of the day" rhythm and
 * doesn't flicker to a new line every time a screen re-renders. */
export function PullQuote({ seed }: { seed?: string }) {
  const key = seed ?? new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const motto = MOTTOS[hash % MOTTOS.length];

  return (
    <View style={styles.card}>
      <Text style={styles.mark}>“</Text>
      <Text style={styles.line}>{motto.line}</Text>
      <Text style={styles.attribution}>{motto.attribution}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.brandSurface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  mark: {
    position: 'absolute',
    top: -18,
    right: 8,
    fontSize: 96,
    color: colors.gold,
    opacity: 0.35,
    fontFamily: typography.quote.fontFamily,
  },
  line: {
    ...typography.quote,
    color: colors.onPrimary,
    paddingRight: spacing.xl,
  },
  attribution: {
    ...typography.eyebrow,
    color: colors.gold,
    marginTop: spacing.md,
  },
});
