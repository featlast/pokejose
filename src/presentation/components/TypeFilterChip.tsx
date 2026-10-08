import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';
import type { PokemonType } from '../../domain/enums';
import { favoriteIcons } from '../assets/favorites';
import { allTypesIcon, typeIcons } from '../assets/types';
import { CollectionFilter } from '../enums/CollectionFilter.enum';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { TYPE_APPEARANCE, fontFamily, radius, useTheme } from '../theme';
import { AppText } from './AppText';

type ChipValue = PokemonType | CollectionFilter | null;

type TypeFilterChipProps = {
  /** `null` is "Todos" (no filter); `FAVORITES` is the favorites chip (FR-606). */
  type: ChipValue;
  selected: boolean;
  /** Another chip is selected: this one steps back (FR-303). */
  dimmed: boolean;
  onPress: (type: ChipValue) => void;
  /** Small count over the circle (number of favorites). */
  badge?: number;
};

/** Label, icon and colour of the chips that are not a type. */
const COLLECTION_CHIPS = {
  all: {
    label: 'Todos',
    a11y: 'Mostrar todos los tipos',
    icon: allTypesIcon,
  },
  [CollectionFilter.FAVORITES]: {
    label: 'Favoritos',
    a11y: 'Mostrar solo favoritos',
    icon: favoriteIcons.ball,
  },
} as const;

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
  badge,
}: TypeFilterChipProps) => {
  const { colors, isDark } = useTheme();
  const reduceMotion = useReduceMotion();
  const collection =
    type === CollectionFilter.FAVORITES
      ? COLLECTION_CHIPS[CollectionFilter.FAVORITES]
      : type === null
      ? COLLECTION_CHIPS.all
      : null;
  const appearance = collection ? null : TYPE_APPEARANCE[type as PokemonType];
  const label = appearance?.label ?? collection?.label ?? '';
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
        collection
          ? `${collection.a11y}${badge ? `, ${badge}` : ''}`
          : `Filtrar por tipo ${label}`
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
            source={
              collection ? collection.icon : typeIcons[type as PokemonType]
            }
            style={collection ? styles.allIcon : styles.icon}
            fadeDuration={0}
            accessibilityIgnoresInvertColors
          />
        </View>
        {badge ? (
          <View
            pointerEvents="none"
            style={[
              styles.badge,
              {
                backgroundColor: colors.primary,
                borderColor: colors.background,
              },
            ]}
          >
            <AppText
              variant="caption"
              color="#FFFFFF"
              maxFontSizeMultiplier={1}
              style={styles.badgeText}
            >
              {badge > 99 ? '99+' : badge}
            </AppText>
          </View>
        ) : null}
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
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 11, fontFamily: fontFamily.display },
  allIcon: { width: ALL_ICON_SIZE, height: ALL_ICON_SIZE },
  // Intro has a single weight per family: "bold" is the display family.
  selectedLabel: { fontFamily: fontFamily.display },
});
