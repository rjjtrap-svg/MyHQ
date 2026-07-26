import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/src/theme';

export function StreakFlame({ streak }: { streak: number }) {
  if (streak <= 0) return null;
  return (
    <View style={styles.container}>
      <FontAwesome name="fire" size={16} color={colors.fire} />
      <Text style={styles.text}>{streak}-day streak</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#B5692E22',
    borderColor: '#B5692E55',
    borderWidth: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.round,
    gap: spacing.xs,
  },
  text: {
    color: colors.fire,
    fontWeight: '700',
    fontSize: 13,
  },
});
