import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Banner } from '@/src/components/Banner';
import { Section } from '@/src/components/Section';
import { PaceStatus } from '@/src/types';
import { colors, radius, spacing, typography } from '@/src/theme';

const TARGETS = [40, 60, 80, 100] as const;

function paceCopy(pace: PaceStatus, paceDelta: number): string {
  const distance = Math.abs(Math.round(paceDelta));
  if (pace === 'ahead') return `${distance} ahead of plan`;
  if (pace === 'behind') return `${distance} behind plan`;
  return 'Right on plan';
}

export function RollOut({
  why,
  requiredPerDay,
  pace,
  paceDelta,
  callbackCount,
  doorTarget,
  onDoorTargetChange,
}: {
  why?: string;
  requiredPerDay: number;
  pace: PaceStatus;
  paceDelta: number;
  callbackCount: number;
  doorTarget: number | null;
  onDoorTargetChange: (target: number) => void;
}) {
  const required = Math.max(0, Math.ceil(requiredPerDay));

  return (
    <>
      <View style={styles.whyRow}>
        <Text style={styles.whyLabel}>Your why</Text>
        <Text style={styles.whyText} numberOfLines={1}>
          {why || 'Open Lock In when you are ready to put your reason into words.'}
        </Text>
      </View>

      <Section title="What today needs">
        <View style={styles.needCard}>
          <Text style={styles.needValue}>{required}</Text>
          <View style={styles.needCopy}>
            <Text style={styles.needLabel}>Sales today</Text>
            <Text style={styles.pace}>{paceCopy(pace, paceDelta)}</Text>
          </View>
        </View>
        {callbackCount > 0 ? (
          <Banner
            message={`${callbackCount} door${callbackCount === 1 ? '' : 's'} owe${callbackCount === 1 ? 's' : ''} you a second visit.`}
            tone="info"
            align="left"
          />
        ) : null}
      </Section>

      <Section title="Door target">
        <Text style={styles.invitation}>Pick the number that makes today concrete.</Text>
        <View style={styles.targets}>
          {TARGETS.map((target) => {
            const selected = target === doorTarget;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={target}
                onPress={() => onDoorTargetChange(target)}
                style={[styles.target, selected && styles.targetSelected]}
              >
                <Text style={[styles.targetValue, selected && styles.targetValueSelected]}>{target}</Text>
                <Text style={[styles.targetLabel, selected && styles.targetLabelSelected]}>Doors</Text>
              </Pressable>
            );
          })}
        </View>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  whyRow: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  whyLabel: { ...typography.eyebrow, color: colors.gold },
  whyText: { ...typography.caption, color: colors.textMuted, flex: 1 },
  needCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  needValue: { ...typography.scoreValue, fontSize: 52, color: colors.text },
  needCopy: { flex: 1, gap: spacing.xs },
  needLabel: { ...typography.eyebrow, color: colors.text },
  pace: { ...typography.caption, color: colors.textMuted },
  invitation: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },
  targets: { flexDirection: 'row', gap: spacing.sm },
  target: {
    flex: 1,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  targetSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  targetValue: { ...typography.scoreValue, fontSize: 25, color: colors.text },
  targetValueSelected: { color: colors.onPrimary },
  targetLabel: { ...typography.eyebrow, fontSize: 9, color: colors.textMuted },
  targetLabelSelected: { color: colors.primaryMuted },
});
