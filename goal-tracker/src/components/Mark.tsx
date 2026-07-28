import React from 'react';
import Svg, { Circle, Rect } from 'react-native-svg';
import { colors } from '@/src/theme';

/**
 * The app mark: a door, abstracted.
 *
 * This replaces the ouroboros dragon, which was an illustration — a few hundred hand-drawn
 * polygons that read as a cartoon at every size it was actually used at, and carried no
 * meaning for the people using the app.
 *
 * A door is the one object every rep touches a hundred times a day, so the mark now says
 * what the product is about. It's built from three primitives on purpose: a frame, a handle,
 * and a strip of light through the gap. Geometry stays legible at 20px in a header and at
 * 92px on the sign-in screen, where linework at that scale would fall apart.
 *
 * Gold is the frame because gold is the brand thread everywhere else in the app; the light
 * is `primary` because that's the colour of everything you're meant to act on.
 */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Tall and narrow. A square frame reads as a card or a battery, not a door. */}
      <Rect
        x={5.4}
        y={1.7}
        width={13.2}
        height={20.6}
        rx={2.2}
        fill={colors.brandSurface}
        stroke={colors.gold}
        strokeWidth={1.8}
      />
      {/* The gap. An open door is the whole job. Kept thin so it reads as light, not a bar. */}
      <Rect x={7.7} y={4.3} width={1.5} height={15.4} rx={0.75} fill={colors.primary} />
      <Circle cx={15.7} cy={12} r={1.25} fill={colors.gold} />
    </Svg>
  );
}
