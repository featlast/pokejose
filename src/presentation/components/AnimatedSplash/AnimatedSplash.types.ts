import type { EasingFunction } from 'react-native';

/**
 * A value at a given frame (30 fps). `easing` shapes the segment that starts at this
 * keyframe, like the interpolation mode of a Blender keyframe. Linear when omitted.
 */
export type Keyframe = {
  frame: number;
  value: number;
  easing?: EasingFunction;
};

/** Input for `Animated.Value.interpolate`, with eased segments pre-sampled. */
export type InterpolationRanges = {
  inputRange: number[];
  outputRange: number[];
};

export type AnimatedSplashProps = {
  /** Called once the splash has faded out and can be unmounted. */
  onFinish: () => void;
};
