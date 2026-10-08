import { AppError, ErrorCode } from '../../core/errors';
import {
  EvolutionTrigger,
  PokemonGender,
  PokemonType,
} from '../../domain/enums';
import type {
  EvolutionChain,
  EvolutionCondition,
  EvolutionNode,
} from '../../domain/models';
import type {
  ChainLinkDto,
  EvolutionChainResponseDto,
  EvolutionDetailDto,
} from '../dto/PokeApi.dto';
import { mapNamedResourceToSummary, toPokemonType } from './pokemon.mapper';

const TRIGGERS = new Set<string>(Object.values(EvolutionTrigger));

/**
 * The condition to show for a step: the one PokéAPI marks `is_default`, or the
 * last one (the most recent games) when none is marked (FR-506).
 */
export const pickDefaultDetail = (
  details: readonly EvolutionDetailDto[],
): EvolutionDetailDto | null =>
  details.find(detail => detail.is_default) ??
  details[details.length - 1] ??
  null;

const toGender = (gender: number | null): PokemonGender | null => {
  if (gender === 1) {
    return PokemonGender.FEMALE;
  }
  return gender === 2 ? PokemonGender.MALE : null;
};

export const mapEvolutionDetail = (
  detail: EvolutionDetailDto,
): EvolutionCondition => {
  const trigger = detail.trigger?.name ?? '';
  const moveType = detail.known_move_type
    ? toPokemonType(detail.known_move_type.name)
    : null;
  return {
    trigger: TRIGGERS.has(trigger)
      ? (trigger as EvolutionTrigger)
      : EvolutionTrigger.OTHER,
    minLevel: detail.min_level ?? null,
    item: detail.item?.name ?? null,
    heldItem: detail.held_item?.name ?? null,
    friendship: detail.min_happiness != null || detail.min_affection != null,
    timeOfDay:
      detail.time_of_day === 'day' || detail.time_of_day === 'night'
        ? detail.time_of_day
        : null,
    knownMoveType: moveType === PokemonType.UNKNOWN ? null : moveType,
    gender: toGender(detail.gender ?? null),
  };
};

const mapLink = (link: ChainLinkDto, isRoot: boolean): EvolutionNode => {
  const { id, name, imageUrl } = mapNamedResourceToSummary(link.species);
  const detail = isRoot ? null : pickDefaultDetail(link.evolution_details);
  return {
    id,
    name,
    imageUrl,
    condition: detail ? mapEvolutionDetail(detail) : null,
    evolvesTo: (link.evolves_to ?? []).map(child => mapLink(child, false)),
  };
};

export const mapEvolutionChainResponse = (
  dto: EvolutionChainResponseDto,
): EvolutionChain => {
  if (typeof dto?.id !== 'number' || !dto.chain?.species) {
    throw new AppError(ErrorCode.PARSE, 'Malformed evolution chain response');
  }
  return { id: dto.id, root: mapLink(dto.chain, true) };
};
