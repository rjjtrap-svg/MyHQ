import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, elevation, layout, radius, spacing, typography } from '@/src/theme';

export type Trend = 'up' | 'down' | 'flat';

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
  accent?: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const body = (
    <>
      {!!accent && <View style={[styles.leftAccent, { backgroundColor: accent }]} />}
      <View style={styles.head}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {!!icon && <FontAwesome name={icon} size={11} color={colors.textFaint} />}
      </View>

      <Text
        style={[styles.value, !!accent && { color: accent }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
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
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}${sublabel ? `. ${sublabel}` : ''}`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...elevation.card,
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: layout.cardPadding - 2,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cardPressed: {
    backgroundColor: colors.surfacePressed,
    transform: [{ scale: 0.985 }],
  },
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 2.5,
    borderRadius: radius.round,
    opacity: 0.9,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm - 1,
  },
  label: {
    ...typography.label,
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
    marginRight: spacing.xs,
  },
  value: {
    ...typography.metric,
    fontSize: 30,
    letterSpacing: -0.7,
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs - 1,
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
