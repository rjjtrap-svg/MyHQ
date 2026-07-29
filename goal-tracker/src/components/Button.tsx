import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '@/src/theme';

type Variant = 'hero' | 'solid' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'xl';

/**
 * One button. There were 23 hand-rolled primary-button styles across the app, each with
 * slightly different padding, radius and label weight, so no two screens agreed on what a
 * button looked like.
 */
export function Button({
  label,
  onPress,
  variant = 'solid',
  size = 'md',
  busy = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  busy?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const inactive = disabled || busy;

  // A press you can feel. Haptics are the cheapest way to make an app seem responsive, and
  // this app is used one-handed on a doorstep where the screen is often barely glanceable.
  // Web has no equivalent, so it's skipped rather than polyfilled into something worse.
  function handlePress() {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        sizes[size],
        variants[variant],
        pressed && !inactive && pressedVariants[variant],
        inactive && styles.inactive,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={variant === 'hero' ? colors.onPrimary : variant === 'ghost' ? colors.textMuted : colors.text} />
      ) : (
        <Text style={[styles.label, labelSizes[size], labelVariants[variant]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactive: { opacity: 0.55 },
  label: { ...typography.button },
});

const sizes = StyleSheet.create({
  sm: { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md, minWidth: 72 },
  md: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg, minWidth: 88 },
  lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, alignSelf: 'stretch' },
  // The one action on a screen. Deliberately oversized and fully round — at this size it
  // stops being a control in a list of controls and becomes the thing you came to do.
  xl: {
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xl,
    alignSelf: 'stretch',
    borderRadius: radius.round,
    minHeight: 58,
  },
});

const labelSizes = StyleSheet.create({
  sm: { fontSize: 13 },
  md: { fontSize: 14 },
  lg: { fontSize: 15 },
  xl: { fontSize: 16 },
});

/**
 * `solid` is glass, not a colour fill. A saturated fill is the loudest thing on a dark
 * screen and it was winning against the content it sat under. A lit tint of the background
 * with a brighter edge still reads as the one thing to press, because it is the only element
 * on the screen with that edge — hierarchy from light rather than from hue.
 *
 * `ghost` keeps the dimmer border so the two are still distinguishable side by side.
 */
const variants = StyleSheet.create({
  // The one loud thing, and the one place the brand accent is allowed to be a fill rather
  // than a hairline. Gold on a near-black screen is the only fill that outranks glass without
  // reaching for a second hue. Use it once per screen — twice and neither is primary.
  hero: { backgroundColor: colors.primary },
  solid: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorderStrong },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.dangerSurface, borderWidth: 1, borderColor: colors.dangerBorder },
});

const pressedVariants = StyleSheet.create({
  hero: { backgroundColor: colors.primaryPressed, transform: [{ scale: 0.97 }] },
  solid: { backgroundColor: colors.glassPressed, transform: [{ scale: 0.97 }] },
  ghost: { backgroundColor: colors.surfacePressed, transform: [{ scale: 0.97 }] },
  danger: { backgroundColor: colors.dangerBorder, transform: [{ scale: 0.97 }] },
});

const labelVariants = StyleSheet.create({
  hero: { color: colors.onPrimary },
  solid: { color: colors.text },
  ghost: { color: colors.textMuted },
  danger: { color: colors.dangerText },
});

/** Two or three states in a row — used for the auth mode switch and the leaderboard range. */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  stretch = false,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  /** Equal-width tabs filling the container. Off by default so the control can sit inline
   *  in a section header without stealing the whole row. */
  stretch?: boolean;
}) {
  return (
    <View style={segStyles.row}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              segStyles.tab,
              stretch && segStyles.tabStretch,
              active && segStyles.tabActive,
              pressed && !active && segStyles.tabPressed,
            ]}
          >
            <Text style={[segStyles.text, active && segStyles.textActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const segStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  tab: {
    minHeight: 40,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  tabStretch: { flex: 1 },
  // Same glass treatment as the solid button, so "selected" and "the action" speak one
  // visual language instead of two shades of blue.
  tabActive: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder },
  tabPressed: { backgroundColor: colors.surfacePressed },
  text: { ...typography.eyebrow, fontSize: 10, color: colors.textMuted },
  textActive: { color: colors.text },
});
