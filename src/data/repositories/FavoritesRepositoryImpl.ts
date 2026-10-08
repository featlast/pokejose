import type { KeyValueStorage } from '../../core/storage/KeyValueStorage.interface';
import type { PokemonSummary } from '../../domain/models';
import type { FavoritesRepository } from '../../domain/repositories/FavoritesRepository.interface';

/** Own key and version: favorites never go through `StorageCache` (ADR-24). */
const FAVORITES_KEY = 'pokedex:favorites';
const FAVORITES_VERSION = 1;

type StoredFavorites = { version: number; items: PokemonSummary[] };

const isSummary = (value: unknown): value is PokemonSummary => {
  const item = value as PokemonSummary;
  return (
    typeof item?.id === 'number' &&
    typeof item.name === 'string' &&
    typeof item.imageUrl === 'string'
  );
};

const parse = (raw: string | null): PokemonSummary[] => {
  if (!raw) {
    return [];
  }
  try {
    const stored = JSON.parse(raw) as StoredFavorites;
    if (stored?.version !== FAVORITES_VERSION || !Array.isArray(stored.items)) {
      return [];
    }
    return stored.items.filter(isSummary);
  } catch {
    // Corrupt data must not break the app: start over with no favorites.
    return [];
  }
};

/**
 * Favorites persisted in the native key-value store. Memory is the source of
 * truth once loaded: changes are visible at once and written in the background
 * (ADR-25).
 */
export class FavoritesRepositoryImpl implements FavoritesRepository {
  private memory: PokemonSummary[] | null = null;
  private loading: Promise<PokemonSummary[]> | null = null;

  constructor(private readonly storage: KeyValueStorage) {}

  getFavorites(): Promise<PokemonSummary[]> {
    if (this.memory) {
      return Promise.resolve([...this.memory]);
    }
    // `??=` is avoided on purpose: the React Native Babel preset does not transform it.
    if (!this.loading) {
      this.loading = this.storage
        .getItem(FAVORITES_KEY)
        .catch(() => null)
        .then(raw => {
          // A save that happened while loading wins over what was on disk.
          if (!this.memory) {
            this.memory = parse(raw);
          }
          return this.memory;
        });
    }
    return this.loading.then(items => [...items]);
  }

  async saveFavorites(favorites: readonly PokemonSummary[]): Promise<void> {
    this.memory = [...favorites];
    const stored: StoredFavorites = {
      version: FAVORITES_VERSION,
      items: this.memory,
    };
    await this.storage.setItem(FAVORITES_KEY, JSON.stringify(stored));
  }
}
