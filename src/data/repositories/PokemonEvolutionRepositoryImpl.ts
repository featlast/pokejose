import type { EvolutionChain, Resource } from '../../domain/models';
import type { FetchPolicy } from '../../domain/repositories/FetchPolicy.types';
import type { PokemonEvolutionRepository } from '../../domain/repositories/PokemonEvolutionRepository.interface';
import { resolveWithCache } from '../cache/resolveWithCache';
import type { EvolutionLocalDataSource } from '../datasources/local/EvolutionLocalDataSource.interface';
import type { EvolutionRemoteDataSource } from '../datasources/remote/EvolutionRemoteDataSource.interface';

/** Evolution chains under the shared cache-first policy (`resolveWithCache`). */
export class PokemonEvolutionRepositoryImpl
  implements PokemonEvolutionRepository
{
  constructor(
    private readonly remote: EvolutionRemoteDataSource,
    private readonly local: EvolutionLocalDataSource,
  ) {}

  getEvolutionChain(
    speciesId: number,
    policy: FetchPolicy = {},
  ): Promise<Resource<EvolutionChain>> {
    return resolveWithCache({
      policy,
      readCache: () => this.local.getEvolutionChain(speciesId),
      fetchRemote: () => this.remote.fetchEvolutionChain(speciesId),
      writeCache: chain => this.local.saveEvolutionChain(chain),
    });
  }
}
