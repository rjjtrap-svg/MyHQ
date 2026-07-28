import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PaceStatus } from '@/src/types';
import { fonts, colors, radius, spacing } from '@/src/theme';

const PACE_COPY: Record<PaceStatus, { label: string; color: string }> = {
  ahead: { label: 'Ahead of pace', color: colors.ahead },
  'on-pace': { label: 'On pace', color: colors.onPace },
  behind: { label: 'Behind pace', color: colors.behind },
};

export function PaceBadge({ pace }: { pace: PaceStatus }) {
  const { label, color } = PACE_COPY[pace];
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.round,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  text: {
    fontSize: 13,
    fontFamily: fonts.sansBold,
  },
});
