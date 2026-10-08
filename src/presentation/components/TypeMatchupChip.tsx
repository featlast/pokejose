import React, { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { TypeMatchup } from '../../domain/models';
import { typeIcons } from '../assets/types';
import {
  TYPE_APPEARANCE,
  fontFamily,
  radius,
  spacing,
  useTheme,
} from '../theme';
import { describeMultiplier, formatMultiplier } from '../utils/formatters';
import { AppText } from './AppText';

const DOT_SIZE = 28;
const ICON_SIZE = 16;

/** ×4 and ×¼ stand out with a border in the type's colour (FR-404). */
const isExtreme = (multiplier: number) =>
  multiplier >= 4 || (multiplier > 0 && multiplier <= 0.25);

/** Attacking type and its damage multiplier, e.g. [🔥] Fuego ×2. */
const TypeMatchupChipComponent = ({ matchup }: { matchup: TypeMatchup }) => {
  const { colors } = useTheme();
  const { type, multiplier } = matchup;
  const { color, label } = TYPE_APPEARANCE[type];

  return (
    <View
      testID={`type-matchup-${type}`}
      accessible
      accessibilityLabel={`${label}, ${describeMultiplier(multiplier)}`}
      style={[
        styles.chip,
        { backgroundColor: colors.surfaceMuted },
        isExtreme(multiplier) && { borderColor: color },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]}>
        <Image
          source={typeIcons[type]}
          style={styles.icon}
          fadeDuration={0}
          accessibilityIgnoresInvertColors
        />
      </View>
      <AppText variant="label">{label}</AppText>
      <AppText variant="label" style={styles.multiplier}>
        {formatMultiplier(multiplier)}
      </AppText>
    </View>
  );
};

export const TypeMatchupChip = memo(TypeMatchupChipComponent);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: ICON_SIZE, height: ICON_SIZE },
  // Intro has one weight per family: emphasis is the display family.
  multiplier: { fontFamily: fontFamily.display },
});
