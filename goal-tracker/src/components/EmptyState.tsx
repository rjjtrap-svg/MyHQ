import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, radius, spacing, typography } from '@/src/theme';

export function EmptyState({
  icon = 'inbox',
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={styles.icon}>
        <FontAwesome name={icon} size={18} color={colors.primaryMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {!!actionLabel && !!onAction && (
        <Button label={actionLabel} onPress={onAction} size="sm" style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.cardTitle, color: colors.textPrimary, textAlign: 'center' },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: spacing.xs,
    maxWidth: 360,
  },
  action: { marginTop: spacing.lg },
});
