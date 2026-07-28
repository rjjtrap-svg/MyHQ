import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/src/theme';

interface StatTileProps {
  label: string;
  value: string;
  sublabel?: string;
  accent?: string;
  tone?: 'default' | 'success' | 'warning' | 'info' | 'premium';
}

/** Performance-card treatment: dominant numeral, compact label, and optional semantic
 * surface tone — the same scanning rhythm wherever metrics appear. */
export function StatTile({ label, value, sublabel, accent, tone = 'default' }: StatTileProps) {
  const toneStyle = tone === 'default' ? null : styles[tone];
  return (
    <View style={[styles.tile, toneStyle]}>
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
    minHeight: 128,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  value: {
    ...typography.scoreValue,
    color: colors.text,
  },
  success: { backgroundColor: colors.successSurface, borderColor: colors.successBorder },
  warning: { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder },
  info: { backgroundColor: colors.infoSurface, borderColor: colors.infoBorder },
  premium: { backgroundColor: colors.premiumSurface, borderColor: colors.premiumBorder },
  label: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.textMuted,
  },
  sublabel: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: spacing.xs,
  },
});
