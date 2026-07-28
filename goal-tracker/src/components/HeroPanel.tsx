import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, layout, radius, spacing, typography } from '@/src/theme';

export type HeroTone = 'dawn' | 'dusk';

/**
 * A panel where the surface itself carries the screen, instead of a bordered card sitting on
 * a flat page.
 *
 * The apps this is drawn from lead with a full-bleed image and hang the type off the bottom
 * of it. This app has no photography to lead with — it has numbers — so the gradient does
 * that job: it fills the top of the screen, dissolves into the background rather than ending
 * on a hairline, and gives the headline something to sit on.
 *
 * `tone` is not decoration. `dawn` is the morning, heading out; `dusk` is the evening,
 * closing down. Someone opening this at 7am and at 9pm should not get the same screen.
 */
export function HeroPanel({
  tone = 'dawn',
  eyebrow,
  title,
  detail,
  children,
  style,
}: {
  tone?: HeroTone;
  eyebrow?: string;
  /** The one thing this screen is about. Set large — this is the display voice. */
  title: string;
  detail?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <LinearGradient
      colors={tone === 'dawn' ? colors.gradientDawn : colors.gradientDusk}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.panel, style]}
    >
      <View style={styles.body}>
        {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.title}>{title}</Text>
        {!!detail && <Text style={styles.detail}>{detail}</Text>}
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: radius.xl,
    // No border. The whole point is that this reads as a surface rather than a card, and a
    // hairline around a gradient is what makes it look like a card again.
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: layout.cardPadding + 2,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  body: {
    gap: spacing.xs,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.textMuted,
  },
  title: {
    ...typography.metricHero,
    fontSize: 40,
    lineHeight: 44,
    color: colors.text,
    marginTop: spacing.xs,
  },
  detail: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
});
