import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Emblem } from './Emblem';
import { WaveRule } from './WaveRule';
import { colors, spacing, typography } from '@/src/theme';

/**
 * Every top-level screen opens the same way: a gold eyebrow, a serif-weight title, the
 * mark on the right, and a seigaiha rule underneath. Before this existed, only Home had
 * the treatment and the other four screens opened with a bare title, which made them read
 * like a different app.
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
        {right ?? (emblem ? <Emblem size={44} /> : null)}
      </View>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <WaveRule style={styles.wave} color={colors.border} />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  text: { flex: 1 },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.gold,
  },
  title: {
    ...typography.hero,
    color: colors.text,
    fontSize: 30,
    marginTop: 4,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  wave: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    opacity: 0.9,
  },
});
