import React, { useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Animated, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { radius, spacing, typography, useTheme } from '../theme';
import { AppText } from './AppText';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  /** 0 = header expanded, 1 = collapsed (room is made on the left for the app icon). */
  collapseProgress: Animated.AnimatedInterpolation<number>;
  /** Horizontal space the collapsed header gives to the app icon. */
  leadingInset: number;
};

export const SEARCH_BAR_HEIGHT = 44;
const CLEAR_SIZE = 36;
const ICON_WIDTH = 28;

/**
 * Search field that makes room for the app icon as the header collapses.
 * Only transforms are animated (native driver): the pill background shrinks with
 * `scaleX` anchored right, and the content slides right by the same amount.
 */
export const SearchBar = ({
  value,
  onChangeText,
  onClear,
  collapseProgress,
  leadingInset,
}: SearchBarProps) => {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  const collapsedScale = width > 0 ? (width - leadingInset) / width : 1;
  const { scaleX, translateX } = useMemo(
    () => ({
      scaleX: collapseProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, collapsedScale],
        extrapolate: 'clamp',
      }),
      translateX: collapseProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, leadingInset],
        extrapolate: 'clamp',
      }),
    }),
    [collapseProgress, collapsedScale, leadingInset],
  );
  // Fixed so it fits the collapsed pill; in the expanded state it simply has spare room.
  const inputWidth = Math.max(
    width - leadingInset - ICON_WIDTH - CLEAR_SIZE - spacing.md,
    0,
  );

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Animated.View
        style={[
          styles.background,
          { backgroundColor: colors.surface, transform: [{ scaleX }] },
        ]}
      />
      <Animated.View style={[styles.content, { transform: [{ translateX }] }]}>
        <AppText
          variant="glyph"
          color={colors.textSecondary}
          style={styles.icon}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          ⌕
        </AppText>
        <TextInput
          testID="search-input"
          value={value}
          onChangeText={onChangeText}
          placeholder="Nombre o número"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            { color: colors.textPrimary, width: inputWidth },
          ]}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel="Buscar Pokémon por nombre o número"
        />
      </Animated.View>
      {value.length > 0 ? (
        <Pressable
          testID="search-clear"
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel="Limpiar búsqueda"
          hitSlop={6}
          style={styles.clear}
        >
          <AppText
            variant="glyph"
            color={colors.textSecondary}
            style={styles.clearIcon}
          >
            ✕
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, height: SEARCH_BAR_HEIGHT, justifyContent: 'center' },
  background: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.pill,
    transformOrigin: 'right',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
  },
  // Glyph variant (system font): the Intro families have no ⌕ or ✕.
  icon: { fontSize: 22, width: ICON_WIDTH, fontWeight: '700' },
  input: {
    ...typography.body,
    height: SEARCH_BAR_HEIGHT,
    paddingVertical: 0,
  },
  clear: {
    position: 'absolute',
    right: spacing.xs,
    width: CLEAR_SIZE,
    height: CLEAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: { fontSize: 16, fontWeight: '700' },
});
