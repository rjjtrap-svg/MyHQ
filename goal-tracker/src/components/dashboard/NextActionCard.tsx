import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, elevation, layout, radius, spacing, typography } from '@/src/theme';

/**
 * One action, chosen for you.
 *
 * A dashboard that ends in six equally-weighted buttons has handed the decision back to the
 * rep. This picks the single most useful next thing from real state — doors owed a revisit,
 * deals waiting on an install answer, or the gap to today's number — and says it in one
 * line. Exactly one of these renders at a time; that restraint is the feature.
 */
export function NextActionCard({
  eyebrow,
  headline,
  detail,
  icon,
  tone = 'primary',
  onPress,
}: {
  eyebrow: string;
  headline: string;
  detail?: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  /** `attention` for something overdue, `primary` for the normal push. */
  tone?: 'primary' | 'attention';
  onPress: () => void;
}) {
  const accent = tone === 'attention' ? colors.warning : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={detail ? `${headline}. ${detail}` : headline}
      accessibilityHint="Opens the recommended next step"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: accent }]}>
        <FontAwesome name={icon} size={15} color={colors.onPrimary} />
      </View>

      <View style={styles.text}>
        <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text>
        <Text style={styles.headline}>{headline}</Text>
        {!!detail && <Text style={styles.detail}>{detail}</Text>}
      </View>

      <FontAwesome name="chevron-right" size={13} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...elevation.raised,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: layout.cardPadding,
    marginBottom: spacing.xl,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  text: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  eyebrow: {
    ...typography.badge,
    marginBottom: 3,
  },
  headline: {
    ...typography.cardTitle,
    color: colors.text,
  },
  detail: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textFaint,
    marginTop: 2,
  },
});
