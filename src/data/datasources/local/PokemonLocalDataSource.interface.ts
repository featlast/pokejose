import type {
  Page,
  PokemonDetail,
  PokemonSummary,
} from '../../../domain/models';
import type { CachedValue } from '../../cache/CacheEntry.types';

export interface PokemonLocalDataSource {
  getPage(
    offset: number,
    limit: number,
  ): Promise<CachedValue<Page<PokemonSummary>> | null>;
  savePage(
    offset: number,
    limit: number,
    page: Page<PokemonSummary>,
  ): Promise<void>;
  getDetail(id: number): Promise<CachedValue<PokemonDetail> | null>;
  saveDetail(detail: PokemonDetail): Promise<void>;
}
