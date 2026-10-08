import { API_CONFIG } from '../../core/config/app.config';
import { AppError, ErrorCode } from '../../core/errors';
import { PokemonType, StatName } from '../../domain/enums';
import type {
  Page,
  PokemonDetail,
  PokemonStat,
  PokemonSummary,
} from '../../domain/models';
import type {
  NamedApiResourceDto,
  PokemonDetailResponseDto,
  PokemonListResponseDto,
} from '../dto/PokeApi.dto';

const POKEMON_TYPES = new Set<string>(Object.values(PokemonType));
const STAT_NAMES = new Set<string>(Object.values(StatName));

/** Extracts the numeric id from ".../pokemon/25/". */
export const extractIdFromUrl = (url: string): number => {
  const match = /\/(\d+)\/?$/.exec(url);
  if (!match) {
    throw new AppError(ErrorCode.PARSE, `Cannot extract id from url: ${url}`);
  }
  return Number(match[1]);
};

export const buildArtworkUrl = (id: number): string =>
  `${API_CONFIG.artworkBaseUrl}/${id}.png`;

export const mapNamedResourceToSummary = (
  resource: NamedApiResourceDto,
): PokemonSummary => {
  const id = extractIdFromUrl(resource.url);
  return { id, name: resource.name, imageUrl: buildArtworkUrl(id) };
};

export const mapListResponseToPage = (
  dto: PokemonListResponseDto,
  offset: number,
): Page<PokemonSummary> => {
  if (!Array.isArray(dto?.results)) {
    throw new AppError(ErrorCode.PARSE, 'Malformed Pokémon list response');
  }
  const items = dto.results.map(mapNamedResourceToSummary);
  const reachedEnd = dto.next === null || offset + items.length >= dto.count;
  return {
    items,
    totalCount: dto.count,
    nextOffset: reachedEnd ? null : offset + items.length,
  };
};

export const toPokemonType = (name: string): PokemonType =>
  POKEMON_TYPES.has(name) ? (name as PokemonType) : PokemonType.UNKNOWN;

const toStat = (name: string, baseValue: number): PokemonStat | null =>
  STAT_NAMES.has(name) ? { name: name as StatName, baseValue } : null;

export const mapDetailResponseToDetail = (
  dto: PokemonDetailResponseDto,
): PokemonDetail => {
  if (typeof dto?.id !== 'number' || typeof dto?.name !== 'string') {
    throw new AppError(ErrorCode.PARSE, 'Malformed Pokémon detail response');
  }

  const artwork =
    dto.sprites?.other?.['official-artwork']?.front_default ??
    dto.sprites?.front_default ??
    buildArtworkUrl(dto.id);

  return {
    id: dto.id,
    speciesId: dto.species?.url ? extractIdFromUrl(dto.species.url) : dto.id,
    name: dto.name,
    imageUrl: artwork,
    types: [...(dto.types ?? [])]
      .sort((a, b) => a.slot - b.slot)
      .map(slot => toPokemonType(slot.type.name)),
    abilities: [...(dto.abilities ?? [])]
      .sort((a, b) => a.slot - b.slot)
      .map(slot => ({ name: slot.ability.name, isHidden: slot.is_hidden })),
    stats: (dto.stats ?? [])
      .map(stat => toStat(stat.stat.name, stat.base_stat))
      .filter((stat): stat is PokemonStat => stat !== null),
    weightKg: dto.weight / 10,
    heightM: dto.height / 10,
    baseExperience: dto.base_experience ?? null,
  };
};
