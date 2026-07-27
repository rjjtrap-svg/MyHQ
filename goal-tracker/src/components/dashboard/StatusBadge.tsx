import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/src/theme';

export type BadgeTone = 'ahead' | 'onPace' | 'behind' | 'neutral' | 'hot' | 'premium';

const TONE: Record<BadgeTone, string> = {
  ahead: colors.ahead,
  onPace: colors.onPace,
  behind: colors.behind,
  neutral: colors.textMuted,
  hot: colors.fire,
  premium: colors.premium,
};

/**
 * A small status pill: a coloured dot, then a word.
 *
 * The dot is not decoration. Pace is the one thing on this dashboard that a rep reads at a
 * glance, and colour alone can't carry it — so the label always states the status in words
 * and the dot only reinforces it. Anyone who can't separate the green from the amber still
 * reads "Behind pace".
 */
export function StatusBadge({
  label,
  tone = 'neutral',
  subtle = false,
}: {
  label: string;
  tone?: BadgeTone;
  /** Drops the fill, leaving dot and text. For placing on an already-busy surface. */
  subtle?: boolean;
}) {
  const color = TONE[tone];
  return (
    <View style={[styles.pill, subtle && styles.pillSubtle]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
  },
  pillSubtle: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    paddingHorizontal: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.round,
    marginRight: spacing.xs + 2,
  },
  label: {
    ...typography.badge,
  },
});
