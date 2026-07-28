import React from 'react';
import { Pressable, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { colors, elevation, layout, radius } from '@/src/theme';

type SurfaceLevel = 'flat' | 'card' | 'raised';

interface SurfaceProps extends ViewProps {
  level?: SurfaceLevel;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

/** A single surface vocabulary prevents every feature from inventing another card. */
export function Surface({
  level = 'card',
  onPress,
  accessibilityLabel,
  style,
  children,
  ...rest
}: SurfaceProps) {
  const surfaceStyle = [styles.base, levels[level], elevation[level], style];

  if (!onPress) {
    return <View style={surfaceStyle} {...rest}>{children}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [surfaceStyle, pressed && styles.pressed]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    padding: layout.cardPadding,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
    transform: [{ scale: 0.99 }],
  },
});

const levels = StyleSheet.create({
  flat: { backgroundColor: colors.surface },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  raised: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
});
