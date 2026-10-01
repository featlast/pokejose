import type { PokemonSummary } from '../../../domain/models';
import type { CachedValue } from '../../cache/CacheEntry.types';

export interface SearchIndexLocalDataSource {
  getSearchIndex(): Promise<CachedValue<PokemonSummary[]> | null>;
  saveSearchIndex(entries: PokemonSummary[]): Promise<void>;
}
