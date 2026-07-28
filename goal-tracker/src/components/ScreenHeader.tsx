import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Mark } from './Mark';
import { colors, spacing, typography } from '@/src/theme';

/**
 * Every top-level screen opens the same way: a gold eyebrow, a heavy title, the mark on the
 * right, and a hairline rule underneath. Before this existed, only Home had the treatment
 * and the other four screens opened with a bare title, which made them read like a
 * different app.
 *
 * `emblem={false}` for stacked/detail screens, where repeating the mark under a back link
 * is noise rather than branding.
 */
export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  emblem = true,
  right,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  emblem?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <>
      <View style={styles.row}>
        <View style={styles.text}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        {right ?? (emblem ? <Mark size={28} /> : null)}
      </View>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <View style={styles.rule} />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  text: { flex: 1 },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.gold,
  },
  title: {
    ...typography.pageTitle,
    color: colors.text,
    marginTop: 4,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 21,
    marginTop: spacing.sm,
    maxWidth: 560,
  },
  rule: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});
