import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { FontAwesome } from '@expo/vector-icons';
import { DAILY_SALE_ALERTS } from '@/src/types';
import { colors, radius, spacing, typography } from '@/src/theme';

type DailyAlert = (typeof DAILY_SALE_ALERTS)[number];

interface MilestoneOverlayProps {
  /** A career milestone total (10/25/50…), or null. */
  milestone: number | null;
  /** A same-day streak alert (Heating Up, On Fire…), or null. */
  dailyAlert?: DailyAlert | null;
  salesGoal: number;
  onDismiss: () => void;
}

export function MilestoneOverlay({ milestone, dailyAlert, salesGoal, onDismiss }: MilestoneOverlayProps) {
  const { width } = useWindowDimensions();
  const cannonRef = useRef<ConfettiCannon>(null);

  if (!dailyAlert && milestone === null) return null;

  // A same-day streak wins the tie — it's the more immediate thing that just happened.
  const isDaily = !!dailyAlert;
  const isGoal = !isDaily && milestone !== null && milestone >= salesGoal;

  const title = isDaily ? dailyAlert.title : isGoal ? 'GOAL REACHED' : `${milestone} SALES`;
  const subtitle = isDaily
    ? dailyAlert.blurb
    : isGoal
      ? "You hit your sales goal. That's the whole mission, done."
      : `${milestone} deals in the books. Keep the streak alive.`;
  const icon = isDaily ? 'fire' : isGoal ? 'trophy' : 'star';

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <ConfettiCannon
        ref={cannonRef}
        count={140}
        origin={{ x: width / 2, y: -10 }}
        fadeOut
        fallSpeed={2600}
      />
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <FontAwesome name={icon} size={32} color={colors.gold} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text style={styles.tapHint}>Tap to continue</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6,7,10,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#C6862E22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  tapHint: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
