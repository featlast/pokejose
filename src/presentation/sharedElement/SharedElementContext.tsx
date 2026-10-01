import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Animated, Easing, StyleSheet } from 'react-native';
import type { SharedElementRole } from '../enums/SharedElementRole.enum';
import type { Flight } from './SharedElement.types';
import { flightTransform } from './sharedElementMath';
import type {
  MeasurableNode,
  SharedElementEntry,
} from './SharedElementRegistry';
import { SharedElementRegistry } from './SharedElementRegistry';

export const FLIGHT_MS = 340;
export const FLIGHT_EASING = Easing.bezier(0.4, 0, 0.2, 1);
const START_FALLBACK_MS = 100;

type SharedTransition = {
  registry: SharedElementRegistry;
  /**
   * Flies the overlay image; resolves when it lands (the overlay stays until `land`).
   * `onStart` runs once the copy is on screen: hide the originals there, never before,
   * or they blink out while the overlay is still mounting.
   */
  fly: (flight: Flight, onStart?: () => void) => Promise<void>;
  /** Removes the overlay once the real element has been revealed underneath. */
  land: () => void;
};

const SharedTransitionContext = createContext<SharedTransition | null>(null);

/** A flight in progress: its own animated value, so no native node is ever reused. */
type ActiveFlight = Flight & {
  id: number;
  progress: Animated.Value;
  onStart?: () => void;
};

let flightCounter = 0;

/** Owns the registry and draws the flying copy above every screen. */
export const SharedElementProvider = ({ children }: PropsWithChildren) => {
  const registry = useRef(new SharedElementRegistry()).current;
  const [flight, setFlight] = useState<ActiveFlight | null>(null);
  const onLanded = useRef<(() => void) | null>(null);
  const running = useRef<Animated.CompositeAnimation | null>(null);
  const startedId = useRef(0);

  const fly = useCallback(
    (next: Flight, onStart?: () => void) =>
      new Promise<void>(resolve => {
        onLanded.current = resolve;
        setFlight({
          ...next,
          onStart,
          id: ++flightCounter,
          // A fresh value per flight: re-using one whose native node belonged to an
          // unmounted overlay left the new overlay frozen until the animation ended.
          progress: new Animated.Value(0),
        });
      }),
    [],
  );

  const land = useCallback(() => setFlight(null), []);

  /** Started once the overlay image is loaded, i.e. its native view exists and is painted. */
  const start = useCallback((active: ActiveFlight) => {
    if (startedId.current === active.id) {
      return;
    }
    startedId.current = active.id;
    active.onStart?.();
    const animation = Animated.timing(active.progress, {
      toValue: 1,
      duration: FLIGHT_MS,
      // Fast-out, slow-in: the image leaves at once and settles softly on its target.
      easing: FLIGHT_EASING,
      useNativeDriver: true,
    });
    running.current = animation;
    animation.start(() => {
      running.current = null;
      onLanded.current?.();
      onLanded.current = null;
    });
  }, []);

  // Safety net: if the overlay's load event never arrives, start anyway so a
  // flight can never block navigation.
  useEffect(() => {
    if (!flight) {
      return;
    }
    const timer = setTimeout(() => start(flight), START_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [flight, start]);

  // If the provider unmounts mid-flight, stop the animation (its callback resolves `fly`).
  useEffect(() => () => running.current?.stop(), []);

  const value = useMemo(() => ({ registry, fly, land }), [registry, fly, land]);

  return (
    <SharedTransitionContext.Provider value={value}>
      {children}
      {flight ? (
        <FlightOverlay
          key={flight.id}
          flight={flight}
          onReady={() => start(flight)}
        />
      ) : null}
    </SharedTransitionContext.Provider>
  );
};

const FlightOverlay = ({
  flight,
  onReady,
}: {
  flight: ActiveFlight;
  onReady: () => void;
}) => {
  const { from, to, uri, progress } = flight;
  const target = flightTransform(from, to);
  const transform = [
    {
      translateX: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, target.translateX],
      }),
    },
    {
      translateY: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, target.translateY],
      }),
    },
    {
      scale: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, target.scale],
      }),
    },
  ];
  return (
    <Animated.Image
      testID="shared-element-overlay"
      onLoad={onReady}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      source={{ uri, cache: 'force-cache' }}
      resizeMode="contain"
      fadeDuration={0}
      style={[
        styles.overlay,
        {
          left: from.x,
          top: from.y,
          width: from.width,
          height: from.height,
          transform,
        },
      ]}
    />
  );
};

export const useSharedTransition = (): SharedTransition | null =>
  useContext(SharedTransitionContext);

/**
 * Registers a view as one side of a shared-element transition. Spread `ref`,
 * `onLayout` and `style` on an `Animated.View` wrapping the shared content.
 * Outside a provider (or with a null key) it is inert.
 */
export const useSharedElement = (
  key: string | null,
  role: SharedElementRole,
) => {
  const shared = useSharedTransition();
  const registry = shared?.registry ?? null;
  const entry = useRef<SharedElementEntry>({
    node: null,
    hasLayout: false,
  }).current;

  useEffect(() => {
    if (!registry || !key) {
      return;
    }
    return registry.register(key, role, entry);
  }, [registry, key, role, entry]);

  const ref = useCallback(
    (node: MeasurableNode | null) => {
      entry.node = node;
    },
    [entry],
  );

  const onLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      entry.hasLayout = true;
      if (registry && key) {
        registry.notifyLayout(key, role);
      }
    },
    [entry, registry, key, role],
  );

  const opacity = useMemo(
    () => (registry && key ? registry.opacityFor(key, role) : null),
    [registry, key, role],
  );

  /** Call when the user taps the element that starts the transition. */
  const markActive = useCallback(() => {
    if (registry && key) {
      registry.markActive(key, role, entry);
    }
  }, [registry, key, role, entry]);

  return {
    ref,
    onLayout,
    markActive,
    style: opacity ? { opacity } : undefined,
  };
};

/**
 * Declares where sources stop being visible at the top (e.g. under a header), so
 * the flight back falls back to a fade instead of landing under the header.
 */
export const useSharedElementVisibleTop = (top: number) => {
  const registry = useSharedTransition()?.registry;
  useEffect(() => {
    registry?.setVisibleTop(top);
  }, [registry, top]);
};

const styles = StyleSheet.create({
  overlay: { position: 'absolute', zIndex: 10, elevation: 10 },
});
