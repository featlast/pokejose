import type { PokemonSummary } from '../../../domain/models';
import type { CachedValue } from '../../cache/CacheEntry.types';
import type { StorageCache } from '../../cache/StorageCache';
import type { TypeIndexSnapshot } from '../TypeIndexSnapshot.types';
import type { SearchIndexLocalDataSource } from './SearchIndexLocalDataSource.interface';
import type { TypeIndexLocalDataSource } from './TypeIndexLocalDataSource.interface';

const TYPE_INDEX_KEY = 'pokedex:type-index';
const SEARCH_INDEX_KEY = 'pokedex:search-index';

export class PokemonCatalogStorageDataSource
  implements TypeIndexLocalDataSource, SearchIndexLocalDataSource
{
  constructor(
    private readonly cache: StorageCache,
    private readonly ttlMs: number,
  ) {}

  getTypeIndex(): Promise<CachedValue<TypeIndexSnapshot> | null> {
    return this.cache.read(TYPE_INDEX_KEY, this.ttlMs);
  }

  saveTypeIndex(snapshot: TypeIndexSnapshot): Promise<void> {
    return this.cache.write(TYPE_INDEX_KEY, snapshot);
  }

  getSearchIndex(): Promise<CachedValue<PokemonSummary[]> | null> {
    return this.cache.read(SEARCH_INDEX_KEY, this.ttlMs);
  }

  saveSearchIndex(entries: PokemonSummary[]): Promise<void> {
    return this.cache.write(SEARCH_INDEX_KEY, entries);
  }
}
