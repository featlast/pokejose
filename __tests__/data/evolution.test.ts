import { InMemoryKeyValueStorage } from '../../src/core/storage/InMemoryKeyValueStorage';
import type { HttpClient } from '../../src/core/http/HttpClient.interface';
import { StorageCache } from '../../src/data/cache/StorageCache';
import { EvolutionStorageDataSource } from '../../src/data/datasources/local/EvolutionStorageDataSource';
import { PokeApiEvolutionRemoteDataSource } from '../../src/data/datasources/remote/PokeApiEvolutionRemoteDataSource';
import type {
  ChainLinkDto,
  EvolutionDetailDto,
} from '../../src/data/dto/PokeApi.dto';
import {
  mapEvolutionChainResponse,
  pickDefaultDetail,
} from '../../src/data/mappers/evolution.mapper';
import { PokemonEvolutionRepositoryImpl } from '../../src/data/repositories/PokemonEvolutionRepositoryImpl';
import {
  DataOrigin,
  EvolutionTrigger,
  PokemonGender,
  PokemonType,
} from '../../src/domain/enums';

const species = (id: number, name: string) => ({
  name,
  url: `https://pokeapi.co/api/v2/pokemon-species/${id}/`,
});

const detail = (
  overrides: Partial<EvolutionDetailDto> = {},
): EvolutionDetailDto => ({
  trigger: { name: 'level-up', url: '' },
  min_level: null,
  item: null,
  held_item: null,
  min_happiness: null,
  min_affection: null,
  time_of_day: '',
  known_move_type: null,
  gender: null,
  ...overrides,
});

const link = (
  id: number,
  name: string,
  details: EvolutionDetailDto[],
  evolvesTo: ChainLinkDto[] = [],
): ChainLinkDto => ({
  species: species(id, name),
  evolution_details: details,
  evolves_to: evolvesTo,
});

/** Charmander → Charmeleon (Nv. 16) → Charizard (Nv. 36), as PokéAPI returns it. */
const charmanderChain = {
  id: 2,
  chain: link(
    4,
    'charmander',
    [],
    [
      link(
        5,
        'charmeleon',
        [detail({ min_level: 16 })],
        [link(6, 'charizard', [detail({ min_level: 36 })])],
      ),
    ],
  ),
};

describe('evolution mapper', () => {
  it('maps the tree with ids, artwork and the condition of each step', () => {
    const chain = mapEvolutionChainResponse(charmanderChain);
    expect(chain.id).toBe(2);
    expect(chain.root).toMatchObject({ id: 4, name: 'charmander' });
    expect(chain.root.condition).toBeNull();
    const charmeleon = chain.root.evolvesTo[0];
    expect(charmeleon.imageUrl).toContain('/5.png');
    expect(charmeleon.condition).toEqual({
      trigger: EvolutionTrigger.LEVEL_UP,
      minLevel: 16,
      item: null,
      heldItem: null,
      friendship: false,
      timeOfDay: null,
      knownMoveType: null,
      gender: null,
    });
    expect(charmeleon.evolvesTo[0].condition?.minLevel).toBe(36);
  });

  it('uses the default condition, or the latest one when none is marked', () => {
    const rock = detail({ min_level: 1 });
    const stone = detail({
      trigger: { name: 'use-item', url: '' },
      item: { name: 'leaf-stone', url: '' },
      is_default: true,
    });
    expect(pickDefaultDetail([rock, stone, rock])).toBe(stone);
    const older = detail({ min_level: 20 });
    const newer = detail({ min_level: 25 });
    expect(pickDefaultDetail([older, newer])).toBe(newer);
    expect(pickDefaultDetail([])).toBeNull();
  });

  it('reads friendship, time, move type, gender and unknown triggers', () => {
    const chain = mapEvolutionChainResponse({
      id: 67,
      chain: link(
        133,
        'eevee',
        [],
        [
          link(197, 'umbreon', [
            detail({ min_happiness: 160, time_of_day: 'night' }),
          ]),
          link(700, 'sylveon', [
            detail({
              min_affection: 2,
              known_move_type: { name: 'fairy', url: '' },
            }),
          ]),
          link(999, 'test', [
            detail({ trigger: { name: 'spin', url: '' }, gender: 1 }),
          ]),
        ],
      ),
    });
    const [umbreon, sylveon, other] = chain.root.evolvesTo;
    expect(umbreon.condition).toMatchObject({
      friendship: true,
      timeOfDay: 'night',
    });
    expect(sylveon.condition).toMatchObject({
      friendship: true,
      knownMoveType: PokemonType.FAIRY,
    });
    expect(other.condition).toMatchObject({
      trigger: EvolutionTrigger.OTHER,
      gender: PokemonGender.FEMALE,
    });
  });

  it('rejects a malformed response', () => {
    expect(() =>
      mapEvolutionChainResponse({} as unknown as typeof charmanderChain),
    ).toThrow();
  });
});

describe('PokeApiEvolutionRemoteDataSource', () => {
  it('goes from the species to its chain', async () => {
    const http: HttpClient = {
      get: jest.fn(async (path: string) =>
        path === 'pokemon-species/5'
          ? {
              id: 5,
              evolution_chain: {
                url: 'https://pokeapi.co/api/v2/evolution-chain/2/',
              },
            }
          : charmanderChain,
      ) as HttpClient['get'],
    };
    const chain = await new PokeApiEvolutionRemoteDataSource(
      http,
    ).fetchEvolutionChain(5);
    expect(http.get).toHaveBeenNthCalledWith(1, 'pokemon-species/5');
    expect(http.get).toHaveBeenNthCalledWith(2, 'evolution-chain/2');
    expect(chain.root.id).toBe(4);
  });
});

describe('PokemonEvolutionRepositoryImpl', () => {
  it('caches the chain under every member', async () => {
    const remote = {
      fetchEvolutionChain: jest
        .fn()
        .mockResolvedValue(mapEvolutionChainResponse(charmanderChain)),
    };
    const repository = new PokemonEvolutionRepositoryImpl(
      remote,
      new EvolutionStorageDataSource(
        new StorageCache(new InMemoryKeyValueStorage(), { schemaVersion: 1 }),
        1000,
      ),
    );

    await repository.getEvolutionChain(4);
    const fromCharizard = await repository.getEvolutionChain(6);

    expect(remote.fetchEvolutionChain).toHaveBeenCalledTimes(1);
    expect(fromCharizard.origin).toBe(DataOrigin.CACHE);
    expect(fromCharizard.data.root.id).toBe(4);
  });
});
