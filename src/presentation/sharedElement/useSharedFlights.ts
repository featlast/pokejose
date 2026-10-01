import { useCallback, useRef } from 'react';
import type { Animated } from 'react-native';
import { SharedElementRole } from '../enums/SharedElementRole.enum';
import type { SharedElementSpec } from './SharedElement.types';
import { useSharedTransition } from './SharedElementContext';
import { isRectVisible } from './sharedElementMath';

/** How long a pushed screen may take to lay out its target before we give up flying. */
const TARGET_LAYOUT_TIMEOUT_MS = 500;

type Viewport = { width: number; height: number };

type SharedFlightsOptions = {
  /** Animates a route's progress; `withFlight` syncs its timing with the flight. */
  animateTo: (
    value: Animated.Value,
    toValue: number,
    onDone?: () => void,
    withFlight?: boolean,
  ) => void;
  pop: () => void;
  getViewport: () => Viewport;
};

/**
 * Orchestrates shared-element flights for a stack navigator: measuring both ends,
 * hiding the originals while the copy flies, and always restoring them. Every
 * path ends in `finally`, so no element is left hidden and navigation is never
 * left blocked.
 */
export const useSharedFlights = ({
  animateTo,
  pop,
  getViewport,
}: SharedFlightsOptions) => {
  const shared = useSharedTransition();
  const isFlying = useRef(false);

  /** Card image → detail hero, while the pushed screen fades in. */
  const flyIn = useCallback(
    async ({ key, uri }: SharedElementSpec) => {
      if (!shared) {
        return;
      }
      const { registry } = shared;
      isFlying.current = true;
      // Hidden before it mounts: the hero must not show before the copy lands on it.
      registry.setHidden(key, SharedElementRole.TARGET, true);
      try {
        const from = await registry.measure(key, SharedElementRole.SOURCE);
        const laidOut =
          from !== null &&
          (await registry.waitForLayout(
            key,
            SharedElementRole.TARGET,
            TARGET_LAYOUT_TIMEOUT_MS,
          ));
        const to = laidOut
          ? await registry.measure(key, SharedElementRole.TARGET)
          : null;
        if (from && to) {
          await shared.fly({ uri, from, to }, () =>
            registry.setHidden(key, SharedElementRole.SOURCE, true),
          );
        }
      } finally {
        registry.setHidden(key, SharedElementRole.TARGET, false);
        registry.setHidden(key, SharedElementRole.SOURCE, false);
        shared.land();
        isFlying.current = false;
      }
    },
    [shared],
  );

  /**
   * Detail hero → card, while the detail fades out. Plain fade when the card is
   * gone (virtualized) or not fully visible below the list header.
   */
  const flyBack = useCallback(
    async ({ key, uri }: SharedElementSpec, value: Animated.Value) => {
      if (!shared) {
        animateTo(value, 0, pop);
        return;
      }
      const { registry } = shared;
      isFlying.current = true;
      try {
        const [from, to] = await Promise.all([
          registry.measure(key, SharedElementRole.TARGET),
          registry.measure(key, SharedElementRole.SOURCE),
        ]);
        const canFly =
          from !== null &&
          to !== null &&
          isRectVisible(to, {
            ...getViewport(),
            top: registry.getVisibleTop(),
          });
        animateTo(value, 0, pop, canFly);
        if (canFly) {
          await shared.fly({ uri, from, to }, () => {
            registry.setHidden(key, SharedElementRole.TARGET, true);
            registry.setHidden(key, SharedElementRole.SOURCE, true);
          });
        }
      } finally {
        registry.setHidden(key, SharedElementRole.SOURCE, false);
        registry.setHidden(key, SharedElementRole.TARGET, false);
        shared.land();
        isFlying.current = false;
      }
    },
    [shared, animateTo, pop, getViewport],
  );

  return { isFlying, flyIn, flyBack };
};
