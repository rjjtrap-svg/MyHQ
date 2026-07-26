import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/src/theme';

/**
 * A band of the seigaiha (overlapping wave-scale) motif from the app icon, used as a
 * section divider. It's the one ornament that repeats app-wide, so screens read as part
 * of the same crest/patch family rather than as generic rounded cards.
 *
 * Drawn as nested arcs per scale rather than a tiled image so it inherits theme colors
 * and stays crisp at any width.
 */
export function WaveRule({
  height = 18,
  color = colors.accent,
  scaleWidth = 44,
  style,
}: {
  height?: number;
  color?: string;
  scaleWidth?: number;
  style?: any;
}) {
  const count = 14;
  const r = scaleWidth / 2;
  const arcs: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const cx = i * r;
    // Three concentric arcs per scale; alternating scales sit half a step over so the
    // rows interlock the way the woodblock pattern does.
    for (const frac of [1, 0.66, 0.33]) {
      const rr = r * frac;
      arcs.push(`M ${cx - rr} ${height} A ${rr} ${rr} 0 0 1 ${cx + rr} ${height}`);
    }
  }

  return (
    <View style={[{ height, overflow: 'hidden' }, style]}>
      <Svg width="100%" height={height} viewBox={`0 0 ${count * r} ${height}`} preserveAspectRatio="xMidYMax slice">
        {arcs.map((d, i) => (
          <Path key={i} d={d} stroke={color} strokeWidth={1.6} fill="none" />
        ))}
      </Svg>
    </View>
  );
}
