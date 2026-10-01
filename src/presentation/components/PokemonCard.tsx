import React, { memo, useCallback } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import type { PokemonType } from '../../domain/enums';
import type { PokemonSummary } from '../../domain/models';
import { TYPE_APPEARANCE, radius, spacing, useTheme } from '../theme';
import { SharedElementRole } from '../enums/SharedElementRole.enum';
import { useSharedElement } from '../sharedElement/SharedElementContext';
import { formatName, formatPokedexNumber } from '../utils/formatters';
import { AppText } from './AppText';
import { ProgressiveImage } from './ProgressiveImage';
import { pokemonImageSharedKey } from './sharedElementKeys';
import { TypeRibbon } from './TypeRibbon';

type PokemonCardProps = {
  pokemon: PokemonSummary;
  width: number;
  onPress: (pokemon: PokemonSummary) => void;
  /** Primary type, when the type index knows it; the ribbon is omitted otherwise. */
  primaryType?: PokemonType | null;
};

export const POKEMON_CARD_HEIGHT_RATIO = 1.2;

const PokemonCardComponent = ({
  pokemon,
  width,
  onPress,
  primaryType,
}: PokemonCardProps) => {
  const { colors } = useTheme();
  const sharedImage = useSharedElement(
    pokemonImageSharedKey(pokemon.id),
    SharedElementRole.SOURCE,
  );
  const { markActive } = sharedImage;
  const handlePress = useCallback(() => {
    // This exact card is where the image flies from and returns to.
    markActive();
    onPress(pokemon);
  }, [markActive, onPress, pokemon]);
  const name = formatName(pokemon.name);
  const imageSize = width * 0.7;
  const typeLabel = primaryType
    ? `, tipo ${TYPE_APPEARANCE[primaryType].label}`
    : '';

  return (
    <Pressable
      testID={`pokemon-card-${pokemon.id}`}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, número ${pokemon.id}${typeLabel}`}
      accessibilityHint="Abre el detalle del Pokémon"
      style={({ pressed }) => [
        styles.card,
        {
          width,
          height: width * POKEMON_CARD_HEIGHT_RATIO,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <AppText
        variant="caption"
        color={colors.textSecondary}
        style={styles.number}
      >
        {formatPokedexNumber(pokemon.id)}
      </AppText>
      <View
        style={[
          styles.imageBackdrop,
          {
            width: imageSize,
            height: imageSize,
            backgroundColor: colors.surfaceMuted,
          },
        ]}
      >
        <Animated.View
          testID={`shared-image-source-${pokemon.id}`}
          ref={sharedImage.ref}
          onLayout={sharedImage.onLayout}
          style={sharedImage.style}
        >
          <ProgressiveImage uri={pokemon.imageUrl} size={imageSize} />
        </Animated.View>
      </View>
      <AppText
        variant="label"
        style={styles.name}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {name}
      </AppText>
      {primaryType ? <TypeRibbon type={primaryType} cardWidth={width} /> : null}
    </Pressable>
  );
};

export const PokemonCard = memo(PokemonCardComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
    // Clips the diagonal type ribbon to the rounded corner.
    overflow: 'hidden',
  },
  number: { alignSelf: 'flex-end' },
  imageBackdrop: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { marginTop: spacing.xs },
});
