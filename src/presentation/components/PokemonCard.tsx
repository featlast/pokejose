import React, { memo, useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import type { PokemonType } from '../../domain/enums';
import type { PokemonSummary } from '../../domain/models';
import { TYPE_APPEARANCE, radius, spacing, useTheme } from '../theme';
import { SharedElementRole } from '../enums/SharedElementRole.enum';
import { useSharedElement } from '../sharedElement/SharedElementContext';
import { formatName, formatPokedexNumber } from '../utils/formatters';
import { AppText } from './AppText';
import { FAVORITE_CARD_SIZE, FavoriteButton } from './FavoriteButton';
import { ProgressiveImage } from './ProgressiveImage';
import { pokemonImageSharedKey } from './sharedElementKeys';
import { TypeRibbon } from './TypeRibbon';

type PokemonCardProps = {
  pokemon: PokemonSummary;
  width: number;
  onPress: (pokemon: PokemonSummary) => void;
  /** Primary type, when the type index knows it; the ribbon is omitted otherwise. */
  primaryType?: PokemonType | null;
  isFavorite?: boolean;
  /** Shows the favorite button over the artwork when given (FR-602). */
  onToggleFavorite?: (pokemon: PokemonSummary) => void;
};

/** cos 45°: the favorite button sits on the artwork's lower-right diagonal. */
const DIAGONAL = Math.SQRT1_2;
/** Space between the artwork circle and the favorite button. */
const FAVORITE_GAP = 2;

export const POKEMON_CARD_HEIGHT_RATIO = 1.2;

const PokemonCardComponent = ({
  pokemon,
  width,
  onPress,
  primaryType,
  isFavorite = false,
  onToggleFavorite,
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
  const favoriteLabel = isFavorite ? ', favorito' : '';
  // Measured, not estimated: the artwork's top depends on the card's text sizes.
  const [artTop, setArtTop] = useState<number | null>(null);
  const onArtLayout = useCallback(
    (event: LayoutChangeEvent) => setArtTop(event.nativeEvent.layout.y),
    [],
  );
  // The artwork fills its circle, so the button sits just outside it, touching
  // its lower-right edge: it never covers the Pokémon (FR-602).
  const artRadius = imageSize / 2;
  const favoriteOffset =
    artRadius +
    (artRadius + FAVORITE_CARD_SIZE / 2 + FAVORITE_GAP) * DIAGONAL -
    FAVORITE_CARD_SIZE / 2;
  // Narrow cards (small phones) keep it inside the card.
  const favoriteLeft = Math.min(
    (width - imageSize) / 2 + favoriteOffset,
    width - FAVORITE_CARD_SIZE - spacing.xs,
  );
  const toggleFavorite = useCallback(
    () => onToggleFavorite?.(pokemon),
    [onToggleFavorite, pokemon],
  );
  // The card groups its content for screen readers, so the button is also an action (NFR-603).
  const accessibilityActions = onToggleFavorite
    ? [
        {
          name: 'toggleFavorite',
          label: isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos',
        },
      ]
    : undefined;

  return (
    <Pressable
      testID={`pokemon-card-${pokemon.id}`}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, número ${pokemon.id}${typeLabel}${favoriteLabel}`}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={event =>
        event.nativeEvent.actionName === 'toggleFavorite' && toggleFavorite()
      }
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
        onLayout={onArtLayout}
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
      {onToggleFavorite ? (
        <View
          // Hidden until the artwork is measured, so it never jumps into place.
          pointerEvents={artTop === null ? 'none' : 'box-none'}
          style={[
            styles.favorite,
            {
              top: (artTop ?? 0) + favoriteOffset,
              left: favoriteLeft,
            },
            artTop === null && styles.unmeasured,
          ]}
        >
          <FavoriteButton
            testID={`favorite-${pokemon.id}`}
            name={name}
            active={isFavorite}
            onPress={toggleFavorite}
            variant="card"
          />
        </View>
      ) : null}
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
  favorite: { position: 'absolute' },
  unmeasured: { opacity: 0 },
});
