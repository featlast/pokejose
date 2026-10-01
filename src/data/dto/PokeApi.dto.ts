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
}

export interface TypePokemonSlotDto {
  /** 1 = primary type of that Pokémon, 2 = secondary. */
  slot: number;
  pokemon: NamedApiResourceDto;
}

export interface TypeResponseDto {
  name: string;
  pokemon: TypePokemonSlotDto[];
}
