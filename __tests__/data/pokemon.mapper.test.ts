import { ErrorCode } from '../../src/core/errors';
import {
  buildArtworkUrl,
  extractIdFromUrl,
  mapDetailResponseToDetail,
  mapListResponseToPage,
} from '../../src/data/mappers/pokemon.mapper';
import type { PokemonListResponseDto } from '../../src/data/dto/PokeApi.dto';
import { PokemonType, StatName } from '../../src/domain/enums';
import {
  detailResponseDto,
  listResponseDto,
} from '../fixtures/pokemon.fixtures';

describe('pokemon.mapper', () => {
  describe('extractIdFromUrl', () => {
    it('reads the id with or without trailing slash', () => {
      expect(extractIdFromUrl('https://pokeapi.co/api/v2/pokemon/25/')).toBe(
        25,
      );
      expect(extractIdFromUrl('https://pokeapi.co/api/v2/pokemon/150')).toBe(
        150,
      );
    });

    it('throws PARSE for urls without id', () => {
      expect(() =>
        extractIdFromUrl('https://pokeapi.co/api/v2/pokemon/'),
      ).toThrow(expect.objectContaining({ code: ErrorCode.PARSE }));
    });
  });

  describe('mapListResponseToPage', () => {
    it('maps results to summaries with artwork derived from the id', () => {
      const page = mapListResponseToPage(listResponseDto, 0);

      expect(page.items).toEqual([
        { id: 1, name: 'bulbasaur', imageUrl: buildArtworkUrl(1) },
        { id: 2, name: 'ivysaur', imageUrl: buildArtworkUrl(2) },
      ]);
      expect(page.totalCount).toBe(1302);
      expect(page.nextOffset).toBe(2);
    });

    it('returns nextOffset null on the last page', () => {
      const lastPage: PokemonListResponseDto = {
        ...listResponseDto,
        count: 2,
        next: null,
      };
      expect(mapListResponseToPage(lastPage, 0).nextOffset).toBeNull();
    });

    it('rejects malformed payloads', () => {
      expect(() =>
        mapListResponseToPage({} as PokemonListResponseDto, 0),
      ).toThrow(expect.objectContaining({ code: ErrorCode.PARSE }));
    });
  });

  describe('mapDetailResponseToDetail', () => {
    it('maps units, sorts slots and prefers official artwork', () => {
      const detail = mapDetailResponseToDetail(detailResponseDto);

      expect(detail).toEqual({
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
      });
    });

    it('falls back to UNKNOWN type and drops unknown stats', () => {
      const detail = mapDetailResponseToDetail({
        ...detailResponseDto,
        types: [{ slot: 1, type: { name: 'shadow', url: '' } }],
        stats: [
          { base_stat: 1, effort: 0, stat: { name: 'accuracy', url: '' } },
        ],
        base_experience: null,
      });

      expect(detail.types).toEqual([PokemonType.UNKNOWN]);
      expect(detail.stats).toEqual([]);
      expect(detail.baseExperience).toBeNull();
    });

    it('reads the species of an alternative form', () => {
      const detail = mapDetailResponseToDetail({
        ...detailResponseDto,
        id: 10034,
        species: {
          name: 'charizard',
          url: 'https://pokeapi.co/api/v2/pokemon-species/6/',
        },
      });
      expect(detail.speciesId).toBe(6);
    });
  });
});
