import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

const TRANSITION_MS = 280;

/**
 * Animated colour that fades from the previous value to `color` whenever it
 * changes (FR-309). Colours cannot run on the native driver, so this runs on
 * JS: a short, occasional fade, not a per-frame scroll effect. With "Reduce
 * motion" the colour changes at once.
 */
export const useColorTransition = (color: string) => {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(1)).current;
  const [range, setRange] = useState<[string, string]>([color, color]);

  // Derived state: a new target starts a new range from the last target.
  if (range[1] !== color) {
    setRange([range[1], color]);
  }

  useLayoutEffect(() => {
    if (range[0] === range[1] || reduceMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: TRANSITION_MS,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [range, reduceMotion, progress]);

  return useMemo(
    () => progress.interpolate({ inputRange: [0, 1], outputRange: range }),
    [progress, range],
  );
};
