import type {
  Page,
  PokemonDetail,
  PokemonSummary,
} from '../../../domain/models';

export interface PokemonRemoteDataSource {
  fetchPage(offset: number, limit: number): Promise<Page<PokemonSummary>>;
  fetchDetail(id: number): Promise<PokemonDetail>;
}
