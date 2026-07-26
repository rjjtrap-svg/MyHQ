import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/src/theme';

type Variant = 'solid' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

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
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={[styles.base, sizes[size], variants[variant], inactive && styles.inactive, style]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={variant === 'ghost' ? colors.textMuted : colors.background} />
      ) : (
        <Text style={[styles.label, labelSizes[size], labelVariants[variant]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  inactive: { opacity: 0.55 },
  label: { fontWeight: '700' },
});

const sizes = StyleSheet.create({
  sm: { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md, minWidth: 72 },
  md: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg, minWidth: 88 },
  lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, alignSelf: 'stretch' },
});

const labelSizes = StyleSheet.create({
  sm: { fontSize: 13 },
  md: { fontSize: 14 },
  lg: { fontSize: 15 },
});

const variants = StyleSheet.create({
  solid: { backgroundColor: colors.primary },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.dangerSurface, borderWidth: 1, borderColor: colors.dangerBorder },
});

const labelVariants = StyleSheet.create({
  solid: { color: colors.background },
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
            style={[segStyles.tab, stretch && segStyles.tabStretch, active && segStyles.tabActive]}
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
  tab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignItems: 'center', borderRadius: radius.sm },
  tabStretch: { flex: 1 },
  tabActive: { backgroundColor: colors.primary },
  text: { ...typography.eyebrow, fontSize: 10, color: colors.textMuted },
  textActive: { color: colors.background },
});
