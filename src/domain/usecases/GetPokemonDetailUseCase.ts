import { AppError, ErrorCode } from '../../core/errors';
import type { PokemonDetail, Resource } from '../models';
import type {
  FetchPolicy,
  PokemonRepository,
} from '../repositories/PokemonRepository.interface';

export class GetPokemonDetailUseCase {
  constructor(private readonly repository: PokemonRepository) {}

  async execute(
    id: number,
    policy?: FetchPolicy,
  ): Promise<Resource<PokemonDetail>> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError(ErrorCode.NOT_FOUND, `Invalid Pokémon id: ${id}`);
    }
    return this.repository.getPokemonDetail(id, policy);
  }
}
