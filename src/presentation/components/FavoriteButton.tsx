import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { favoriteIcons } from '../assets/favorites';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { MIN_TOUCH_TARGET, useTheme } from '../theme';

type FavoriteButtonProps = {
  /** Display name, for the accessibility label. */
  name: string;
  active: boolean;
  onPress: () => void;
  /** `card`: round button over the artwork; `header`: white on a coloured header. */
  variant: 'card' | 'header';
  testID?: string;
};

/** Diameter of the card variant; the card places it on its artwork's edge. */
export const FAVORITE_CARD_SIZE = 34;
const CARD_SIZE = FAVORITE_CARD_SIZE;
const CARD_ICON = 20;
const HEADER_ICON = 26;
const SPARK_COLOR = '#FFD34D';
/** Where each spark flies to, from the centre of the icon. */
const SPARKS = [
  { x: -18, y: -16 },
  { x: 18, y: -14 },
  { x: 0, y: -22 },
  { x: -20, y: 6 },
  { x: 20, y: 8 },
];

/**
 * Pokéball-heart toggle (FR-601). Saving plays a "catch": the heart grows,
 * shakes three times like a Poké Ball and gives off sparks; removing it shrinks
 * and comes back (FR-604). All on the native driver; instant with Reduce motion.
 */
const FavoriteButtonComponent = ({
  name,
  active,
  onPress,
  variant,
  testID,
}: FavoriteButtonProps) => {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const spark = useRef(new Animated.Value(0)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (reduceMotion) {
      return;
    }
    const step = (value: Animated.Value, toValue: number, duration: number) =>
      Animated.timing(value, { toValue, duration, useNativeDriver: true });
    let animation: Animated.CompositeAnimation;
    if (active) {
      scale.setValue(0.6);
      spark.setValue(0);
      animation = Animated.parallel([
        Animated.sequence([
          step(scale, 1.18, 200),
          step(scale, 1, 110),
          step(shake, -14, 90),
          step(shake, 11, 100),
          step(shake, -6, 90),
          step(shake, 0, 90),
        ]),
        Animated.sequence([
          Animated.delay(380),
          // Fast out: the sparks leave the heart before they are fully visible.
          Animated.timing(spark, {
            toValue: 1,
            duration: 550,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]);
    } else {
      animation = Animated.sequence([
        step(scale, 0.82, 100),
        step(scale, 1, 150),
      ]);
    }
    animation.start();
    return () => animation.stop();
  }, [active, reduceMotion, scale, shake, spark]);

  const iconTransform = useMemo(
    () => [
      { scale },
      {
        rotate: shake.interpolate({
          inputRange: [-180, 180],
          outputRange: ['-180deg', '180deg'],
        }),
      },
    ],
    [scale, shake],
  );

  const isCard = variant === 'card';
  const source = active
    ? isCard
      ? favoriteIcons.ball
      : favoriteIcons.solid
    : favoriteIcons.outline;
  const iconSize = isCard ? CARD_ICON : HEADER_ICON;
  const tint = active ? undefined : isCard ? colors.textSecondary : '#FFFFFF';

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={
        active ? `Quitar ${name} de favoritos` : `Agregar ${name} a favoritos`
      }
      hitSlop={isCard ? (MIN_TOUCH_TARGET - CARD_SIZE) / 2 : undefined}
      style={[
        isCard ? styles.card : styles.header,
        isCard && { backgroundColor: colors.surface },
      ]}
    >
      <Animated.Image
        source={source}
        fadeDuration={0}
        style={[
          { width: iconSize, height: iconSize, tintColor: tint },
          { transform: iconTransform },
        ]}
      />
      {active ? (
        <View pointerEvents="none" style={styles.sparks}>
          {SPARKS.map(({ x, y }, index) => (
            <Animated.View
              key={index}
              style={[
                styles.spark,
                {
                  opacity: spark.interpolate({
                    inputRange: [0, 0.15, 0.35, 1],
                    outputRange: [0, 0, 1, 0],
                  }),
                  transform: [
                    {
                      translateX: spark.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, x],
                      }),
                    },
                    {
                      translateY: spark.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, y],
                      }),
                    },
                    { rotate: '45deg' },
                  ],
                },
              ]}
            />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
};

export const FavoriteButton = memo(FavoriteButtonComponent);

const styles = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: CARD_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 3px 8px -2px rgba(0,0,0,0.3)',
  },
  header: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparks: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spark: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 1,
    backgroundColor: SPARK_COLOR,
  },
});
