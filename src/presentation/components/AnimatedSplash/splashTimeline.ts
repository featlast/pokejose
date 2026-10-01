import { Easing } from 'react-native';
import type { InterpolationRanges, Keyframe } from './AnimatedSplash.types';

/**
 * Timeline of the splash, transcribed from the Blender animation.
 * Frames are at 30 fps; lengths are in "world units" of the Blender scene, where the
 * screen is 5.4 units wide.
 */
export const FPS = 30;
/** 100 frames of animation plus the fade-out of the overlay. */
export const LAST_FRAME = 108;
/** Frame where the sphere rests before the capture wobble (used by reduced motion). */
export const REST_FRAME = 30;
export const DURATION_MS = (LAST_FRAME / FPS) * 1000;

export const geometry = {
  /** Width of the Blender frame in world units. */
  screenWidth: 5.4,
  /** Height of the Blender frame in world units. */
  screenHeight: 11.7,
  /** Sphere radius. */
  radius: 1.22,
  /** Side of the square canvas every sphere layer is rendered on. */
  canvas: 3.172,
  /** Height the sphere drops from in the Blender scene. */
  dropHeight: 8.5,
  /** Left end of the seam, from the sphere centre (x right, y down). */
  seamLeft: { x: -1.209, y: -0.159 },
  /**
   * Centre of the button, from the sphere centre (x right, y down): the light burst
   * is born there. Measured on the button layer (matches the 3D position in Blender).
   */
  burstOrigin: { x: 0.339, y: -0.268 },
} as const;

const fall = Easing.in(Easing.quad);
const rise = Easing.out(Easing.quad);
const smooth = Easing.inOut(Easing.ease);

/** Sphere height above its resting point, in world units (1 = the drop height). */
export const dropTrack: Keyframe[] = [
  { frame: 0, value: 1, easing: fall },
  { frame: 12, value: 0, easing: rise },
  { frame: 18, value: 1 / 8.5, easing: fall },
  { frame: 23, value: 0, easing: rise },
  { frame: 26, value: 0.25 / 8.5, easing: fall },
  { frame: 29, value: 0 },
];

export const shadowScaleTrack: Keyframe[] = [
  { frame: 0, value: 0.2, easing: smooth },
  { frame: 12, value: 1, easing: smooth },
  { frame: 18, value: 0.75, easing: smooth },
  { frame: 23, value: 1, easing: smooth },
  { frame: 26, value: 0.93, easing: smooth },
  { frame: 29, value: 1 },
];

/** The shadow fades in as the sphere approaches the floor. */
export const shadowOpacityTrack: Keyframe[] = [
  { frame: 0, value: 0, easing: fall },
  { frame: 11, value: 1 },
];

/** Capture wobble on the contact point, in degrees (clockwise positive). */
export const wobbleTrack: Keyframe[] = [
  { frame: 30, value: 0, easing: smooth },
  { frame: 34, value: -14, easing: smooth },
  { frame: 39, value: 11, easing: smooth },
  { frame: 43, value: 0 },
  { frame: 49, value: 0, easing: smooth },
  { frame: 52, value: -11, easing: smooth },
  { frame: 56, value: 8, easing: smooth },
  { frame: 60, value: 0 },
];

/** Red glow of the button, pulsing on each wobble. */
export const buttonRedTrack: Keyframe[] = [
  { frame: 30, value: 0, easing: smooth },
  { frame: 34, value: 1, easing: smooth },
  { frame: 38, value: 0.08 },
  { frame: 49, value: 0, easing: smooth },
  { frame: 52, value: 1, easing: smooth },
  { frame: 56, value: 0.08 },
  { frame: 61, value: 0 },
];

/** The click: white flash on the button. */
export const buttonWhiteTrack: Keyframe[] = [
  { frame: 62, value: 0, easing: smooth },
  { frame: 64, value: 1, easing: smooth },
  { frame: 70, value: 0.15 },
];

export const shockwaveScaleTrack: Keyframe[] = [
  { frame: 62, value: 1, easing: Easing.out(Easing.exp) },
  { frame: 72, value: 1.75 },
];

export const shockwaveOpacityTrack: Keyframe[] = [
  { frame: 61, value: 0 },
  { frame: 62, value: 0.9 },
  { frame: 72, value: 0 },
];

/** How far the lid is open: 1 = fully open (118° hinge in Blender), with a small settle. */
export const lidTrack: Keyframe[] = [
  { frame: 70, value: 0, easing: Easing.out(Easing.back(1.7)) },
  { frame: 80, value: 1, easing: smooth },
  { frame: 84, value: 110 / 118 },
];

/** The dark core vanishes so the light is seen escaping. */
export const coreOpacityTrack: Keyframe[] = [
  { frame: 71, value: 1 },
  { frame: 72, value: 0 },
];

/** Diameter of the light burst, in world units. */
export const burstScaleTrack: Keyframe[] = [
  { frame: 71, value: 0.01, easing: Easing.out(Easing.quad) },
  // Held around the button's size for a moment, so it reads as coming from it.
  { frame: 73, value: 0.7, easing: fall },
  { frame: 76, value: 1.8, easing: fall },
  { frame: 80, value: 3, easing: fall },
  { frame: 92, value: 22 },
];

export const burstOpacityTrack: Keyframe[] = [
  { frame: 70, value: 0 },
  { frame: 72, value: 0.9 },
  { frame: 84, value: 1 },
];

/** Full-screen flash in the theme background, then the whole overlay fades out. */
export const flashOpacityTrack: Keyframe[] = [
  { frame: 85, value: 0, easing: fall },
  { frame: 92, value: 1 },
];

export const backdropOpacityTrack: Keyframe[] = [
  { frame: 0, value: 0, easing: smooth },
  { frame: 6, value: 1 },
];

export const overlayOpacityTrack: Keyframe[] = [
  { frame: 100, value: 1, easing: smooth },
  { frame: LAST_FRAME, value: 0 },
];

/** Intermediate points used to approximate an eased segment. */
const SAMPLES_PER_SEGMENT = 8;

/**
 * Turns keyframes into interpolation ranges for a single driving value (the current frame).
 * `interpolate` only eases the whole range, so each eased segment is sampled into short linear
 * pieces; that keeps every property on one clock and on the native driver.
 */
export const sampleKeyframes = (track: Keyframe[]): InterpolationRanges => {
  if (track.length === 0) {
    throw new Error('A track needs at least one keyframe');
  }
  if (track.length === 1) {
    const [only] = track;
    return {
      inputRange: [only.frame, only.frame + 1],
      outputRange: [only.value, only.value],
    };
  }

  const inputRange: number[] = [];
  const outputRange: number[] = [];
  track.forEach((key, index) => {
    const next = track[index + 1];
    inputRange.push(key.frame);
    outputRange.push(key.value);
    if (!next) {
      return;
    }
    if (next.frame <= key.frame) {
      throw new Error(
        `Keyframes must be in increasing frame order (${key.frame})`,
      );
    }
    if (!key.easing) {
      return;
    }
    for (let step = 1; step < SAMPLES_PER_SEGMENT; step++) {
      const t = step / SAMPLES_PER_SEGMENT;
      inputRange.push(key.frame + (next.frame - key.frame) * t);
      outputRange.push(key.value + (next.value - key.value) * key.easing(t));
    }
  });
  return { inputRange, outputRange };
};
