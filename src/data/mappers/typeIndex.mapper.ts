import { PokemonType } from '../../domain/enums';
import type { PokemonTypeIndex } from '../../domain/models';
import type { TypeResponseDto } from '../dto/PokeApi.dto';
import { extractIdFromUrl, toPokemonType } from './pokemon.mapper';

/**
 * Inverts `/type/{name}` responses (type → Pokémon) into an index (Pokémon → types).
 * Alternative forms (ids > 10000) are kept: they appear in search results.
 * Unknown types are skipped; each list is ordered by slot.
 */
export const mapTypeResponsesToIndex = (
  responses: readonly TypeResponseDto[],
): PokemonTypeIndex => {
  const slots: Record<number, PokemonType[]> = {};

  responses.forEach(response => {
    const type = toPokemonType(response.name);
    if (type === PokemonType.UNKNOWN) {
      return;
    }
    (response.pokemon ?? []).forEach(entry => {
      const id = extractIdFromUrl(entry.pokemon.url);
      const types = slots[id] ?? [];
      types[entry.slot - 1] = type;
      slots[id] = types;
    });
  });

  const index: Record<number, PokemonType[]> = {};
  Object.entries(slots).forEach(([id, types]) => {
    index[Number(id)] = types.filter(Boolean);
  });
  return index;
};
