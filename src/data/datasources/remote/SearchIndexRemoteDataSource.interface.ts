import type { PokemonSummary } from '../../../domain/models';

export interface SearchIndexRemoteDataSource {
  /** Every Pokémon (not paginated), used to search locally. */
  fetchSearchIndex(): Promise<PokemonSummary[]>;
}
