import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { G, Path } from 'react-native-svg';
import { colors, radius, spacing } from '@/src/theme';

/** Soft scoreboard atmosphere shared so every tab opens in the same world. */
export function AtmosphericBackdrop({ height = 760 }: { height?: number }) {
  return (
    <View pointerEvents="none" style={[styles.atmosphere, { height }]}>
      <LinearGradient
        colors={[colors.infoSurface, colors.brandSurface, colors.background]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.energyOne} />
      <View style={styles.energyTwo} />
      <Svg width="100%" height="520" viewBox="0 0 760 520" style={styles.contours}>
        <G fill="none" stroke={colors.primary} strokeWidth="1" opacity="0.1">
          <Path d="M-70 212C67 119 188 131 302 205s241 75 528-57" />
          <Path d="M-72 238C69 145 187 156 296 226s239 73 532-53" />
          <Path d="M-74 266C73 174 184 182 287 248s238 70 545-48" />
          <Path d="M-78 298C79 207 183 211 279 272s237 65 555-44" />
          <Path d="M-82 334C86 245 181 245 270 301s237 58 570-40" />
        </G>
      </Svg>
      <LinearGradient
        colors={['transparent', colors.background]}
        locations={[0.3, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  atmosphere: {
    position: 'absolute',
    top: 0,
    left: -spacing.xl,
    right: -spacing.xl,
    overflow: 'hidden',
  },
  energyOne: {
    position: 'absolute',
    width: 520,
    height: 220,
    borderRadius: radius.round,
    borderWidth: 34,
    borderColor: colors.primary,
    opacity: 0.08,
    top: 104,
    left: '14%',
    transform: [{ rotate: '-14deg' }, { scaleX: 1.35 }],
  },
  energyTwo: {
    position: 'absolute',
    width: 360,
    height: 160,
    borderRadius: radius.round,
    borderWidth: 18,
    borderColor: colors.primaryMuted,
    opacity: 0.06,
    top: 238,
    right: '-22%',
    transform: [{ rotate: '21deg' }, { scaleX: 1.4 }],
  },
  contours: { position: 'absolute', top: 80, left: 0, right: 0 },
});
