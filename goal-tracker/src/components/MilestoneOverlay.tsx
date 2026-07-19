import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { FontAwesome } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/src/theme';

interface MilestoneOverlayProps {
  milestone: number | null;
  salesGoal: number;
  onDismiss: () => void;
}

export function MilestoneOverlay({ milestone, salesGoal, onDismiss }: MilestoneOverlayProps) {
  const { width } = useWindowDimensions();
  const cannonRef = useRef<ConfettiCannon>(null);

  if (milestone === null) return null;

  const isGoal = milestone >= salesGoal;
  const title = isGoal ? 'GOAL REACHED' : `${milestone} SALES`;
  const subtitle = isGoal
    ? "You hit your sales goal. That's the whole mission, done."
    : `${milestone} deals in the books. Keep the streak alive.`;

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
            <FontAwesome name={isGoal ? 'trophy' : 'star'} size={32} color={colors.gold} />
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
    backgroundColor: '#F5B94222',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
    letterSpacing: 1,
    marginBottom: spacing.sm,
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
