import type { PokemonType } from '../enums';
import type { PokemonTypeIndex, Resource } from '../models';
import type { PokemonTypeIndexRepository } from '../repositories/PokemonTypeIndexRepository.interface';

export class GetPokemonTypeIndexUseCase {
  constructor(private readonly repository: PokemonTypeIndexRepository) {}

  execute(): Promise<Resource<PokemonTypeIndex>> {
    return this.repository.getTypeIndex();
  }
}

/** Primary (slot 1) type of a Pokémon, or null when the index does not know it. */
export const primaryTypeOf = (
  index: PokemonTypeIndex | null,
  id: number,
): PokemonType | null => index?.[id]?.[0] ?? null;
