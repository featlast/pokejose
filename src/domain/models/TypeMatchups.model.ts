import type { PokemonType } from '../enums';

export interface TypeMatchup {
  /** Attacking type. */
  type: PokemonType;
  /** Damage multiplier against the Pokémon: 4, 2, 0.5, 0.25 or 0. */
  multiplier: number;
}

/** How a Pokémon fares against each attacking type (×1 entries are left out). */
export interface TypeMatchups {
  weaknesses: TypeMatchup[];
  resistances: TypeMatchup[];
  immunities: TypeMatchup[];
}
