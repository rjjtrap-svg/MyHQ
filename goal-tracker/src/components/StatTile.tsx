import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/src/theme';

interface StatTileProps {
  label: string;
  value: string;
  sublabel?: string;
  accent?: string;
}

/** Scoreboard treatment: serif numeral, hairline under it, caps label — same rhythm as
 * the score tiles on the Profile tab so numbers read consistently across the app. */
export function StatTile({ label, value, sublabel, accent }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.value, accent ? { color: accent } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <View style={styles.rule} />
      <Text style={styles.label}>{label}</Text>
      {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  value: {
    ...typography.scoreValue,
    color: colors.text,
  },
  rule: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  label: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.textMuted,
  },
  sublabel: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: 2,
  },
});
