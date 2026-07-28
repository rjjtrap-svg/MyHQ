import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';
import { colors, spacing, typography } from '@/src/theme';

interface SectionProps extends ViewProps {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Section headers use a strong compact title with a hairline running out to the right.
 * It's the one structural
 * device repeated on every screen, so the app reads as one thing rather than a stack of
 * unrelated card lists.
 */
export function Section({ title, right, children, style, ...rest }: SectionProps) {
  return (
    <View style={[styles.container, style]} {...rest}>
      <View style={styles.header}>
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
    gap: spacing.md,
    marginBottom: spacing.md + 2,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
});
