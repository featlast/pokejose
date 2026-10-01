import { Easing } from 'react-native';
import {
  DURATION_MS,
  FPS,
  LAST_FRAME,
  REST_FRAME,
  dropTrack,
  lidTrack,
  overlayOpacityTrack,
  sampleKeyframes,
  wobbleTrack,
} from '../../src/presentation/components/AnimatedSplash/splashTimeline';

describe('sampleKeyframes', () => {
  it('keeps linear segments as they are', () => {
    expect(
      sampleKeyframes([
        { frame: 0, value: 0 },
        { frame: 10, value: 1 },
      ]),
    ).toEqual({ inputRange: [0, 10], outputRange: [0, 1] });
  });

  it('samples eased segments and still hits every keyframe exactly', () => {
    const { inputRange, outputRange } = sampleKeyframes([
      { frame: 0, value: 0, easing: Easing.in(Easing.quad) },
      { frame: 8, value: 1 },
    ]);

    expect(inputRange).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(outputRange[0]).toBe(0);
    expect(outputRange[4]).toBeCloseTo(0.25); // quad ease-in at t = 0.5
    expect(outputRange[8]).toBe(1);
  });

  it('holds a single keyframe', () => {
    expect(sampleKeyframes([{ frame: 5, value: 2 }])).toEqual({
      inputRange: [5, 6],
      outputRange: [2, 2],
    });
  });

  it('rejects empty or unordered tracks', () => {
    expect(() => sampleKeyframes([])).toThrow();
    expect(() =>
      sampleKeyframes([
        { frame: 4, value: 0 },
        { frame: 4, value: 1 },
      ]),
    ).toThrow(/increasing/);
  });
});

describe('splash timeline', () => {
  const tracks = { dropTrack, lidTrack, overlayOpacityTrack, wobbleTrack };

  it.each(Object.entries(tracks))(
    '%s produces a strictly increasing input range',
    (_, track) => {
      const { inputRange } = sampleKeyframes(track);
      inputRange.slice(1).forEach((frame, i) => {
        expect(frame).toBeGreaterThan(inputRange[i]);
      });
    },
  );

  it('lasts 108 frames at 30 fps and ends fully faded out', () => {
    expect(LAST_FRAME / FPS).toBeCloseTo(3.6);
    expect(DURATION_MS).toBeCloseTo(3600);
    const last = overlayOpacityTrack[overlayOpacityTrack.length - 1];
    expect(last).toEqual({ frame: LAST_FRAME, value: 0 });
  });

  it('has the sphere landed and still at the rest frame', () => {
    const lastDrop = dropTrack[dropTrack.length - 1];
    expect(lastDrop.frame).toBeLessThanOrEqual(REST_FRAME);
    expect(lastDrop.value).toBe(0);
    expect(wobbleTrack[0]).toMatchObject({ frame: REST_FRAME, value: 0 });
  });
});
