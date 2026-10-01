import React from 'react';
import { AccessibilityInfo, Animated, Dimensions } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { ScrollToTopButton } from '../../src/presentation/components/ScrollToTopButton';
import { ReduceMotionProvider } from '../../src/presentation/hooks/useReduceMotion';
import {
  nextScrollTopVisibility,
  useScrollToTop,
} from '../../src/presentation/hooks/useScrollToTop';

const render = async (element: React.ReactElement, reduceMotion = false) => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(reduceMotion);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ReduceMotionProvider>{element}</ReduceMotionProvider>,
    );
  });
  return renderer;
};

/**
 * The Jest preset mocks the native animated module: native-driver animations crash or
 * never finish. Complete timings/springs on the next tick.
 */
const pending = new Set<ReturnType<typeof setTimeout>>();
const stubAnimation = (node: unknown, config: { toValue: unknown }) =>
  ({
    start: (callback?: (result: { finished: boolean }) => void) => {
      const timer = setTimeout(() => {
        pending.delete(timer);
        (node as Animated.Value).setValue(config.toValue as number);
        callback?.({ finished: true });
      }, 0);
      pending.add(timer);
    },
    stop: () => undefined,
    reset: () => undefined,
  } as unknown as Animated.CompositeAnimation);

beforeEach(() => {
  jest.spyOn(Animated, 'timing').mockImplementation(stubAnimation as never);
  jest.spyOn(Animated, 'spring').mockImplementation(stubAnimation as never);
});

afterEach(() => {
  // An animation still pending would update a component after its test (act warning).
  pending.forEach(clearTimeout);
  pending.clear();
  jest.restoreAllMocks();
});

describe('nextScrollTopVisibility (FR-220)', () => {
  const viewport = 800;

  it('appears only after two screens of scroll', () => {
    expect(nextScrollTopVisibility(1600, viewport, false)).toBe(false);
    expect(nextScrollTopVisibility(1601, viewport, false)).toBe(true);
  });

  it('stays visible until less than one screen from the top (hysteresis)', () => {
    expect(nextScrollTopVisibility(1200, viewport, true)).toBe(true);
    expect(nextScrollTopVisibility(800, viewport, true)).toBe(false);
  });
});

describe('useScrollToTop (FR-220)', () => {
  it('shows after two screens, hides near the top and scrolls the list back', async () => {
    const viewport = Dimensions.get('window').height;
    const scrollY = new Animated.Value(0);
    let top!: ReturnType<typeof useScrollToTop>;
    const scrollToOffset = jest.fn();
    const Probe = () => {
      top = useScrollToTop({ scrollY });
      return null;
    };
    await render(<Probe />);
    top.listRef.current = { scrollToOffset } as never;
    expect(top.visible).toBe(false);

    await ReactTestRenderer.act(async () =>
      scrollY.setValue(viewport * 2 + 50),
    );
    expect(top.visible).toBe(true);

    await ReactTestRenderer.act(async () => scrollY.setValue(0));
    expect(top.visible).toBe(false);

    top.scrollToTop();
    // The top of the list is offset 0 on both platforms (padding, not an inset).
    expect(scrollToOffset).toHaveBeenCalledWith({ offset: 0, animated: true });
  });
});

describe('ScrollToTopButton (FR-220, NFR-208)', () => {
  it('is an accessible "back to top" button that scrolls up when tapped', async () => {
    const onPress = jest.fn();
    const renderer = await render(
      <ScrollToTopButton visible onPress={onPress} bottom={24} />,
    );
    const button = renderer.root.findByProps({ testID: 'scroll-to-top' });
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Volver al inicio');
    await ReactTestRenderer.act(async () => button.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is hidden from touch and screen readers while not visible', async () => {
    const renderer = await render(
      <ScrollToTopButton visible={false} onPress={jest.fn()} bottom={24} />,
    );
    const host = renderer.root.findAll(
      node => node.props.importantForAccessibility === 'no-hide-descendants',
    );
    expect(host.length).toBeGreaterThan(0);
    expect(host[0].props.pointerEvents).toBe('none');
  });

  it('still scrolls up with Reduce Motion', async () => {
    const onPress = jest.fn();
    const renderer = await render(
      <ScrollToTopButton visible onPress={onPress} bottom={24} />,
      true,
    );
    const button = renderer.root.findByProps({ testID: 'scroll-to-top' });
    await ReactTestRenderer.act(async () => button.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
