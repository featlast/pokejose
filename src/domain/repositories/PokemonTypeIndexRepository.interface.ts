import type { PokemonTypeIndex, Resource } from '../models';
import type { FetchPolicy } from './FetchPolicy.types';

export interface PokemonTypeIndexRepository {
  getTypeIndex(policy?: FetchPolicy): Promise<Resource<PokemonTypeIndex>>;
}
