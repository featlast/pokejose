import type { Page, PokemonSummary, Resource } from '../models';
import type {
  FetchPolicy,
  PokemonRepository,
} from '../repositories/PokemonRepository.interface';

export class GetPokemonPageUseCase {
  constructor(
    private readonly repository: PokemonRepository,
    private readonly pageSize: number,
  ) {}

  execute(
    offset = 0,
    policy?: FetchPolicy,
  ): Promise<Resource<Page<PokemonSummary>>> {
    return this.repository.getPokemonPage(
      Math.max(0, offset),
      this.pageSize,
      policy,
    );
  }
}
