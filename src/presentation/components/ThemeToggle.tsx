import React, { useEffect, useRef } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { ThemePreference } from '../../domain/enums';
import { nextThemePreference } from '../../domain/usecases/ThemePreferenceUseCases';
import { themeIcons } from '../assets/theme';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { MIN_TOUCH_TARGET, useThemePreference } from '../theme';

const APPEARANCE: Record<
  ThemePreference,
  { icon: ImageSourcePropType; label: string }
> = {
  [ThemePreference.SYSTEM]: { icon: themeIcons.system, label: 'Sistema' },
  [ThemePreference.LIGHT]: { icon: themeIcons.light, label: 'Claro' },
  [ThemePreference.DARK]: { icon: themeIcons.dark, label: 'Oscuro' },
};

const ICON_SIZE = 24;
const SWAP_MS = 320;

/**
 * Cycles Sistema → Claro → Oscuro; the label announces current and next values.
 * On each change the new icon turns in a quarter turn while it fades in (FR-222);
 * with "Reduce motion" it only fades.
 */
export const ThemeToggle = () => {
  const { preference, setPreference } = useThemePreference();
  const reduceMotion = useReduceMotion();
  const next = nextThemePreference(preference);
  const current = APPEARANCE[preference];

  const progress = useRef(new Animated.Value(1)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: SWAP_MS,
      easing: Easing.out(Easing.back(1.6)),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [preference, progress]);

  const iconStyle = {
    opacity: progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 1, 1],
    }),
    transform: reduceMotion
      ? []
      : [
          {
            rotate: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['-90deg', '0deg'],
            }),
          },
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.6, 1],
            }),
          },
        ],
  };

  return (
    <Pressable
      testID="theme-toggle"
      onPress={() => setPreference(next)}
      accessibilityRole="button"
      accessibilityLabel={`Tema: ${current.label}`}
      accessibilityHint={`Cambia a tema ${APPEARANCE[next].label}`}
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Animated.Image
        testID="theme-toggle-icon"
        source={current.icon}
        style={[styles.icon, iconStyle]}
        fadeDuration={0}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: ICON_SIZE, height: ICON_SIZE, tintColor: '#FFFFFF' },
});
