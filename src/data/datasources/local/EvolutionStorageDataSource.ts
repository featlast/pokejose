import type { EvolutionChain } from '../../../domain/models';
import { flattenEvolutionChain } from '../../../domain/usecases/GetEvolutionChainUseCase';
import type { CachedValue } from '../../cache/CacheEntry.types';
import type { StorageCache } from '../../cache/StorageCache';
import type { EvolutionLocalDataSource } from './EvolutionLocalDataSource.interface';

const evolutionKey = (speciesId: number) => `pokedex:evolution:${speciesId}`;

export class EvolutionStorageDataSource implements EvolutionLocalDataSource {
  constructor(
    private readonly cache: StorageCache,
    private readonly ttlMs: number,
  ) {}

  getEvolutionChain(
    speciesId: number,
  ): Promise<CachedValue<EvolutionChain> | null> {
    return this.cache.read(evolutionKey(speciesId), this.ttlMs);
  }

  async saveEvolutionChain(chain: EvolutionChain): Promise<void> {
    await Promise.all(
      flattenEvolutionChain(chain).map(({ node }) =>
        this.cache.write(evolutionKey(node.id), chain),
      ),
    );
  }
}
