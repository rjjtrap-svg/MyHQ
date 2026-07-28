import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/src/theme';

// Monday-first, because `startOfWeek` in src/lib/dates.ts is Monday-first and every weekly
// number in the app is computed from it. A Sunday-first strip sitting next to a Monday-based
// "this week" count would quietly disagree with itself.
const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * The week, as a strip.
 *
 * Both apps this is drawn from open with one, and for a daily goal it earns its place better
 * here than it does there: a rep's question at 4pm is never "how am I doing overall", it's
 * "have I done today, and how does it sit against the rest of the week".
 *
 * Days with sales carry a filled dot. That's the whole encoding — no counts, no colour
 * scale. A row of seven numbers is a table, and a table is something you read; this is
 * something you glance at.
 */
export function DayStrip({
  /** Seven sales counts, index 0 = Monday. */
  counts,
  /** Days elapsed since Monday, 0–6. */
  todayIndex,
}: {
  counts: number[];
  todayIndex: number;
}) {
  return (
    <View style={styles.row} accessibilityRole="summary" accessibilityLabel="This week's sales">
      {LETTERS.map((letter, i) => {
        const isToday = i === todayIndex;
        const count = counts[i] ?? 0;
        return (
          <View key={`${letter}-${i}`} style={styles.day}>
            <Text style={[styles.letter, isToday && styles.letterToday]}>{letter}</Text>
            <View
              style={[
                styles.dot,
                count > 0 && styles.dotFilled,
                isToday && styles.dotToday,
                isToday && count > 0 && styles.dotTodayFilled,
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  day: {
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  letter: {
    ...typography.badge,
    fontSize: 11,
    color: colors.textFaint,
  },
  letterToday: {
    color: colors.text,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.round,
    backgroundColor: colors.borderStrong,
  },
  dotFilled: {
    backgroundColor: colors.textSecondary,
  },
  // Today is a ring rather than a bigger dot — size differences at 6px read as noise.
  dotToday: {
    width: 8,
    height: 8,
    borderWidth: 1.5,
    borderColor: colors.text,
    backgroundColor: 'transparent',
  },
  dotTodayFilled: {
    backgroundColor: colors.text,
  },
});
