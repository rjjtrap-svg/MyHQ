import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/src/theme';

/**
 * An inline message. The error variant was previously copy-pasted into seven files with
 * the same three raw hex values in each, so a palette change missed most of them.
 */
export function Banner({
  message,
  tone = 'error',
  align = 'center',
}: {
  message: string;
  tone?: 'error' | 'info';
  align?: 'center' | 'left';
}) {
  const isError = tone === 'error';
  return (
    <View style={[styles.base, isError ? styles.error : styles.info]}>
      <Text
        style={[styles.text, isError ? styles.errorText : styles.infoText, { textAlign: align }]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm + 2,
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
  error: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
  },
  info: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  text: { ...typography.caption, fontWeight: '600' },
  errorText: { color: colors.dangerText },
  infoText: { color: colors.textMuted },
});
