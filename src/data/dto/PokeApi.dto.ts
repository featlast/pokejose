/**
 * Wire contracts for PokéAPI v2. Only the fields the app consumes are declared.
 * https://pokeapi.co/docs/v2
 */

export interface NamedApiResourceDto {
  name: string;
  url: string;
}

export interface PokemonListResponseDto {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedApiResourceDto[];
}

export interface PokemonTypeSlotDto {
  slot: number;
  type: NamedApiResourceDto;
}

export interface PokemonAbilitySlotDto {
  slot: number;
  is_hidden: boolean;
  ability: NamedApiResourceDto;
}

export interface PokemonStatDto {
  base_stat: number;
  effort: number;
  stat: NamedApiResourceDto;
}

export interface PokemonSpritesDto {
  front_default: string | null;
  other?: {
    'official-artwork'?: {
      front_default: string | null;
    };
  };
}

export interface PokemonDetailResponseDto {
  id: number;
  name: string;
  /** Decimetres. */
  height: number;
  /** Hectograms. */
  weight: number;
  base_experience: number | null;
  types: PokemonTypeSlotDto[];
  abilities: PokemonAbilitySlotDto[];
  stats: PokemonStatDto[];
  sprites: PokemonSpritesDto;
  species?: NamedApiResourceDto;
}

export interface TypePokemonSlotDto {
  /** 1 = primary type of that Pokémon, 2 = secondary. */
  slot: number;
  pokemon: NamedApiResourceDto;
}

/** Defensive side of a type: who hits it for ×2, ×½ and ×0. */
export interface TypeDamageRelationsDto {
  double_damage_from: NamedApiResourceDto[];
  half_damage_from: NamedApiResourceDto[];
  no_damage_from: NamedApiResourceDto[];
}

export interface TypeResponseDto {
  name: string;
  pokemon: TypePokemonSlotDto[];
  damage_relations?: TypeDamageRelationsDto;
}

export interface PokemonSpeciesResponseDto {
  id: number;
  evolution_chain: { url: string } | null;
}

export interface EvolutionDetailDto {
  trigger: NamedApiResourceDto | null;
  min_level: number | null;
  item: NamedApiResourceDto | null;
  held_item: NamedApiResourceDto | null;
  min_happiness: number | null;
  min_affection: number | null;
  time_of_day: string;
  known_move_type: NamedApiResourceDto | null;
  /** 1 = female, 2 = male. */
  gender: number | null;
  /** Marks the condition to show when it changed across games. */
  is_default?: boolean;
}

export interface ChainLinkDto {
  species: NamedApiResourceDto;
  evolution_details: EvolutionDetailDto[];
  evolves_to: ChainLinkDto[];
}

export interface EvolutionChainResponseDto {
  id: number;
  chain: ChainLinkDto;
}
