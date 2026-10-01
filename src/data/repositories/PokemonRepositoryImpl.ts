import type {
  Page,
  PokemonDetail,
  PokemonSummary,
  Resource,
} from '../../domain/models';
import type { FetchPolicy } from '../../domain/repositories/FetchPolicy.types';
import type { PokemonRepository } from '../../domain/repositories/PokemonRepository.interface';
import { resolveWithCache } from '../cache/resolveWithCache';
import type { PokemonLocalDataSource } from '../datasources/local/PokemonLocalDataSource.interface';
import type { PokemonRemoteDataSource } from '../datasources/remote/PokemonRemoteDataSource.interface';

/** Pokémon pages and details under the shared cache-first policy (`resolveWithCache`). */
export class PokemonRepositoryImpl implements PokemonRepository {
  constructor(
    private readonly remote: PokemonRemoteDataSource,
    private readonly local: PokemonLocalDataSource,
  ) {}

  getPokemonPage(
    offset: number,
    limit: number,
    policy: FetchPolicy = {},
  ): Promise<Resource<Page<PokemonSummary>>> {
    return resolveWithCache({
      policy,
      readCache: () => this.local.getPage(offset, limit),
      fetchRemote: () => this.remote.fetchPage(offset, limit),
      writeCache: page => this.local.savePage(offset, limit, page),
    });
  }

  getPokemonDetail(
    id: number,
    policy: FetchPolicy = {},
  ): Promise<Resource<PokemonDetail>> {
    return resolveWithCache({
      policy,
      readCache: () => this.local.getDetail(id),
      fetchRemote: () => this.remote.fetchDetail(id),
      writeCache: detail => this.local.saveDetail(detail),
    });
  }
}
