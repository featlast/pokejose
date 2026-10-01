import type { HttpClient } from '../../../core/http/HttpClient.interface';
import type {
  Page,
  PokemonDetail,
  PokemonSummary,
} from '../../../domain/models';
import type {
  PokemonDetailResponseDto,
  PokemonListResponseDto,
} from '../../dto/PokeApi.dto';
import {
  mapDetailResponseToDetail,
  mapListResponseToPage,
} from '../../mappers/pokemon.mapper';
import type { PokemonRemoteDataSource } from './PokemonRemoteDataSource.interface';

export class PokeApiRemoteDataSource implements PokemonRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Pages over `pokemon-species`: the National Pokédex (1025 today, #1–#1025).
   * `/pokemon` also lists 300+ alternative forms (#10001+) after them, so its
   * count is not the number of Pokémon. Species ids match the default form's id,
   * so details and artwork keep working by id.
   */
  async fetchPage(
    offset: number,
    limit: number,
  ): Promise<Page<PokemonSummary>> {
    const dto = await this.http.get<PokemonListResponseDto>(
      `pokemon-species?limit=${limit}&offset=${offset}`,
    );
    return mapListResponseToPage(dto, offset);
  }

  async fetchDetail(id: number): Promise<PokemonDetail> {
    const dto = await this.http.get<PokemonDetailResponseDto>(`pokemon/${id}`);
    return mapDetailResponseToDetail(dto);
  }
}
