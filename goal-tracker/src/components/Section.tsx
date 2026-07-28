import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';
import { Reveal } from './Reveal';
import { colors, spacing, typography } from '@/src/theme';

interface SectionProps extends ViewProps {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  /**
   * Stagger position. Pass the section's index down a screen and the page assembles top to
   * bottom instead of snapping into place all at once. Capped so a long screen still opens
   * quickly — past the fifth section nobody is watching the animation, they're scrolling.
   */
  index?: number;
}

/**
 * Section headers are set as patch lettering — small caps, wide tracking, with a hairline
 * running out to the right. It's the one structural device repeated on every screen, so the
 * app reads as one thing rather than a stack of unrelated card lists.
 */
export function Section({ title, right, children, style, index = 0, ...rest }: SectionProps) {
  return (
    <Reveal delay={Math.min(index, 5) * 55}>
      <View style={[styles.container, style]} {...rest}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.rule} />
          {right}
        </View>
        {children}
      </View>
    </Reveal>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
});
