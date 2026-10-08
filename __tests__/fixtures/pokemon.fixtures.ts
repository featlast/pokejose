import type {
  PokemonDetailResponseDto,
  PokemonListResponseDto,
} from '../../src/data/dto/PokeApi.dto';
import { DataOrigin, PokemonType, StatName } from '../../src/domain/enums';
import type {
  Page,
  PokemonDetail,
  PokemonSummary,
  Resource,
} from '../../src/domain/models';

export const listResponseDto: PokemonListResponseDto = {
  count: 1302,
  next: 'https://pokeapi.co/api/v2/pokemon?offset=20&limit=20',
  previous: null,
  results: [
    { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
    { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
  ],
};

export const detailResponseDto: PokemonDetailResponseDto = {
  id: 1,
  name: 'bulbasaur',
  height: 7,
  weight: 69,
  base_experience: 64,
  types: [
    { slot: 2, type: { name: 'poison', url: '' } },
    { slot: 1, type: { name: 'grass', url: '' } },
  ],
  abilities: [
    { slot: 3, is_hidden: true, ability: { name: 'chlorophyll', url: '' } },
    { slot: 1, is_hidden: false, ability: { name: 'overgrow', url: '' } },
  ],
  stats: [
    { base_stat: 45, effort: 0, stat: { name: 'hp', url: '' } },
    { base_stat: 49, effort: 0, stat: { name: 'attack', url: '' } },
  ],
  sprites: {
    front_default: 'front.png',
    other: { 'official-artwork': { front_default: 'artwork.png' } },
  },
};

export const makeSummary = (
  id: number,
  name = `pokemon-${id}`,
): PokemonSummary => ({
  id,
  name,
  imageUrl: `https://img/${id}.png`,
});

export const makePage = (
  ids: number[],
  nextOffset: number | null = null,
  totalCount = 1302,
): Page<PokemonSummary> => ({
  items: ids.map(id => makeSummary(id)),
  nextOffset,
  totalCount,
});

export const bulbasaurDetail: PokemonDetail = {
  id: 1,
  speciesId: 1,
  name: 'bulbasaur',
  imageUrl: 'artwork.png',
  types: [PokemonType.GRASS, PokemonType.POISON],
  abilities: [
    { name: 'overgrow', isHidden: false },
    { name: 'chlorophyll', isHidden: true },
  ],
  stats: [
    { name: StatName.HP, baseValue: 45 },
    { name: StatName.ATTACK, baseValue: 49 },
  ],
  weightKg: 6.9,
  heightM: 0.7,
  baseExperience: 64,
};

export const resource = <T>(
  data: T,
  origin: DataOrigin = DataOrigin.NETWORK,
): Resource<T> => ({ data, origin });

/** Resolves every pending promise in the microtask queue. */
export const flushPromises = () =>
  new Promise<void>(resolve => setImmediate(resolve));
