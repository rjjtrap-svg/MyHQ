import React, { useEffect } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { motion } from '@/src/theme';

/**
 * Content arriving, rather than being already there.
 *
 * The app had no motion at all outside the progress ring: every screen appeared fully formed
 * the instant it mounted, which is the single biggest reason it read as flat. A short rise
 * and fade gives the eye an order to read things in, and costs nothing to run.
 *
 * Driven by shared values rather than reanimated's layout animations on purpose — the web
 * build is statically pre-rendered, and entering/exiting animations are unreliable through
 * that path.
 *
 * `useReducedMotion` is respected. Someone who has asked their phone to stop moving things
 * has asked this app too.
 */
export function Reveal({
  children,
  delay = 0,
  distance = 12,
  style,
}: {
  children: React.ReactNode;
  /** Stagger offset in ms. Keep the total under ~300ms or the screen feels slow to open. */
  delay?: number;
  distance?: number;
  style?: ViewStyle;
}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: motion.standard, easing: Easing.out(Easing.cubic) })
    );
  }, [delay, progress, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
