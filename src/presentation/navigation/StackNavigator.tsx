import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  PanResponder,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';
import type { SharedElementSpec } from '../sharedElement/SharedElement.types';
import {
  FLIGHT_EASING,
  FLIGHT_MS,
  SharedElementProvider,
} from '../sharedElement/SharedElementContext';
import { useSharedFlights } from '../sharedElement/useSharedFlights';
import { useTheme } from '../theme';
import { NavigationContext } from './NavigationContext';
import type {
  Navigation,
  Route,
  RouteName,
  RootStackParamList,
  ScreenProps,
  ScreenRegistry,
  SharedElementConfig,
} from './Navigation.types';
import { stackReducer } from './stackReducer';

type StackNavigatorProps = {
  screens: ScreenRegistry;
  initialRouteName: RouteName;
  /** Routes that open with a shared-element flight instead of a slide. */
  sharedElements?: SharedElementConfig;
};

const TRANSITION_MS = 280;
const EDGE_SWIPE_WIDTH = 24;
const PARALLAX_FACTOR = 0.3;

let routeCounter = 0;
const nextKey = (name: RouteName) => `${name}-${++routeCounter}`;

type SceneProps = {
  route: Route;
  navigation: Navigation;
  Screen: React.ComponentType<ScreenProps<RouteName>>;
};

/**
 * One route's screen. Memoized: pushes, pops and swipes re-render the navigator,
 * but must not re-render screens (the list's whole tree) on the frames where a
 * transition starts.
 */
const Scene = memo(({ route, navigation, Screen }: SceneProps) => (
  <Screen route={route as Route<RouteName>} navigation={navigation} />
));

/**
 * Minimal native-feeling stack navigator built only on React Native primitives:
 * slide transitions on the native driver, Android back button and iOS edge swipe.
 * Routes with a shared element cross-fade while their image flies between screens
 * (see `sharedElement/`). Screens below the top one stay mounted so they keep
 * their state and scroll.
 */
export const StackNavigator = (props: StackNavigatorProps) => (
  <SharedElementProvider>
    <StackNavigatorContent {...props} />
  </SharedElementProvider>
);

const StackNavigatorContent = ({
  screens,
  initialRouteName,
  sharedElements,
}: StackNavigatorProps) => {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const [stack, dispatch] = useReducer(stackReducer, undefined, () => [
    {
      key: nextKey(initialRouteName),
      name: initialRouteName,
      params: undefined,
    } as Route,
  ]);
  /** Route being dismissed by the iOS edge swipe: it slides even if it normally fades. */
  const [swipingKey, setSwipingKey] = useState<string | null>(null);

  // One progress value per route: 0 = hidden (off-screen or transparent), 1 = visible.
  const progress = useRef(new Map<string, Animated.Value>()).current;
  const isAnimating = useRef(false);
  const stackRef = useRef(stack);
  stackRef.current = stack;
  const settingsRef = useRef({ reduceMotion, width, height });
  settingsRef.current = { reduceMotion, width, height };

  const specFor = useCallback(
    (route: Route): SharedElementSpec | null => {
      const build = sharedElements?.[route.name] as
        | ((r: Route) => SharedElementSpec | null)
        | undefined;
      return build ? build(route) : null;
    },
    [sharedElements],
  );

  /** Shared routes cross-fade (the image flies instead); Reduce Motion fades everything. */
  const fades = (route: Route) =>
    reduceMotion || (specFor(route) !== null && swipingKey !== route.key);

  const progressFor = useCallback(
    (key: string, initial: number) => {
      let value = progress.get(key);
      if (!value) {
        value = new Animated.Value(initial);
        progress.set(key, value);
      }
      return value;
    },
    [progress],
  );

  const animateTo = useCallback(
    (
      value: Animated.Value,
      toValue: number,
      onDone?: () => void,
      withFlight = false,
    ) => {
      isAnimating.current = true;
      Animated.timing(value, {
        toValue,
        // A cross-fade that accompanies a flight shares its timing, so the screen
        // does not vanish before the image has travelled.
        duration: withFlight ? FLIGHT_MS : TRANSITION_MS,
        easing: withFlight ? FLIGHT_EASING : Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;
        onDone?.();
      });
    },
    [],
  );

  const pop = useCallback(() => {
    const top = stackRef.current[stackRef.current.length - 1];
    progress.delete(top.key);
    dispatch({ type: 'POP' });
  }, [progress]);

  const getViewport = useCallback(
    () => ({
      width: settingsRef.current.width,
      height: settingsRef.current.height,
    }),
    [],
  );
  const { isFlying, flyIn, flyBack } = useSharedFlights({
    animateTo,
    pop,
    getViewport,
  });
  const isBusy = useCallback(
    () => isAnimating.current || isFlying.current,
    [isFlying],
  );

  const navigation = useMemo<Navigation>(
    () => ({
      navigate: (name, ...params) => {
        if (isBusy()) {
          return;
        }
        // Busy from this very tap: a second tap before the commit must not push again.
        isAnimating.current = true;
        const route = {
          key: nextKey(name),
          name,
          params: params[0] as RootStackParamList[RouteName],
        } as Route;
        progressFor(route.key, 0);
        dispatch({ type: 'PUSH', ...route });
        const spec = settingsRef.current.reduceMotion ? null : specFor(route);
        if (spec) {
          flyIn(spec);
        }
      },
      goBack: () => {
        const current = stackRef.current;
        if (current.length < 2 || isBusy()) {
          return;
        }
        const top = current[current.length - 1];
        const value = progressFor(top.key, 1);
        const spec = settingsRef.current.reduceMotion ? null : specFor(top);
        if (spec) {
          flyBack(spec, value);
        } else {
          animateTo(value, 0, pop);
        }
      },
      canGoBack: () => stackRef.current.length > 1,
    }),
    [animateTo, pop, progressFor, specFor, flyIn, flyBack, isBusy],
  );

  // Animate every newly pushed route in.
  const topKey = stack[stack.length - 1].key;
  useEffect(() => {
    if (stack.length > 1) {
      const top = stack[stack.length - 1];
      const withFlight = !reduceMotion && specFor(top) !== null;
      animateTo(progressFor(topKey, 0), 1, undefined, withFlight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topKey]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (!navigation.canGoBack()) {
          return false;
        }
        navigation.goBack();
        return true;
      },
    );
    return () => subscription.remove();
  }, [navigation]);

  const edgeSwipe = useMemo(() => {
    const settle = (shouldPop: boolean) => {
      const top = stackRef.current[stackRef.current.length - 1];
      animateTo(progressFor(top.key, 1), shouldPop ? 0 : 1, () => {
        if (shouldPop) {
          pop();
        }
        setSwipingKey(null);
      });
    };
    return PanResponder.create({
      // Claimed only once a horizontal drag that started at the left edge moves,
      // so taps (e.g. the back button) and vertical scrolls pass through untouched.
      onMoveShouldSetPanResponderCapture: (_, g) =>
        stackRef.current.length > 1 &&
        !isBusy() &&
        g.x0 <= EDGE_SWIPE_WIDTH &&
        g.dx > 8 &&
        Math.abs(g.dy) < Math.abs(g.dx),
      // A swipe always slides (the finger drags the page), even on shared routes.
      onPanResponderGrant: () =>
        setSwipingKey(stackRef.current[stackRef.current.length - 1].key),
      onPanResponderMove: (_, g) => {
        const top = stackRef.current[stackRef.current.length - 1];
        progressFor(top.key, 1).setValue(
          1 - Math.min(Math.max(g.dx / width, 0), 1),
        );
      },
      onPanResponderRelease: (_, g) =>
        settle(g.dx > width * 0.35 || g.vx > 0.5),
      onPanResponderTerminate: () => settle(false),
    });
  }, [animateTo, pop, progressFor, width, isBusy]);

  return (
    <NavigationContext.Provider value={navigation}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {stack.map((route, index) => {
          const isTop = index === stack.length - 1;
          const own = progressFor(route.key, index === 0 ? 1 : 0);
          const above = index < stack.length - 1 ? stack[index + 1] : null;
          const ownFades = index > 0 && fades(route);

          // The screen below a sliding one drifts left (parallax); below a fade it stays put.
          const parallax =
            above && !fades(above)
              ? progressFor(above.key, 0).interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -width * PARALLAX_FACTOR],
                })
              : 0;
          const translateX = Animated.add(
            ownFades
              ? 0
              : own.interpolate({
                  inputRange: [0, 1],
                  outputRange: [width, 0],
                }),
            parallax,
          );

          const swipeHandlers =
            isTop && index > 0 && Platform.OS === 'ios'
              ? edgeSwipe.panHandlers
              : undefined;

          return (
            <Animated.View
              key={route.key}
              {...swipeHandlers}
              // VoiceOver "escape" (two-finger Z) goes back like the edge swipe.
              onAccessibilityEscape={
                isTop && index > 0 ? navigation.goBack : undefined
              }
              pointerEvents={isTop ? 'auto' : 'none'}
              // Hide covered screens from VoiceOver / TalkBack.
              accessibilityElementsHidden={!isTop}
              importantForAccessibility={isTop ? 'auto' : 'no-hide-descendants'}
              style={[
                StyleSheet.absoluteFill,
                !ownFades && styles.slideShadow,
                { backgroundColor: colors.background },
                { transform: [{ translateX }] },
                ownFades && { opacity: own },
              ]}
            >
              <Scene
                route={route}
                navigation={navigation}
                Screen={
                  screens[route.name] as React.ComponentType<
                    ScreenProps<RouteName>
                  >
                }
              />
            </Animated.View>
          );
        })}
      </View>
    </NavigationContext.Provider>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  slideShadow: {
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
});
