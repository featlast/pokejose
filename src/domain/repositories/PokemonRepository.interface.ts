import type { Page, PokemonDetail, PokemonSummary, Resource } from '../models';
import type { FetchPolicy } from './FetchPolicy.types';

export type { FetchPolicy };

export interface PokemonRepository {
  getPokemonPage(
    offset: number,
    limit: number,
    policy?: FetchPolicy,
  ): Promise<Resource<Page<PokemonSummary>>>;

  getPokemonDetail(
    id: number,
    policy?: FetchPolicy,
  ): Promise<Resource<PokemonDetail>>;
}
