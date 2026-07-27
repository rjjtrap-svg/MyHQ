import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/src/theme';

export type Trend = 'up' | 'down' | 'flat';

/**
 * A metric tile with room to breathe.
 *
 * Deliberately not the same shape as StatTile, which is the compact two-up used deeper in
 * the app. This one carries an optional icon, a trend and a comparison line, because on the
 * dashboard a number without context ("14") is trivia — "14, +3 on last week" is a fact you
 * can act on.
 *
 * Trend arrows are paired with the comparison text rather than replacing it: an arrow alone
 * is meaningless to anyone who can't see the colour.
 */
export function MetricCard({
  label,
  value,
  sublabel,
  trend,
  accent,
  icon,
  onPress,
  style,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: Trend;
  /** Colours the value. Use only when the number itself carries a status. */
  accent?: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const body = (
    <>
      <View style={styles.head}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {!!icon && <FontAwesome name={icon} size={12} color={colors.textFaint} />}
      </View>

      <Text style={[styles.value, !!accent && { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>

      {!!sublabel && (
        <View style={styles.footer}>
          {!!trend && trend !== 'flat' && (
            <FontAwesome
              name={trend === 'up' ? 'arrow-up' : 'arrow-down'}
              size={9}
              color={trend === 'up' ? colors.ahead : colors.behind}
              style={styles.trendIcon}
            />
          )}
          <Text style={styles.sublabel} numberOfLines={2}>
            {sublabel}
          </Text>
        </View>
      )}
    </>
  );

  if (!onPress) return <View style={[styles.card, style]}>{body}</View>;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardPressed: {
    backgroundColor: colors.surfacePressed,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.textMuted,
    flex: 1,
    marginRight: spacing.xs,
  },
  value: {
    ...typography.scoreValue,
    fontSize: 30,
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  trendIcon: {
    marginRight: 4,
  },
  sublabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textFaint,
    flex: 1,
  },
});
