import type { PokemonTypeIndex } from '../../domain/models';

/** Result of building the type index; `isComplete` is false when some types failed. */
export type TypeIndexSnapshot = {
  index: PokemonTypeIndex;
  isComplete: boolean;
};
