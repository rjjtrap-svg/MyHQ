import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/src/theme';

interface StatTileProps {
  label: string;
  value: string;
  sublabel?: string;
  accent?: string;
}

export function StatTile({ label, value, sublabel, accent }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.value, accent ? { color: accent } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
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
    ...typography.statValue,
    color: colors.text,
  },
  label: {
    ...typography.statLabel,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  sublabel: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: 2,
  },
});
