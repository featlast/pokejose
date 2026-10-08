import type { EvolutionTrigger, PokemonGender, PokemonType } from '../enums';

export type TimeOfDay = 'day' | 'night';

/** What a step of the chain requires; fields the step does not need are null. */
export interface EvolutionCondition {
  trigger: EvolutionTrigger;
  minLevel: number | null;
  /** Item used on the Pokémon (API name, e.g. "water-stone"). */
  item: string | null;
  /** Item held while levelling up or trading (API name). */
  heldItem: string | null;
  /** Needs high friendship or affection. */
  friendship: boolean;
  timeOfDay: TimeOfDay | null;
  /** Must know a move of this type. */
  knownMoveType: PokemonType | null;
  gender: PokemonGender | null;
}

export interface EvolutionNode {
  /** Species id (also the id of its default form and artwork). */
  id: number;
  name: string;
  imageUrl: string;
  /** How it evolves from its parent; null for the base Pokémon. */
  condition: EvolutionCondition | null;
  evolvesTo: EvolutionNode[];
}

export interface EvolutionChain {
  id: number;
  root: EvolutionNode;
}
