import { AppError, ErrorCode } from '../../../core/errors';
import type { HttpClient } from '../../../core/http/HttpClient.interface';
import type { EvolutionChain } from '../../../domain/models';
import type {
  EvolutionChainResponseDto,
  PokemonSpeciesResponseDto,
} from '../../dto/PokeApi.dto';
import { mapEvolutionChainResponse } from '../../mappers/evolution.mapper';
import { extractIdFromUrl } from '../../mappers/pokemon.mapper';
import type { EvolutionRemoteDataSource } from './EvolutionRemoteDataSource.interface';

/** Species → its chain id → the whole chain: two requests (FR-508). */
export class PokeApiEvolutionRemoteDataSource
  implements EvolutionRemoteDataSource
{
  constructor(private readonly http: HttpClient) {}

  async fetchEvolutionChain(speciesId: number): Promise<EvolutionChain> {
    const species = await this.http.get<PokemonSpeciesResponseDto>(
      `pokemon-species/${speciesId}`,
    );
    const chainUrl = species?.evolution_chain?.url;
    if (!chainUrl) {
      throw new AppError(ErrorCode.PARSE, 'Species without evolution chain');
    }
    const dto = await this.http.get<EvolutionChainResponseDto>(
      `evolution-chain/${extractIdFromUrl(chainUrl)}`,
    );
    return mapEvolutionChainResponse(dto);
  }
}
