import React, { useEffect, useMemo, useRef } from 'react';
import type { ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { splashImages } from '../../assets/splash';
import { useTheme } from '../../theme';
import type {
  AnimatedSplashProps,
  InterpolationRanges,
} from './AnimatedSplash.types';
import {
  DURATION_MS,
  LAST_FRAME,
  REST_FRAME,
  backdropOpacityTrack,
  burstOpacityTrack,
  burstScaleTrack,
  buttonRedTrack,
  buttonWhiteTrack,
  coreOpacityTrack,
  dropTrack,
  flashOpacityTrack,
  geometry,
  lidTrack,
  overlayOpacityTrack,
  sampleKeyframes,
  shadowOpacityTrack,
  shadowScaleTrack,
  shockwaveOpacityTrack,
  shockwaveScaleTrack,
  wobbleTrack,
} from './splashTimeline';

/** Same colour as the native splash (LaunchScreen.storyboard, Android `splash_background`). */
export const SPLASH_BACKGROUND = '#100B1E';

const SHOCKWAVE_COLOR = '#FFD9E0';
/** The contact shadow is a soft hint, not a dark spot. */
const SHADOW_STRENGTH = 0.6;
const REDUCED_MOTION_HOLD_MS = 500;
const REDUCED_MOTION_FADE_MS = 300;
/** 2D stand-in for the 3D hinge: how far the lid turns, lifts and foreshortens when open. */
const LID_ROTATION_DEG = -40;
const LID_LIFT = 0.25;
const LID_FORESHORTEN = 0.3;

const ranges = {
  backdrop: sampleKeyframes(backdropOpacityTrack),
  burstOpacity: sampleKeyframes(burstOpacityTrack),
  burstScale: sampleKeyframes(burstScaleTrack),
  buttonRed: sampleKeyframes(buttonRedTrack),
  buttonWhite: sampleKeyframes(buttonWhiteTrack),
  core: sampleKeyframes(coreOpacityTrack),
  drop: sampleKeyframes(dropTrack),
  flash: sampleKeyframes(flashOpacityTrack),
  lid: sampleKeyframes(lidTrack),
  overlay: sampleKeyframes(overlayOpacityTrack),
  shadow: sampleKeyframes(shadowScaleTrack),
  shadowOpacity: sampleKeyframes(shadowOpacityTrack),
  shockwaveOpacity: sampleKeyframes(shockwaveOpacityTrack),
  shockwaveScale: sampleKeyframes(shockwaveScaleTrack),
  wobble: sampleKeyframes(wobbleTrack),
};

/** Position of a canvas point as a percentage, for `transformOrigin`. */
const canvasPercent = (offsetFromCentre: number) =>
  `${((geometry.canvas / 2 + offsetFromCentre) / geometry.canvas) * 100}%`;

const LID_ORIGIN = [
  canvasPercent(geometry.seamLeft.x),
  canvasPercent(geometry.seamLeft.y),
  0,
];
/** The sphere wobbles on its contact point with the floor. */
const WOBBLE_ORIGIN = ['50%', canvasPercent(geometry.radius), 0];

/**
 * Launch animation of the Lumen sphere: it drops in, wobbles twice as if capturing,
 * clicks, opens and releases a light that fills the screen with the app background.
 *
 * Every property is driven by one `frame` value (30 fps) on the native driver, so JS
 * work behind it (the first data fetch) cannot make it stutter. With "Reduce motion"
 * the sphere is shown at rest and the overlay simply fades out.
 */
export const AnimatedSplash = ({ onFinish }: AnimatedSplashProps) => {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const frame = useRef(new Animated.Value(0)).current;
  const reducedMotionFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    let animation: Animated.CompositeAnimation | undefined;

    const start = (reduceMotion: boolean) => {
      if (cancelled) {
        return;
      }
      if (reduceMotion) {
        frame.setValue(REST_FRAME);
        animation = Animated.timing(reducedMotionFade, {
          toValue: 0,
          delay: REDUCED_MOTION_HOLD_MS,
          duration: REDUCED_MOTION_FADE_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        });
      } else {
        animation = Animated.timing(frame, {
          toValue: LAST_FRAME,
          duration: DURATION_MS,
          easing: Easing.linear,
          useNativeDriver: true,
        });
      }
      animation.start(({ finished }) => {
        if (finished) {
          onFinish();
        }
      });
    };

    AccessibilityInfo.isReduceMotionEnabled().then(start, () => start(false));
    return () => {
      cancelled = true;
      animation?.stop();
    };
  }, [frame, reducedMotionFade, onFinish]);

  const layout = useMemo(() => {
    // World units -> dp, fitting the Blender frame (5.4 x 11.7) inside the screen.
    const unit = Math.min(
      width / geometry.screenWidth,
      height / geometry.screenHeight,
    );
    const canvas = geometry.canvas * unit;
    // Start fully above the screen, whatever its aspect ratio.
    const dropStart = Math.max(
      geometry.dropHeight * unit,
      height / 2 + canvas / 2,
    );
    return {
      unit,
      canvas,
      dropStart,
      centreX: width / 2,
      centreY: height / 2,
    };
  }, [width, height]);

  const motion = useMemo(() => {
    const { unit, dropStart } = layout;
    const value = (r: InterpolationRanges, scale = 1) =>
      frame.interpolate({
        inputRange: r.inputRange,
        outputRange: r.outputRange.map(v => v * scale),
        extrapolate: 'clamp',
      });
    const degrees = (r: InterpolationRanges, scale = 1) =>
      frame.interpolate({
        inputRange: r.inputRange,
        outputRange: r.outputRange.map(v => `${v * scale}deg`),
        extrapolate: 'clamp',
      });
    const lidScaleY = frame.interpolate({
      inputRange: ranges.lid.inputRange,
      outputRange: ranges.lid.outputRange.map(v => 1 - v * LID_FORESHORTEN),
      extrapolate: 'clamp',
    });

    return {
      overlay: Animated.multiply(value(ranges.overlay), reducedMotionFade),
      backdrop: value(ranges.backdrop),
      dropY: value(ranges.drop, -dropStart),
      shadowScale: value(ranges.shadow),
      shadowOpacity: value(ranges.shadowOpacity, SHADOW_STRENGTH),
      wobble: degrees(ranges.wobble),
      core: value(ranges.core),
      lidRotate: degrees(ranges.lid, LID_ROTATION_DEG),
      lidLift: value(ranges.lid, -LID_LIFT * unit),
      lidScaleY,
      buttonRed: value(ranges.buttonRed),
      buttonWhite: value(ranges.buttonWhite),
      shockwaveScale: value(ranges.shockwaveScale),
      shockwaveOpacity: value(ranges.shockwaveOpacity),
      burstScale: value(ranges.burstScale),
      burstOpacity: value(ranges.burstOpacity),
      flash: value(ranges.flash),
    };
  }, [frame, reducedMotionFade, layout]);

  const { unit, canvas, centreX, centreY } = layout;
  const centred = (size: number, offsetY = 0, aspect = 1, offsetX = 0) => ({
    position: 'absolute' as const,
    width: size,
    height: size * aspect,
    left: centreX + offsetX - size / 2,
    top: centreY + offsetY - (size * aspect) / 2,
  });
  const shockwaveSize = 2 * geometry.radius * 1.05 * unit;

  return (
    <Animated.View
      testID="animated-splash"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      // Fade the layers as one image; Android otherwise fades each child and the
      // sphere shows through the flash. Only costs while opacity < 1 (the last fade).
      needsOffscreenAlphaCompositing
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: SPLASH_BACKGROUND, opacity: motion.overlay },
      ]}
    >
      <Layer
        source={splashImages.backdrop}
        style={[styles.fill, { opacity: motion.backdrop }]}
        resizeMode="cover"
      />
      <Layer
        source={splashImages.shadow}
        style={[
          centred(2.6 * unit, (geometry.radius - 0.05) * unit, 0.27),
          {
            opacity: motion.shadowOpacity,
            transform: [{ scale: motion.shadowScale }],
          },
        ]}
      />

      <Animated.View
        style={[centred(canvas), { transform: [{ translateY: motion.dropY }] }]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              transformOrigin: WOBBLE_ORIGIN,
              transform: [{ rotate: motion.wobble }],
            },
          ]}
        >
          {/* Paint order: core, lid, lower half, seam, button. */}
          <Layer
            source={splashImages.core}
            style={[styles.fill, { opacity: motion.core }]}
          />
          <Layer
            source={splashImages.top}
            style={[
              styles.fill,
              {
                transformOrigin: LID_ORIGIN,
                transform: [
                  { translateY: motion.lidLift },
                  { rotate: motion.lidRotate },
                  { scaleY: motion.lidScaleY },
                ],
              },
            ]}
          />
          <Layer source={splashImages.bottom} style={styles.fill} />
          {/* Visible part of the glowing seam, in front of the inside of the lid. */}
          <Layer
            source={splashImages.seam}
            style={[styles.fill, { opacity: motion.core }]}
          />
          <Layer source={splashImages.button} style={styles.fill} />
          <Layer
            source={splashImages.buttonRed}
            style={[styles.fill, { opacity: motion.buttonRed }]}
          />
          <Layer
            source={splashImages.buttonWhite}
            style={[styles.fill, { opacity: motion.buttonWhite }]}
          />
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[
          centred(shockwaveSize),
          styles.shockwave,
          {
            borderRadius: shockwaveSize / 2,
            borderWidth: Math.max(1.5, 0.024 * unit),
            opacity: motion.shockwaveOpacity,
            transform: [{ scale: motion.shockwaveScale }],
          },
        ]}
      />
      <Layer
        source={splashImages.burst}
        style={[
          // Born on the button: the click releases the light.
          centred(
            unit,
            geometry.burstOrigin.y * unit,
            1,
            geometry.burstOrigin.x * unit,
          ),
          {
            opacity: motion.burstOpacity,
            transform: [{ scale: motion.burstScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.background, opacity: motion.flash },
        ]}
      />
    </Animated.View>
  );
};

type LayerProps = {
  source: ImageSourcePropType;
  style: StyleProp<Animated.WithAnimatedValue<ImageStyle>>;
  resizeMode?: 'contain' | 'cover';
};

/** A decorative image layer. `fadeDuration` 0 stops Android fading images in on load. */
const Layer = ({ source, style, resizeMode = 'contain' }: LayerProps) => (
  <Animated.Image
    source={source}
    style={style}
    resizeMode={resizeMode}
    fadeDuration={0}
  />
);

const styles = StyleSheet.create({
  // Images get their intrinsic size as default width/height, which beats left/right/
  // top/bottom; an explicit 100% size makes a layer really fill its parent.
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  shockwave: { borderColor: SHOCKWAVE_COLOR },
});
