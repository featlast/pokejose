import type { PokemonTypeIndex, Resource } from '../../domain/models';
import type { FetchPolicy } from '../../domain/repositories/FetchPolicy.types';
import type { PokemonTypeIndexRepository } from '../../domain/repositories/PokemonTypeIndexRepository.interface';
import { resolveWithCache } from '../cache/resolveWithCache';
import type { TypeIndexLocalDataSource } from '../datasources/local/TypeIndexLocalDataSource.interface';
import type { TypeIndexRemoteDataSource } from '../datasources/remote/TypeIndexRemoteDataSource.interface';

export class PokemonTypeIndexRepositoryImpl
  implements PokemonTypeIndexRepository
{
  constructor(
    private readonly remote: TypeIndexRemoteDataSource,
    private readonly local: TypeIndexLocalDataSource,
  ) {}

  async getTypeIndex(
    policy: FetchPolicy = {},
  ): Promise<Resource<PokemonTypeIndex>> {
    const { data, origin } = await resolveWithCache({
      policy,
      readCache: () => this.local.getTypeIndex(),
      fetchRemote: () => this.remote.fetchTypeIndex(),
      // A partial index is used now but not persisted, so the next launch retries it.
      writeCache: snapshot =>
        snapshot.isComplete
          ? this.local.saveTypeIndex(snapshot)
          : Promise.resolve(),
    });
    return { data: data.index, origin };
  }
}
