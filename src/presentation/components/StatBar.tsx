import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import type { PokemonStat } from '../../domain/models';
import { radius, spacing, useTheme } from '../theme';
import { MAX_BASE_STAT, STAT_LABELS } from '../utils/formatters';
import { AppText } from './AppText';

type StatBarProps = { stat: PokemonStat; color: string };

const StatBarComponent = ({ stat, color }: StatBarProps) => {
  const { colors } = useTheme();
  const fill = useRef(new Animated.Value(0)).current;
  const ratio = Math.min(stat.baseValue / MAX_BASE_STAT, 1);
  const label = STAT_LABELS[stat.name];

  useEffect(() => {
    // scaleX from the left edge keeps the animation on the native driver.
    Animated.timing(fill, {
      toValue: ratio,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fill, ratio]);

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label.long}
      accessibilityValue={{ min: 0, max: MAX_BASE_STAT, now: stat.baseValue }}
    >
      <AppText
        variant="caption"
        color={colors.textSecondary}
        style={styles.label}
      >
        {label.short}
      </AppText>
      <AppText variant="label" style={styles.value}>
        {stat.baseValue}
      </AppText>
      <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: color, transform: [{ scaleX: fill }] },
          ]}
        />
      </View>
    </View>
  );
};

export const StatBar = memo(StatBarComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 28,
  },
  label: { width: 40 },
  value: { width: 36, textAlign: 'right' },
  track: {
    flex: 1,
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.pill,
    transformOrigin: 'left',
  },
});
