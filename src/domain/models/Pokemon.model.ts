import type { PokemonType, StatName } from '../enums';

/** Lightweight shape used by the list; enough to render a card. */
export interface PokemonSummary {
  id: number;
  name: string;
  imageUrl: string;
}

export interface PokemonAbility {
  name: string;
  isHidden: boolean;
}

export interface PokemonStat {
  name: StatName;
  baseValue: number;
}

export interface PokemonDetail extends PokemonSummary {
  /** Species it belongs to: equals `id` except for alternative forms (#10001+). */
  speciesId: number;
  types: PokemonType[];
  abilities: PokemonAbility[];
  stats: PokemonStat[];
  /** Kilograms. */
  weightKg: number;
  /** Meters. */
  heightM: number;
  baseExperience: number | null;
}
