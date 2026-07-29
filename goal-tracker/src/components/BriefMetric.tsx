import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/src/theme';

type MetricIcon = React.ComponentProps<typeof FontAwesome>['name'];

/** Compact performance tile shared across tabs. */
export function BriefMetric({
  label,
  value,
  detail,
  icon,
  wide,
  accent,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: MetricIcon;
  wide?: boolean;
  accent?: string;
}) {
  const { width } = useWindowDimensions();
  const isWide = wide ?? width >= 768;

  return (
    <View style={[styles.metric, isWide && styles.metricWide]}>
      <View style={styles.metricHead}>
        {!!icon && (
          <FontAwesome name={icon} size={11} color={accent ?? colors.primary} />
        )}
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <Text
        style={[styles.metricValue, accent ? { color: accent } : null]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {!!detail && (
        <Text style={styles.metricDetail} numberOfLines={2}>
          {detail}
        </Text>
      )}
    </View>
  );
}

export function MetricGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metric: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 140,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.brandSurface,
  },
  metricWide: { flexBasis: '23%', minWidth
