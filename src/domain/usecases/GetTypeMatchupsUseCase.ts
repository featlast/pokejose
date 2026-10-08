import { PokemonType } from '../enums';
import type { TypeChart, TypeMatchup, TypeMatchups } from '../models';
import type { PokemonTypeChartRepository } from '../repositories/PokemonTypeChartRepository.interface';

/** Types that can attack: every real type, in the app's canonical order. */
const ATTACKING_TYPES = Object.values(PokemonType).filter(
  type => type !== PokemonType.UNKNOWN && type !== PokemonType.STELLAR,
);

/**
 * Weaknesses, resistances and immunities of a Pokémon with `defending` types.
 * With two types the multipliers multiply (Grass/Poison takes ×¼ from Grass).
 * Returns null when the chart does not know one of the types (partial index),
 * rather than a wrong answer.
 */
export const defensiveMatchups = (
  chart: TypeChart,
  defending: readonly PokemonType[],
): TypeMatchups | null => {
  const relations = defending.map(type => chart[type]);
  if (relations.length === 0 || relations.some(relation => !relation)) {
    return null;
  }

  const matchups: TypeMatchup[] = ATTACKING_TYPES.map(attacker => ({
    type: attacker,
    multiplier: relations.reduce(
      (product, relation) => product * (relation?.[attacker] ?? 1),
      1,
    ),
  }));

  // `sort` is stable: equal multipliers keep the canonical type order.
  return {
    weaknesses: matchups
      .filter(({ multiplier }) => multiplier > 1)
      .sort((a, b) => b.multiplier - a.multiplier),
    resistances: matchups
      .filter(({ multiplier }) => multiplier > 0 && multiplier < 1)
      .sort((a, b) => a.multiplier - b.multiplier),
    immunities: matchups.filter(({ multiplier }) => multiplier === 0),
  };
};

export class GetTypeMatchupsUseCase {
  constructor(private readonly repository: PokemonTypeChartRepository) {}

  async execute(types: readonly PokemonType[]): Promise<TypeMatchups | null> {
    const { data } = await this.repository.getTypeChart();
    return defensiveMatchups(data, types);
  }
}
