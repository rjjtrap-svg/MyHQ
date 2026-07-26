import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Polygon, G } from 'react-native-svg';
import { colors } from '@/src/theme';

/**
 * The app mark — a kabuto (samurai war helmet) with its gold kuwagata horns — as a vector
 * so it can sit inline in headers at any size. Same composition and proportions as the
 * launcher icon, so the in-app mark and the Home Screen icon read as the same thing.
 *
 * Point data is in a 0..100 design space; the horn outline is a sampled curve shared with
 * the icon generator, mirrored for the right-hand blade.
 */
const HORN_POINTS =
  '38.0,58.5 36.9,56.8 35.9,55.1 34.8,53.4 33.8,51.8 32.8,50.1 31.9,48.4 31.0,46.8 30.1,45.1 ' +
  '29.2,43.5 28.3,41.8 27.5,40.2 26.7,38.6 26.0,37.0 25.2,35.4 24.5,33.8 23.8,32.2 23.2,30.6 ' +
  '22.5,29.0 21.9,27.4 21.3,25.8 20.8,24.3 20.3,22.7 19.8,21.2 19.3,19.6 18.8,18.1 18.4,16.6 ' +
  '18.0,15.0 17.7,13.5 17.3,12.0 17.0,10.5 12.0,4.0 20.5,6.2 26.8,11.5 30.0,15.5 30.4,16.9 ' +
  '30.8,18.4 31.3,19.8 31.7,21.2 32.1,22.7 32.6,24.1 33.1,25.5 33.6,26.9 34.1,28.4 34.6,29.8 ' +
  '35.1,31.2 35.6,32.6 36.2,34.0 36.7,35.5 37.3,36.9 37.9,38.3 38.5,39.7 39.1,41.1 39.7,42.5 ' +
  '40.3,43.9 40.9,45.4 41.6,46.8 42.3,48.2 42.9,49.6 43.6,51.0 44.3,52.4 45.0,53.8 45.7,55.2 ' +
  '46.5,56.6 47.2,58.0';

const FUKIGAESHI = '25.5,61.5 15.0,56.0 12.8,43.0 21.5,48.0 27.2,56.0';

/** Neck-guard lames: [topY, bottomY, topHalfWidth, bottomHalfWidth, fill]. */
const SHIKORO: [number, number, number, number, string][] = [
  [53.0, 62.5, 24.5, 29.2, colors.accent],
  [60.5, 70.0, 28.5, 33.0, colors.primary],
  [68.0, 78.0, 32.2, 36.5, colors.accent],
];

export function Emblem({ size = 32, detailed = true }: { size?: number; detailed?: boolean }) {
  const stroke = colors.text;
  const sw = 1.1;

  return (
    // Cropped to the mark's own ink (roughly x 10..90, y 0..82) so it doesn't render with
    // a band of dead space under it when sized inline.
    <Svg width={size} height={size} viewBox="10 0 80 82">
      {/* Shikoro — the flared neck guard, behind everything */}
      {SHIKORO.map(([top, bot, ht, hb, fill], i) => (
        <Polygon
          key={i}
          points={`${50 - ht},${top} ${50 + ht},${top} ${50 + hb},${bot} 50,${bot + 2.2} ${50 - hb},${bot}`}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      ))}

      {/* Fukigaeshi — the upturned wings flanking the brow */}
      <Polygon points={FUKIGAESHI} fill={colors.accent} stroke={stroke} strokeWidth={sw} />
      <G transform="translate(100,0) scale(-1,1)">
        <Polygon points={FUKIGAESHI} fill={colors.accent} stroke={stroke} strokeWidth={sw} />
      </G>

      {/* Hachi — the helmet bowl, a half-ellipse so its base meets the brow flat */}
      <Path
        d="M 27.5 60 A 22.5 34 0 0 1 72.5 60 Z"
        fill={colors.primary}
        stroke={stroke}
        strokeWidth={sw}
      />

      {/* Suji — ribs radiating from the crown */}
      {detailed &&
        [33, 40, 50, 60, 67].map((x) => (
          <Line key={x} x1={50} y1={30.5} x2={x} y2={59.5} stroke={stroke} strokeWidth={0.7} />
        ))}

      {/* Mabizashi — the gilt brow visor */}
      <Polygon
        points="25,55.5 75,55.5 72,64.5 28,64.5"
        fill={colors.gold}
        stroke={stroke}
        strokeWidth={sw}
      />
      {detailed &&
        [34.8, 42.4, 50, 57.6, 65.2].map((x) => (
          <Circle key={x} cx={x} cy={60} r={1.5} fill={stroke} />
        ))}

      {/* Kuwagata — the pair of gold horns, in front */}
      <Polygon points={HORN_POINTS} fill={colors.gold} stroke={stroke} strokeWidth={sw} />
      <G transform="translate(100,0) scale(-1,1)">
        <Polygon points={HORN_POINTS} fill={colors.gold} stroke={stroke} strokeWidth={sw} />
      </G>

      {/* Tehen kanamono — the finial at the crown */}
      <Ellipse cx={50} cy={27} rx={4.2} ry={4.2} fill={colors.gold} stroke={stroke} strokeWidth={sw} />
    </Svg>
  );
}
