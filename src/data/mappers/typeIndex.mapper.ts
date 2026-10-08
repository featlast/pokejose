import { PokemonType } from '../../domain/enums';
import type { PokemonTypeIndex, TypeChart } from '../../domain/models';
import type { NamedApiResourceDto, TypeResponseDto } from '../dto/PokeApi.dto';
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

/**
 * Defensive damage relations of each type (`chart[defender][attacker]`), from the
 * same `/type/{name}` responses as the index. Types missing from `responses`
 * (failed requests) are missing from the chart too.
 */
export const mapTypeResponsesToChart = (
  responses: readonly TypeResponseDto[],
): TypeChart => {
  const chart: Partial<
    Record<PokemonType, Partial<Record<PokemonType, number>>>
  > = {};
  responses.forEach(response => {
    const defender = toPokemonType(response.name);
    if (defender === PokemonType.UNKNOWN) {
      return;
    }
    const relations = response.damage_relations;
    const multipliers: Partial<Record<PokemonType, number>> = {};
    const add = (
      attackers: NamedApiResourceDto[] | undefined,
      multiplier: number,
    ) =>
      (attackers ?? []).forEach(attacker => {
        const type = toPokemonType(attacker.name);
        if (type !== PokemonType.UNKNOWN) {
          multipliers[type] = multiplier;
        }
      });
    add(relations?.double_damage_from, 2);
    add(relations?.half_damage_from, 0.5);
    add(relations?.no_damage_from, 0);
    chart[defender] = multipliers;
  });
  return chart;
};
