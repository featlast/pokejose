import type {
  PokemonTypeIndex,
  Resource,
  TypeChart,
} from '../../domain/models';
import type { FetchPolicy } from '../../domain/repositories/FetchPolicy.types';
import type { PokemonTypeChartRepository } from '../../domain/repositories/PokemonTypeChartRepository.interface';
import type { PokemonTypeIndexRepository } from '../../domain/repositories/PokemonTypeIndexRepository.interface';
import { resolveWithCache } from '../cache/resolveWithCache';
import type { TypeIndexLocalDataSource } from '../datasources/local/TypeIndexLocalDataSource.interface';
import type { TypeIndexRemoteDataSource } from '../datasources/remote/TypeIndexRemoteDataSource.interface';
import type { TypeIndexSnapshot } from '../datasources/TypeIndexSnapshot.types';

/** Index and chart come from the same `/type` snapshot; two narrow contracts (ISP). */
export class PokemonTypeIndexRepositoryImpl
  implements PokemonTypeIndexRepository, PokemonTypeChartRepository
{
  constructor(
    private readonly remote: TypeIndexRemoteDataSource,
    private readonly local: TypeIndexLocalDataSource,
  ) {}

  async getTypeIndex(
    policy: FetchPolicy = {},
  ): Promise<Resource<PokemonTypeIndex>> {
    const { data, origin } = await this.getSnapshot(policy);
    return { data: data.index, origin };
  }

  async getTypeChart(policy: FetchPolicy = {}): Promise<Resource<TypeChart>> {
    const { data, origin } = await this.getSnapshot(policy);
    return { data: data.chart, origin };
  }

  private getSnapshot(policy: FetchPolicy) {
    return resolveWithCache<TypeIndexSnapshot>({
      policy,
      readCache: () => this.local.getTypeIndex(),
      fetchRemote: () => this.remote.fetchTypeIndex(),
      // A partial index is used now but not persisted, so the next launch retries it.
      writeCache: snapshot =>
        snapshot.isComplete
          ? this.local.saveTypeIndex(snapshot)
          : Promise.resolve(),
    });
  }
}
