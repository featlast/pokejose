import type { PokemonSummary } from '../models';
import type { FavoritesRepository } from '../repositories/FavoritesRepository.interface';

export const isFavorite = (
  favorites: readonly PokemonSummary[],
  id: number,
): boolean => favorites.some(favorite => favorite.id === id);

/** Adds the Pokémon first (most recent first) or removes it if it was saved. */
export const toggleFavorite = (
  favorites: readonly PokemonSummary[],
  pokemon: PokemonSummary,
): PokemonSummary[] =>
  isFavorite(favorites, pokemon.id)
    ? favorites.filter(favorite => favorite.id !== pokemon.id)
    : [pokemon, ...favorites];

/** Undo of a removal: puts the Pokémon back where it was (FR-605). */
export const restoreFavorite = (
  favorites: readonly PokemonSummary[],
  pokemon: PokemonSummary,
  index: number,
): PokemonSummary[] => {
  if (isFavorite(favorites, pokemon.id)) {
    return [...favorites];
  }
  const position = Math.min(Math.max(index, 0), favorites.length);
  return [
    ...favorites.slice(0, position),
    pokemon,
    ...favorites.slice(position),
  ];
};

export class GetFavoritesUseCase {
  constructor(private readonly repository: FavoritesRepository) {}

  execute(): Promise<PokemonSummary[]> {
    return this.repository.getFavorites();
  }
}

export type ToggleFavoriteResult = {
  favorites: PokemonSummary[];
  /** True when the Pokémon was added, false when it was removed. */
  added: boolean;
  /** Where it was before a removal, for undo. */
  previousIndex: number;
};

export class ToggleFavoriteUseCase {
  constructor(private readonly repository: FavoritesRepository) {}

  async execute(pokemon: PokemonSummary): Promise<ToggleFavoriteResult> {
    const current = await this.repository.getFavorites();
    const previousIndex = current.findIndex(
      favorite => favorite.id === pokemon.id,
    );
    const favorites = toggleFavorite(current, pokemon);
    await this.repository.saveFavorites(favorites);
    return { favorites, added: previousIndex === -1, previousIndex };
  }
}

export class RestoreFavoriteUseCase {
  constructor(private readonly repository: FavoritesRepository) {}

  async execute(
    pokemon: PokemonSummary,
    index: number,
  ): Promise<PokemonSummary[]> {
    const favorites = restoreFavorite(
      await this.repository.getFavorites(),
      pokemon,
      index,
    );
    await this.repository.saveFavorites(favorites);
    return favorites;
  }
}
