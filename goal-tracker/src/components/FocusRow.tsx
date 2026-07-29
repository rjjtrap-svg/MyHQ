import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/src/theme';

/** Single primary action row — Home's "Today's focus" pattern. */
export function FocusRow({
  label,
  value,
  action,
  onPress,
}: {
  label: string;
  value: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${value}. ${action}`}
      style={({ pressed }) => [styles.focus, pressed && styles.focusPressed]}
    >
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <Text style={styles.action}>{action} →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  focus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 88,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  focusPressed: { opacity: 0.65 },
  copy: { flex: 1, paddingRight: spacing.md },
  label: {
    ...typography.eyebrow,
    color: colors.textMuted,
    fontSize: 10,
  },
  value: {
    ...typography.subtitle,
    color: colors.text,
    marginTop: spacing.sm,
  },
  action: {
    ...typography.button,
    color: colors.primary,
  },
});
