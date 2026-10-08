import type { PokemonSummary } from '../models';

export interface FavoritesRepository {
  /** Favorites, most recently added first. */
  getFavorites(): Promise<PokemonSummary[]>;
  saveFavorites(favorites: readonly PokemonSummary[]): Promise<void>;
}
