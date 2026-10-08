import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { PokemonType } from '../../domain/enums';
import { CollectionFilter } from '../enums/CollectionFilter.enum';
import { useSafeAreaInsets } from '../hooks/SafeArea';
import { spacing, useTheme } from '../theme';
import { TYPE_FILTER_CHIP_SLOT, TypeFilterChip } from './TypeFilterChip';

type FilterValue = PokemonType | CollectionFilter | null;

type TypeFilterBarProps = {
  /** Active type or favorites, or `null` when "Todos" is selected. */
  selected: FilterValue;
  onChange: (value: FilterValue) => void;
  /** Shown over the Favoritos chip (FR-606). */
  favoritesCount: number;
};

/** The 18 playable types: Astral and Desconocido have no Pokémon in the list (FR-301). */
export const FILTERABLE_TYPES: readonly PokemonType[] = Object.values(
  PokemonType,
).filter(type => type !== PokemonType.STELLAR && type !== PokemonType.UNKNOWN);

const LABEL_HEIGHT = 18;
const TOP_PADDING = spacing.sm;
/** Room below the circles so the horizontal scroll does not clip their shadows. */
const BOTTOM_PADDING = spacing.md;
/** Margin between the ring slot and the circle it holds. */
const SLOT_INSET = 6;

/** Fixed height of the row; the header adds it below the search bar (ADR-16). */
export const TYPE_FILTER_ROW_HEIGHT =
  TOP_PADDING + TYPE_FILTER_CHIP_SLOT + 2 + LABEL_HEIGHT + BOTTOM_PADDING;

/**
 * Horizontal row of circular filters: Todos, Favoritos (FR-606) and the types
 * (FR-301). Tapping the active one or "Todos" removes the filter (FR-302).
 */
export const TypeFilterBar = ({
  selected,
  onChange,
  favoritesCount,
}: TypeFilterBarProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const onPress = useCallback(
    (value: FilterValue) => onChange(value === selected ? null : value),
    [onChange, selected],
  );

  return (
    <ScrollView
      testID="type-filter-bar"
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel="Filtrar por tipo"
      style={[styles.row, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          // Circles line up with the cards' 16 dp margin; the slot adds its inset.
          paddingLeft: insets.left + spacing.lg - SLOT_INSET,
          paddingRight: insets.right + spacing.lg - SLOT_INSET,
        },
      ]}
    >
      <TypeFilterChip
        type={null}
        selected={selected === null}
        dimmed={false}
        onPress={onPress}
      />
      <TypeFilterChip
        type={CollectionFilter.FAVORITES}
        selected={selected === CollectionFilter.FAVORITES}
        dimmed={selected !== null && selected !== CollectionFilter.FAVORITES}
        onPress={onPress}
        badge={favoritesCount}
      />
      {FILTERABLE_TYPES.map(type => (
        <TypeFilterChip
          key={type}
          type={type}
          selected={type === selected}
          dimmed={selected !== null && type !== selected}
          onPress={onPress}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: { height: TYPE_FILTER_ROW_HEIGHT, flexGrow: 0 },
  content: {
    gap: spacing.sm,
    paddingTop: TOP_PADDING,
    paddingBottom: BOTTOM_PADDING,
    alignItems: 'flex-start',
  },
});
