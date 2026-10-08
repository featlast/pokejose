import type { EvolutionChain } from '../../../domain/models';
import type { CachedValue } from '../../cache/CacheEntry.types';

export interface EvolutionLocalDataSource {
  getEvolutionChain(
    speciesId: number,
  ): Promise<CachedValue<EvolutionChain> | null>;
  /** Stores the chain under every member, so any of them finds it (ADR-19). */
  saveEvolutionChain(chain: EvolutionChain): Promise<void>;
}
