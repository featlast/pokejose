import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { PokemonType } from '../../domain/enums';
import { useSafeAreaInsets } from '../hooks/SafeArea';
import { spacing, useTheme } from '../theme';
import { TYPE_FILTER_CHIP_SLOT, TypeFilterChip } from './TypeFilterChip';

type TypeFilterBarProps = {
  /** Active type, or `null` when "Todos" is selected. */
  selected: PokemonType | null;
  onChange: (type: PokemonType | null) => void;
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
 * Horizontal row of circular type filters (FR-301). Tapping the active type
 * or "Todos" removes the filter (FR-302).
 */
export const TypeFilterBar = ({ selected, onChange }: TypeFilterBarProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const onPress = useCallback(
    (type: PokemonType | null) => onChange(type === selected ? null : type),
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
