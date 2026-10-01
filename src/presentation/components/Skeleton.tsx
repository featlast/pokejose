import React, { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { useTheme } from '../theme';

type SkeletonProps = { style?: StyleProp<ViewStyle> };

const SWEEP_MS = 1200;
const BAND_RATIO = 0.45;
const MIN_BAND_WIDTH = 40;

/**
 * Placeholder block with a shimmer: a translucent, slanted band sweeps across it.
 * Core has no LinearGradient, so the band is a plain view moved with `translateX`
 * on the native driver. Decorative, so hidden from screen readers.
 */
export const Skeleton = ({ style }: SkeletonProps) => {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (reduceMotion || width === 0) {
      return;
    }
    progress.setValue(0);
    const sweep = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: SWEEP_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );
    sweep.start();
    return () => sweep.stop();
  }, [progress, reduceMotion, width]);

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  const bandWidth = Math.max(width * BAND_RATIO, MIN_BAND_WIDTH);
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-bandWidth * 1.5, width + bandWidth * 0.5],
  });

  return (
    <View
      testID="skeleton"
      onLayout={onLayout}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.base, { backgroundColor: colors.skeleton }, style]}
    >
      {width > 0 && !reduceMotion ? (
        <Animated.View
          style={[
            styles.band,
            {
              width: bandWidth,
              backgroundColor: colors.shimmer,
              transform: [{ translateX }, { rotate: '18deg' }],
            },
          ]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  band: { position: 'absolute', top: '-50%', height: '200%' },
});
