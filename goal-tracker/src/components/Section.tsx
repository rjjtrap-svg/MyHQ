import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';
import { colors, spacing, typography } from '@/src/theme';

interface SectionProps extends ViewProps {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Section headers are set as patch lettering — small caps, wide tracking, with a short
 * gold tick to the left and a hairline running out to the right. It's the one structural
 * device repeated on every screen, so the app reads as one thing rather than a stack of
 * unrelated card lists.
 */
export function Section({ title, right, children, style, ...rest }: SectionProps) {
  return (
    <View style={[styles.container, style]} {...rest}>
      <View style={styles.header}>
        <View style={styles.tick} />
        <Text style={styles.title}>{title}</Text>
        <View style={styles.rule} />
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tick: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
  title: {
    ...typography.eyebrow,
    color: colors.text,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
});
