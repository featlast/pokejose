import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';
import type { PokemonType } from '../../domain/enums';
import { allTypesIcon, typeIcons } from '../assets/types';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { TYPE_APPEARANCE, fontFamily, useTheme } from '../theme';
import { AppText } from './AppText';

type TypeFilterChipProps = {
  /** `null` is the "Todos" chip, which removes the filter. */
  type: PokemonType | null;
  selected: boolean;
  /** Another chip is selected: this one steps back (FR-303). */
  dimmed: boolean;
  onPress: (type: PokemonType | null) => void;
};

const DOT_SIZE = 56;
const ICON_SIZE = 26;
const ALL_ICON_SIZE = 28;
const RING_GAP = 3;
const RING_WIDTH = 2.5;
const RING_SIZE = DOT_SIZE + 2 * (RING_GAP + RING_WIDTH);
/** Square that holds the circle and its ring, so selecting it never shifts the row. */
export const TYPE_FILTER_CHIP_SLOT = 68;
const SELECT_MS = 180;
const DIMMED_OPACITY = 0.5;

/** Blurred shadow tinted with the type, a contact shadow and an inner shine (FR-308). */
const dotShadow = (color: string, selected: boolean, isDark: boolean) => {
  const tint = selected
    ? `0px 10px 18px -4px ${color}B3`
    : `0px 6px 12px -3px ${color}${isDark ? 'BF' : '99'}`;
  const contact = `0px 2px 3px rgba(0,0,0,${isDark ? 0.5 : 0.18})`;
  return `${tint}, ${contact}, inset 0px 2px 0px rgba(255,255,255,0.22), inset 0px -3px 0px rgba(0,0,0,0.12)`;
};
const ALL_SHADOW =
  '0px 5px 10px -3px rgba(0,0,0,0.28), inset 0px -3px 0px rgba(0,0,0,0.05)';

/** One circle of the type filter row: colour, icon, name and selection ring. */
const TypeFilterChipComponent = ({
  type,
  selected,
  dimmed,
  onPress,
}: TypeFilterChipProps) => {
  const { colors, isDark } = useTheme();
  const reduceMotion = useReduceMotion();
  const appearance = type ? TYPE_APPEARANCE[type] : null;
  const label = appearance?.label ?? 'Todos';
  const ringColor = appearance?.color ?? colors.primary;

  const selection = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const dim = useRef(new Animated.Value(dimmed ? 1 : 0)).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    // The initial values are already right: only later changes animate.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const targets: Array<[Animated.Value, number]> = [
      [selection, selected ? 1 : 0],
      [dim, dimmed ? 1 : 0],
    ];
    if (reduceMotion) {
      targets.forEach(([value, toValue]) => value.setValue(toValue));
      return;
    }
    const animations = targets.map(([value, toValue]) =>
      Animated.timing(value, {
        toValue,
        duration: SELECT_MS,
        useNativeDriver: true,
      }),
    );
    animations.forEach(animation => animation.start());
    return () => animations.forEach(animation => animation.stop());
  }, [selected, dimmed, reduceMotion, selection, dim]);

  const handlePress = useCallback(() => onPress(type), [onPress, type]);

  return (
    <Pressable
      testID={`type-filter-${type ?? 'all'}`}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={
        type ? `Filtrar por tipo ${label}` : 'Mostrar todos los tipos'
      }
      style={({ pressed }) => [
        styles.chip,
        { transform: [{ scale: pressed ? 0.94 : 1 }] },
      ]}
    >
      <Animated.View
        style={[
          styles.slot,
          {
            opacity: dim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, DIMMED_OPACITY],
            }),
            transform: [
              {
                scale: selection.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.06],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.ring, { borderColor: ringColor, opacity: selection }]}
        />
        <View
          style={[
            styles.dot,
            appearance
              ? {
                  backgroundColor: appearance.color,
                  boxShadow: dotShadow(appearance.color, selected, isDark),
                }
              : {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: StyleSheet.hairlineWidth,
                  boxShadow: ALL_SHADOW,
                },
          ]}
        >
          <Image
            source={type ? typeIcons[type] : allTypesIcon}
            style={type ? styles.icon : styles.allIcon}
            fadeDuration={0}
            accessibilityIgnoresInvertColors
          />
        </View>
      </Animated.View>
      <AppText
        variant="caption"
        color={selected ? colors.textPrimary : colors.textSecondary}
        // The row has a fixed height: the name may grow only a little with OS text size.
        maxFontSizeMultiplier={1.2}
        numberOfLines={1}
        style={selected ? styles.selectedLabel : undefined}
      >
        {label}
      </AppText>
    </Pressable>
  );
};

export const TypeFilterChip = memo(TypeFilterChipComponent);

const styles = StyleSheet.create({
  chip: { width: TYPE_FILTER_CHIP_SLOT, alignItems: 'center', gap: 2 },
  slot: {
    width: TYPE_FILTER_CHIP_SLOT,
    height: TYPE_FILTER_CHIP_SLOT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_WIDTH,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: ICON_SIZE, height: ICON_SIZE },
  allIcon: { width: ALL_ICON_SIZE, height: ALL_ICON_SIZE },
  // Intro has a single weight per family: "bold" is the display family.
  selectedLabel: { fontFamily: fontFamily.display },
});
