import type { PokemonType } from '../enums';

/**
 * Types of every Pokémon keyed by id, ordered by slot (index 0 = primary type).
 * Lets the list show types without requesting each Pokémon's detail.
 */
export type PokemonTypeIndex = Readonly<Record<number, readonly PokemonType[]>>;
