import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '@/src/theme';

/**
 * The app mark: a modern house, black and white.
 *
 * A single-slope shed roof with a deep eave, not a symmetrical gable — a gable is the
 * pictogram every "home" button in every app already uses, and this needs to read as a
 * house someone knocks on rather than as a nav icon. The asymmetry is the whole tell.
 *
 * The door is the only filled element, because the door is the job.
 *
 * Monochrome on purpose. Colour in this app means something — gold is achievement, blue is
 * the action, amber is behind pace — and a mark that borrows any of them competes with the
 * data. White on the background borrows nothing.
 */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Walls. Open at the top so the roof line reads as a separate plane sitting on them. */}
      <Path
        d="M3.4 12.6 V21 H20.6 V6.9"
        stroke={colors.text}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* The roof, overhanging both walls. The cantilever is what makes it modern. */}
      <Path
        d="M1.8 13.2 L22.2 6.3"
        stroke={colors.text}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
      {/* Ground line, so the house sits on something instead of floating. */}
      <Path
        d="M2.2 21 H21.8"
        stroke={colors.text}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Rect x={6.6} y={14.7} width={4.3} height={6.3} rx={0.5} fill={colors.text} />
    </Svg>
  );
}
