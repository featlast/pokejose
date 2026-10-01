import React from 'react';
import { AccessibilityInfo, Animated } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { AnimatedSplash } from '../../src/presentation/components';
import {
  DURATION_MS,
  LAST_FRAME,
} from '../../src/presentation/components/AnimatedSplash/splashTimeline';
import { flushPromises } from '../fixtures/pokemon.fixtures';

/** The native animated module is mocked in Jest, so finish animations right away. */
const completeAnimations = () =>
  jest.spyOn(Animated, 'timing').mockImplementation(
    (value, config) =>
      ({
        start: (callback?: (result: { finished: boolean }) => void) => {
          (value as Animated.Value).setValue(config.toValue as number);
          callback?.({ finished: true });
        },
        stop: jest.fn(),
        reset: jest.fn(),
      } as unknown as Animated.CompositeAnimation),
  );

const reduceMotion = (enabled: boolean) =>
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(enabled);

const render = async (onFinish: () => void) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<AnimatedSplash onFinish={onFinish} />);
    await flushPromises();
  });
  return renderer;
};

const unmount = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  ReactTestRenderer.act(async () => renderer.unmount());

describe('AnimatedSplash', () => {
  afterEach(() => jest.restoreAllMocks());

  it('plays the whole timeline on the native driver, then finishes', async () => {
    reduceMotion(false);
    const timing = completeAnimations();
    const onFinish = jest.fn();

    const renderer = await render(onFinish);

    expect(timing).toHaveBeenCalledTimes(1);
    expect(timing.mock.calls[0][1]).toMatchObject({
      toValue: LAST_FRAME,
      duration: DURATION_MS,
      useNativeDriver: true,
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
    await unmount(renderer);
  });

  it('only fades out when the user prefers reduced motion', async () => {
    reduceMotion(true);
    const timing = completeAnimations();
    const onFinish = jest.fn();

    const renderer = await render(onFinish);

    expect(timing).toHaveBeenCalledTimes(1);
    const config = timing.mock.calls[0][1];
    expect(config).toMatchObject({ toValue: 0, useNativeDriver: true });
    expect(config.duration).toBeLessThan(DURATION_MS / 4);
    expect(onFinish).toHaveBeenCalledTimes(1);
    await unmount(renderer);
  });

  it('plays the full animation if the motion setting cannot be read', async () => {
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockRejectedValue(new Error('unavailable'));
    const timing = completeAnimations();

    const renderer = await render(jest.fn());

    expect(timing.mock.calls[0][1]).toMatchObject({ toValue: LAST_FRAME });
    await unmount(renderer);
  });

  it('does not start or finish if unmounted before the setting is known', async () => {
    let resolve!: (enabled: boolean) => void;
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockReturnValue(new Promise<boolean>(r => (resolve = r)));
    const timing = completeAnimations();
    const onFinish = jest.fn();

    const renderer = await render(onFinish);
    // Separate acts: effect cleanups of an unmount are flushed at the end of its act.
    await unmount(renderer);
    await ReactTestRenderer.act(async () => {
      resolve(false);
      await flushPromises();
    });

    expect(timing).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('is hidden from screen readers', async () => {
    reduceMotion(false);
    jest.spyOn(Animated, 'timing').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    } as unknown as Animated.CompositeAnimation);

    const renderer = await render(jest.fn());
    const root = renderer.root.findByProps({ testID: 'animated-splash' });

    expect(root.props.accessibilityElementsHidden).toBe(true);
    expect(root.props.importantForAccessibility).toBe('no-hide-descendants');
    await unmount(renderer);
  });
});
