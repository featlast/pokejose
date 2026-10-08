/**
 * Integration test of the card → detail shared transition (spec 002 FR-217).
 * Jest has no layout engine and the RN preset mocks `View` as a class whose
 * `measureInWindow` never answers, so `layout()` fires `onLayout` by hand and
 * gives the mounted view instance a `measureInWindow` returning its frame.
 */

import React from 'react';
import { AccessibilityInfo, Animated } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import type { ReactTestInstance } from 'react-test-renderer';
import App from '../App';
import { InMemoryKeyValueStorage } from '../src/core/storage/InMemoryKeyValueStorage';
import { createAppDependencies } from '../src/di/container';
import { PokemonDetailScreen } from '../src/presentation/screens/PokemonDetail/PokemonDetailScreen';
import {
  bulbasaurDetail,
  makePage,
  makeSummary,
  resource,
} from './fixtures/pokemon.fixtures';

type Frame = [x: number, y: number, width: number, height: number];

const CARD_FRAME: Frame = [30, 260, 120, 120];
const HERO_FRAME: Frame = [85, 190, 220, 220];

/** Animations complete only when the test says so, to inspect mid-flight state. */
let pendingAnimations: Array<() => void> = [];
const queueAnimations = () =>
  jest.spyOn(Animated, 'timing').mockImplementation(
    (value, config) =>
      ({
        start: (callback?: (result: { finished: boolean }) => void) => {
          pendingAnimations.push(() => {
            (value as Animated.Value).setValue(config.toValue as number);
            callback?.({ finished: true });
          });
        },
        stop: () => undefined,
        reset: () => undefined,
      } as unknown as Animated.CompositeAnimation),
  );

const microtasks = () => new Promise<void>(resolve => setImmediate(resolve));

const flushAnimations = async () => {
  for (let round = 0; round < 10 && pendingAnimations.length > 0; round++) {
    const batch = pendingAnimations;
    pendingAnimations = [];
    await ReactTestRenderer.act(async () => {
      batch.forEach(complete => complete());
      await microtasks();
    });
  }
};

const renderApp = async () => {
  const repository = {
    getPokemonPage: jest.fn().mockResolvedValue(
      resource({
        ...makePage([1, 2], null),
        items: [makeSummary(1, 'bulbasaur'), makeSummary(2, 'ivysaur')],
      }),
    ),
    getPokemonDetail: jest.fn().mockResolvedValue(resource(bulbasaurDetail)),
  };
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <App
        showSplash={false}
        dependencies={createAppDependencies({
          repository,
          typeIndexRepository: {
            getTypeIndex: jest.fn().mockResolvedValue(resource({})),
          },
          searchIndexRepository: {
            getSearchIndex: jest.fn().mockResolvedValue(resource([])),
          },
          typeChartRepository: {
            getTypeChart: jest.fn().mockResolvedValue(resource({})),
          },
          evolutionRepository: {
            getEvolutionChain: jest
              .fn()
              .mockRejectedValue(new Error('not needed here')),
          },
          storage: new InMemoryKeyValueStorage(),
        })}
      />,
    );
    await microtasks();
  });
  return renderer;
};

const find = (renderer: ReactTestRenderer.ReactTestRenderer, id: string) =>
  renderer.root.findAll(
    (node: ReactTestInstance) =>
      node.props.testID === id && typeof node.type !== 'string',
  );

/** Simulates layout: the view reports `onLayout` and becomes measurable at `frame`. */
const layout = (node: ReactTestInstance, frame: Frame | null) =>
  ReactTestRenderer.act(async () => {
    if (frame) {
      node
        .findAll(
          (child: ReactTestInstance) =>
            typeof child.instance?.measureInWindow === 'function',
        )
        .forEach((child: ReactTestInstance) => {
          child.instance.measureInWindow = (
            callback: (x: number, y: number, w: number, h: number) => void,
          ) => callback(...frame);
        });
    }
    node.props.onLayout({
      nativeEvent: { layout: { x: 0, y: 0, width: 1, height: 1 } },
    });
    await microtasks();
  });

/** The overlay starts flying once its image has loaded (its native view is painted). */
const overlayLoaded = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  ReactTestRenderer.act(async () => {
    find(renderer, 'shared-element-overlay')[0].props.onLoad();
    await microtasks();
  });

const tap = (node: ReactTestInstance) =>
  ReactTestRenderer.act(async () => {
    node.props.onPress();
    await microtasks();
  });

const opacityOf = (node: ReactTestInstance): number => {
  const style = [node.props.style].flat(Infinity) as Array<
    { opacity?: unknown } | undefined
  >;
  const animated = style.find(s => s?.opacity !== undefined)?.opacity;
  return animated === undefined
    ? 1
    : (animated as { __getValue(): number }).__getValue();
};

describe('shared transition', () => {
  let mounted: ReactTestRenderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    pendingAnimations = [];
    queueAnimations();
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(false);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await ReactTestRenderer.act(async () => mounted?.unmount());
    mounted = null;
  });

  it('flies the card image to the detail hero and back', async () => {
    const renderer = (mounted = await renderApp());
    await layout(find(renderer, 'shared-image-source-1')[0], CARD_FRAME);

    await tap(find(renderer, 'pokemon-card-1')[0]);
    const target = () => find(renderer, 'shared-image-target')[0];
    // The hero stays hidden until the flight lands on it.
    expect(opacityOf(target())).toBe(0);

    await layout(target(), HERO_FRAME);
    const overlay = find(renderer, 'shared-element-overlay');
    expect(overlay).not.toHaveLength(0);
    expect(overlay[0].props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ left: 30, top: 260, width: 120 }),
      ]),
    );
    // The card is only hidden once its copy is on screen (no blink while mounting).
    expect(opacityOf(find(renderer, 'shared-image-source-1')[0])).toBe(1);
    await overlayLoaded(renderer);
    expect(opacityOf(find(renderer, 'shared-image-source-1')[0])).toBe(0);

    await flushAnimations();
    expect(find(renderer, 'shared-element-overlay')).toHaveLength(0);
    expect(opacityOf(target())).toBe(1);
    expect(opacityOf(find(renderer, 'shared-image-source-1')[0])).toBe(1);

    // Back: the hero flies to the (visible) card while the detail fades out.
    await tap(find(renderer, 'header-back')[0]);
    const backOverlay = find(renderer, 'shared-element-overlay');
    expect(backOverlay).not.toHaveLength(0);
    expect(backOverlay[0].props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ left: 85, top: 190, width: 220 }),
      ]),
    );
    // The real hero is hidden while its copy flies back (once the copy is shown).
    expect(opacityOf(target())).toBe(1);
    await overlayLoaded(renderer);
    expect(opacityOf(target())).toBe(0);

    await flushAnimations();
    expect(find(renderer, 'shared-element-overlay')).toHaveLength(0);
    expect(find(renderer, 'shared-image-target')).toHaveLength(0);
    expect(opacityOf(find(renderer, 'shared-image-source-1')[0])).toBe(1);
  });

  it('falls back to a plain transition when the card cannot be measured', async () => {
    // The card never becomes measurable (e.g. virtualized away).
    const renderer = (mounted = await renderApp());

    await tap(find(renderer, 'pokemon-card-1')[0]);
    await layout(find(renderer, 'shared-image-target')[0], HERO_FRAME);
    await flushAnimations();

    expect(find(renderer, 'shared-element-overlay')).toHaveLength(0);
    expect(opacityOf(find(renderer, 'shared-image-target')[0])).toBe(1);
    expect(find(renderer, 'pokemon-detail-content')).not.toHaveLength(0);
  });

  it('does not fly with Reduce Motion enabled', async () => {
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(true);
    const renderer = (mounted = await renderApp());
    await layout(find(renderer, 'shared-image-source-1')[0], CARD_FRAME);

    await tap(find(renderer, 'pokemon-card-1')[0]);
    await layout(find(renderer, 'shared-image-target')[0], HERO_FRAME);

    expect(find(renderer, 'shared-element-overlay')).toHaveLength(0);
    await flushAnimations();
    expect(find(renderer, 'pokemon-detail-content')).not.toHaveLength(0);
  });

  it('starts the flight even if the overlay layout event never arrives', async () => {
    const renderer = (mounted = await renderApp());
    await layout(find(renderer, 'shared-image-source-1')[0], CARD_FRAME);
    await tap(find(renderer, 'pokemon-card-1')[0]);
    await layout(find(renderer, 'shared-image-target')[0], HERO_FRAME);
    expect(find(renderer, 'shared-element-overlay')).not.toHaveLength(0);

    // No onLoad: the 100 ms safety net must start (and finish) the flight.
    await ReactTestRenderer.act(
      () => new Promise<void>(resolve => setTimeout(resolve, 150)),
    );
    await flushAnimations();

    expect(find(renderer, 'shared-element-overlay')).toHaveLength(0);
    expect(opacityOf(find(renderer, 'shared-image-target')[0])).toBe(1);
  });

  it('fades back without flying when the card sits under the list header', async () => {
    const renderer = (mounted = await renderApp());
    // y = 40 is above the compact header's bottom edge.
    await layout(
      find(renderer, 'shared-image-source-1')[0],
      [30, 40, 120, 120],
    );
    await tap(find(renderer, 'pokemon-card-1')[0]);
    await layout(find(renderer, 'shared-image-target')[0], HERO_FRAME);
    await overlayLoaded(renderer);
    await flushAnimations();

    await tap(find(renderer, 'header-back')[0]);
    expect(find(renderer, 'shared-element-overlay')).toHaveLength(0);
    await flushAnimations();

    expect(find(renderer, 'pokemon-detail-content')).toHaveLength(0);
    expect(opacityOf(find(renderer, 'shared-image-source-1')[0])).toBe(1);
  });

  it('pushes a single detail screen on a double tap (no flight to block it)', async () => {
    // With Reduce Motion there is no flight, so only the navigator's own busy flag guards.
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(true);
    const renderer = (mounted = await renderApp());
    await ReactTestRenderer.act(async () => {
      const card = find(renderer, 'pokemon-card-1')[0];
      card.props.onPress();
      card.props.onPress();
      await microtasks();
    });
    await flushAnimations();

    expect(renderer.root.findAllByType(PokemonDetailScreen)).toHaveLength(1);
  });
});
