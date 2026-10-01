import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

export type ChevronDirection = 'left' | 'up' | 'right' | 'down';

type ChevronProps = {
  direction: ChevronDirection;
  /** Length of each arm, in points. */
  size?: number;
  color: string;
  strokeWidth?: number;
};

const ROTATION: Record<ChevronDirection, string> = {
  left: '-45deg',
  up: '45deg',
  right: '135deg',
  down: '-135deg',
};

/** Unit vector the chevron points to; used to centre it optically. */
const POINTING: Record<ChevronDirection, { x: number; y: number }> = {
  left: { x: -1, y: 0 },
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
};

/**
 * Chevron drawn with two borders of a rotated square: crisp at any size and
 * identical on both platforms, with no icon font or image asset.
 */
const ChevronComponent = ({
  direction,
  size = 12,
  color,
  strokeWidth = 2.5,
}: ChevronProps) => {
  // The rotated corner sits off-centre: shift it back so the glyph looks centred.
  const shift = size * 0.22;
  const { x, y } = POINTING[direction];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.arms,
        {
          width: size,
          height: size,
          borderColor: color,
          borderLeftWidth: strokeWidth,
          borderTopWidth: strokeWidth,
          transform: [
            { translateX: -x * shift },
            { translateY: -y * shift },
            { rotate: ROTATION[direction] },
          ],
        },
      ]}
    />
  );
};

export const Chevron = memo(ChevronComponent);

const styles = StyleSheet.create({
  arms: { borderRadius: 1.5 },
});
