import type { PokemonType } from '../enums';

/**
 * Damage a defending type takes from each attacking type, keyed
 * `chart[defender][attacker]`. Only multipliers other than ×1 are listed.
 */
export type TypeChart = Readonly<
  Partial<Record<PokemonType, Readonly<Partial<Record<PokemonType, number>>>>>
>;
