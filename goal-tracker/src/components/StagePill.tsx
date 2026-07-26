import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DealStage } from '@/src/types';
import { colors, radius, spacing } from '@/src/theme';

const STAGE_LABELS: Record<DealStage, string> = {
  sold: 'Sold',
  installed: 'Installed',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

const STAGE_ORDER: DealStage[] = ['sold', 'installed', 'paid'];

export function StagePillRow({ stage, onAdvance }: { stage: DealStage; onAdvance: (stage: DealStage) => void }) {
  const currentIndex = STAGE_ORDER.indexOf(stage);

  // Cancelled sits outside the pipeline — showing the forward pills next to it would imply
  // the deal is still moving.
  if (stage === 'cancelled') {
    return (
      <View style={styles.row}>
        <View style={[styles.pill, styles.pillCancelled]}>
          <Text style={[styles.pillText, styles.pillTextCancelled]}>Cancelled</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {STAGE_ORDER.map((s, i) => {
        const done = i <= currentIndex;
        const isNext = i === currentIndex + 1;
        return (
          <Pressable
            key={s}
            disabled={!isNext}
            onPress={() => onAdvance(s)}
            style={[styles.pill, done && styles.pillDone, isNext && styles.pillNext]}
          >
            <Text style={[styles.pillText, done && styles.pillTextDone, isNext && styles.pillTextNext]}>
              {STAGE_LABELS[s]}
              {isNext ? ' →' : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillDone: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  pillCancelled: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
  },
  pillTextCancelled: {
    color: colors.dangerText,
  },
  pillNext: {
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textFaint,
  },
  pillTextDone: {
    color: colors.primary,
  },
  pillTextNext: {
    color: colors.accent,
  },
});
