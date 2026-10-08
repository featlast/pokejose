import type { EvolutionChain, Resource } from '../models';
import type { FetchPolicy } from './FetchPolicy.types';

export interface PokemonEvolutionRepository {
  /** Whole evolution chain the species belongs to. */
  getEvolutionChain(
    speciesId: number,
    policy?: FetchPolicy,
  ): Promise<Resource<EvolutionChain>>;
}
