import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';
import { colors, spacing, typography } from '@/src/theme';

interface SectionProps extends ViewProps {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}

export function Section({ title, right, children, style, ...rest }: SectionProps) {
  return (
    <View style={[styles.container, style]} {...rest}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
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
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
  },
});
