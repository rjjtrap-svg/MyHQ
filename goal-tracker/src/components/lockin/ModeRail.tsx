import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/src/theme';

/**
 * A quieter switch than SegmentedToggle. The Coach screen already opens with four boxed
 * mode cards; stacking a second boxed control underneath them reads as chrome on chrome.
 * This is just labels with a gold underline under the live one — it takes a fifth of the
 * visual weight and leaves the eye on the writing, which is the point of this tab.
 */
export function ModeRail<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.rail}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
            <View style={[styles.underline, active && styles.underlineActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  item: {
    marginRight: spacing.lg,
    paddingBottom: spacing.sm,
  },
  label: {
    ...typography.eyebrow,
    color: colors.textFaint,
  },
  labelActive: {
    color: colors.text,
  },
  underline: {
    height: 2,
    marginTop: spacing.sm,
    backgroundColor: 'transparent',
    borderRadius: 1,
  },
  underlineActive: {
    backgroundColor: colors.gold,
  },
});
