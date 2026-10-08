import type { PokemonTypeIndex, TypeChart } from '../../domain/models';

/** Result of building the type index; `isComplete` is false when some types failed. */
export type TypeIndexSnapshot = {
  index: PokemonTypeIndex;
  /** Damage relations from the same responses (spec 004). */
  chart: TypeChart;
  isComplete: boolean;
};
