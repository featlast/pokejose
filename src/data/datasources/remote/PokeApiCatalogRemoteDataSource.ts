import { AppError, ErrorCode, toAppError } from '../../../core/errors';
import type { HttpClient } from '../../../core/http/HttpClient.interface';
import { PokemonType } from '../../../domain/enums';
import type { PokemonSummary } from '../../../domain/models';
import type {
  PokemonListResponseDto,
  TypeResponseDto,
} from '../../dto/PokeApi.dto';
import { mapNamedResourceToSummary } from '../../mappers/pokemon.mapper';
import {
  mapTypeResponsesToChart,
  mapTypeResponsesToIndex,
} from '../../mappers/typeIndex.mapper';
import type { TypeIndexSnapshot } from '../TypeIndexSnapshot.types';
import type { SearchIndexRemoteDataSource } from './SearchIndexRemoteDataSource.interface';
import type { TypeIndexRemoteDataSource } from './TypeIndexRemoteDataSource.interface';

/** Types that actually have Pokémon; `unknown`/`stellar` would be wasted requests. */
const INDEXED_TYPES = Object.values(PokemonType).filter(
  type => type !== PokemonType.UNKNOWN && type !== PokemonType.STELLAR,
);

type CatalogOptions = { searchIndexLimit: number };

/** Whole-catalog (not paginated) PokéAPI lookups; one class, two narrow contracts (ISP). */
export class PokeApiCatalogRemoteDataSource
  implements TypeIndexRemoteDataSource, SearchIndexRemoteDataSource
{
  constructor(
    private readonly http: HttpClient,
    private readonly options: CatalogOptions,
  ) {}

  /**
   * One small request per type, in parallel (~21 KB each) instead of one detail per
   * Pokémon. The same responses give the type chart (spec 004).
   */
  async fetchTypeIndex(): Promise<TypeIndexSnapshot> {
    const results = await Promise.allSettled(
      INDEXED_TYPES.map(type => this.http.get<TypeResponseDto>(`type/${type}`)),
    );
    const responses = results
      .filter(
        (result): result is PromiseFulfilledResult<TypeResponseDto> =>
          result.status === 'fulfilled',
      )
      .map(result => result.value);

    if (responses.length === 0) {
      const firstFailure = results.find(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected',
      );
      throw firstFailure
        ? toAppError(firstFailure.reason)
        : new AppError(ErrorCode.UNKNOWN, 'Type index is empty');
    }

    return {
      index: mapTypeResponsesToIndex(responses),
      chart: mapTypeResponsesToChart(responses),
      isComplete: responses.length === INDEXED_TYPES.length,
    };
  }

  async fetchSearchIndex(): Promise<PokemonSummary[]> {
    const dto = await this.http.get<PokemonListResponseDto>(
      `pokemon?limit=${this.options.searchIndexLimit}&offset=0`,
    );
    if (!Array.isArray(dto?.results)) {
      throw new AppError(ErrorCode.PARSE, 'Malformed Pokémon index response');
    }
    return dto.results.map(mapNamedResourceToSummary);
  }
}
