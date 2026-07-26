import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { BadgeDef } from '@/src/lib/badges';
import { colors, radius, spacing, typography } from '@/src/theme';

/**
 * An earned badge reads as a stitched patch — filled disc, gold ring, dark icon. A locked
 * one keeps the exact same silhouette but drops to a dashed outline, so the shelf of
 * unearned patches shows the rep what's still on the table instead of hiding it.
 */
export function BadgePatch({ badge, progress }: { badge: BadgeDef; progress: number }) {
  const earned = progress >= 1;
  return (
    <View style={styles.wrap}>
      <View style={[styles.disc, earned ? styles.discEarned : styles.discLocked]}>
        <FontAwesome
          name={badge.icon}
          size={20}
          color={earned ? colors.background : colors.textFaint}
        />
      </View>
      <Text style={[styles.name, !earned && styles.nameLocked]} numberOfLines={2}>
        {badge.name}
      </Text>
      <Text style={styles.requirement} numberOfLines={2}>
        {earned ? 'Earned' : badge.requirement}
      </Text>
      {!earned && progress > 0 && (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '23%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  disc: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  discEarned: {
    backgroundColor: colors.primary,
    borderWidth: 2.5,
    borderColor: colors.gold,
  },
  discLocked: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  name: {
    ...typography.eyebrow,
    fontSize: 9,
    letterSpacing: 0.8,
    color: colors.text,
    textAlign: 'center',
  },
  nameLocked: {
    color: colors.textFaint,
  },
  requirement: {
    fontSize: 9,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: 2,
  },
  track: {
    height: 3,
    width: '80%',
    borderRadius: radius.round,
    backgroundColor: colors.track,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.gold,
  },
});
