import type {
  Page,
  PokemonDetail,
  PokemonSummary,
} from '../../../domain/models';
import type { CachedValue } from '../../cache/CacheEntry.types';
import type { StorageCache } from '../../cache/StorageCache';
import type { PokemonLocalDataSource } from './PokemonLocalDataSource.interface';

type PokemonCacheTtl = {
  listTtlMs: number;
  detailTtlMs: number;
};

const KEY_PREFIX = 'pokedex';
const pageKey = (offset: number, limit: number) =>
  `${KEY_PREFIX}:list:${offset}:${limit}`;
const detailKey = (id: number) => `${KEY_PREFIX}:detail:${id}`;

export class PokemonStorageDataSource implements PokemonLocalDataSource {
  constructor(
    private readonly cache: StorageCache,
    private readonly ttl: PokemonCacheTtl,
  ) {}

  getPage(
    offset: number,
    limit: number,
  ): Promise<CachedValue<Page<PokemonSummary>> | null> {
    return this.cache.read(pageKey(offset, limit), this.ttl.listTtlMs);
  }

  savePage(
    offset: number,
    limit: number,
    page: Page<PokemonSummary>,
  ): Promise<void> {
    return this.cache.write(pageKey(offset, limit), page);
  }

  getDetail(id: number): Promise<CachedValue<PokemonDetail> | null> {
    return this.cache.read(detailKey(id), this.ttl.detailTtlMs);
  }

  saveDetail(detail: PokemonDetail): Promise<void> {
    return this.cache.write(detailKey(detail.id), detail);
  }
}
