import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { Chevron } from './Chevron';
import { CircleButton, useBrandButtonContentColor } from './CircleButton';

const DIAMETER = 52;

type Props = {
  visible: boolean;
  onPress: () => void;
  /** Distance from the bottom edge (safe area included). */
  bottom: number;
};

/**
 * "Back to top" button (FR-220): a `brand` CircleButton with an up chevron.
 * It springs in after two screens of scroll and fades out near the top; with
 * Reduce Motion it only fades.
 */
export const ScrollToTopButton = ({ visible, onPress, bottom }: Props) => {
  const chevronColor = useBrandButtonContentColor();
  const reduceMotion = useReduceMotion();
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = reduceMotion
      ? Animated.timing(appear, {
          toValue: visible ? 1 : 0,
          duration: 150,
          useNativeDriver: true,
        })
      : visible
      ? Animated.spring(appear, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 9,
          speed: 14,
        })
      : Animated.timing(appear, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        });
    animation.start();
    return () => animation.stop();
  }, [visible, reduceMotion, appear]);

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      style={[
        styles.host,
        {
          bottom,
          opacity: appear,
          transform: [
            {
              translateY: appear.interpolate({
                inputRange: [0, 1],
                outputRange: [reduceMotion ? 0 : 60, 0],
              }),
            },
            {
              scale: appear.interpolate({
                inputRange: [0, 1],
                outputRange: [reduceMotion ? 1 : 0.85, 1],
              }),
            },
          ],
        },
      ]}
    >
      <CircleButton
        testID="scroll-to-top"
        variant="brand"
        size={DIAMETER}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Volver al inicio"
        accessibilityHint="Sube al principio del listado"
      >
        <Chevron direction="up" color={chevronColor} size={12} />
      </CircleButton>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  host: { position: 'absolute', alignSelf: 'center' },
});
