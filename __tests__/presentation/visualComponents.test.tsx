import React from 'react';
import { AccessibilityInfo, Animated } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import type { ReactTestInstance } from 'react-test-renderer';
import { PokemonType } from '../../src/domain/enums';
import { ProgressiveImage } from '../../src/presentation/components/ProgressiveImage';
import { Skeleton } from '../../src/presentation/components/Skeleton';
import { TypeRibbon } from '../../src/presentation/components/TypeRibbon';
import { normalizedScrollOffset } from '../../src/presentation/hooks/useCollapsingHeader';
import { ReduceMotionProvider } from '../../src/presentation/hooks/useReduceMotion';

/** Current JS-side value of an animated node (`__getValue` is internal, not typed). */
const value = (node: unknown) =>
  (node as { __getValue(): unknown }).__getValue();

describe('normalizedScrollOffset', () => {
  it('turns the iOS content offset into distance from the top', () => {
    const scrollY = new Animated.Value(-150);
    const offset = normalizedScrollOffset(scrollY, 150);
    expect(value(offset)).toBe(0);
    scrollY.setValue(-100);
    expect(value(offset)).toBe(50);
  });

  it('clamps negative (bounce / pull-to-refresh) offsets to 0', () => {
    const scrollY = new Animated.Value(-170);
    expect(value(normalizedScrollOffset(scrollY, 150))).toBe(0);
  });
});

/** Every renderer is unmounted after each test so looping animations stop with it. */
const mounted: ReactTestRenderer.ReactTestRenderer[] = [];
afterEach(async () => {
  await ReactTestRenderer.act(async () => {
    mounted.splice(0).forEach(renderer => renderer.unmount());
  });
});

const renderWithMotion = async (
  element: React.ReactElement,
  reduceMotion: boolean,
) => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(reduceMotion);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ReduceMotionProvider>{element}</ReduceMotionProvider>,
    );
  });
  mounted.push(renderer);
  return renderer;
};

const layout = (node: ReactTestInstance, width: number) =>
  ReactTestRenderer.act(() => {
    node.props.onLayout({ nativeEvent: { layout: { width, height: 20 } } });
  });

describe('reduce motion', () => {
  afterEach(() => jest.restoreAllMocks());

  it('Skeleton shows the shimmer band normally and hides it with Reduce Motion', async () => {
    const animated = await renderWithMotion(<Skeleton />, false);
    const base = animated.root.findByProps({ testID: 'skeleton' });
    await layout(base, 100);
    expect(base.findAllByType(Animated.View)).not.toHaveLength(0);

    const reduced = await renderWithMotion(<Skeleton />, true);
    const reducedBase = reduced.root.findByProps({ testID: 'skeleton' });
    await layout(reducedBase, 100);
    expect(reducedBase.findAllByType(Animated.View)).toHaveLength(0);
  });

  it('TypeRibbon starts fully visible (no fade) with Reduce Motion', async () => {
    const renderer = await renderWithMotion(
      <TypeRibbon type={PokemonType.FIRE} cardWidth={160} />,
      true,
    );
    const ribbon = renderer.root.findByProps({ testID: 'type-ribbon-fire' });
    expect(
      value(
        ribbon.props.style.flat().find((s: object) => 'opacity' in s).opacity,
      ),
    ).toBe(1);
  });
});

describe('ProgressiveImage', () => {
  it('replaces a broken image with the neutral silhouette', async () => {
    const renderer = await renderWithMotion(
      <ProgressiveImage uri="https://broken" size={100} testID="img" />,
      false,
    );
    expect(
      renderer.root.findAllByProps({ testID: 'img-fallback' }),
    ).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      renderer.root.findByType(Animated.Image).props.onError();
    });

    expect(
      renderer.root.findAllByProps({ testID: 'img-fallback' }).length,
    ).toBeGreaterThan(0);
  });
});
