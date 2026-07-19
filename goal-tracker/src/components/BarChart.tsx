import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/src/theme';

export interface BarChartDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartDatum[];
  height?: number;
  color?: string;
  highlightLastBar?: boolean;
}

export function BarChart({ data, height = 140, color = colors.primary, highlightLastBar = true }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <View style={[styles.row, { height: height + 24 }]}>
      {data.map((d, i) => {
        const barHeight = d.value === 0 ? 3 : Math.max(6, (d.value / max) * height);
        const isLast = highlightLastBar && i === data.length - 1;
        return (
          <View key={`${d.label}-${i}`} style={styles.column}>
            {d.value > 0 && <Text style={styles.valueLabel}>{d.value}</Text>}
            <View style={{ height, justifyContent: 'flex-end', width: '100%', alignItems: 'center' }}>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: isLast ? colors.accent : color,
                  },
                ]}
              />
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: '55%',
    maxWidth: 20,
    borderRadius: 5,
  },
  valueLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    color: colors.textFaint,
    marginTop: spacing.xs,
  },
});
