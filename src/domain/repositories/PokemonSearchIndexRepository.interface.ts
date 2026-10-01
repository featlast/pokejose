import type { PokemonSummary, Resource } from '../models';
import type { FetchPolicy } from './FetchPolicy.types';

export interface PokemonSearchIndexRepository {
  /** Every Pokémon (id, name, image), used to search locally. */
  getSearchIndex(policy?: FetchPolicy): Promise<Resource<PokemonSummary[]>>;
}
