import { AppError, ErrorCode } from '../../src/core/errors';
import type { HttpClient } from '../../src/core/http/HttpClient.interface';
import { InMemoryKeyValueStorage } from '../../src/core/storage/InMemoryKeyValueStorage';
import { StorageCache } from '../../src/data/cache/StorageCache';
import { PokemonCatalogStorageDataSource } from '../../src/data/datasources/local/PokemonCatalogStorageDataSource';
import { PokeApiCatalogRemoteDataSource } from '../../src/data/datasources/remote/PokeApiCatalogRemoteDataSource';
import type { SearchIndexRemoteDataSource } from '../../src/data/datasources/remote/SearchIndexRemoteDataSource.interface';
import type { TypeIndexRemoteDataSource } from '../../src/data/datasources/remote/TypeIndexRemoteDataSource.interface';
import type { TypeResponseDto } from '../../src/data/dto/PokeApi.dto';
import {
  mapTypeResponsesToChart,
  mapTypeResponsesToIndex,
} from '../../src/data/mappers/typeIndex.mapper';
import { PokemonSearchIndexRepositoryImpl } from '../../src/data/repositories/PokemonSearchIndexRepositoryImpl';
import { PokemonTypeIndexRepositoryImpl } from '../../src/data/repositories/PokemonTypeIndexRepositoryImpl';
import { DataOrigin, PokemonType } from '../../src/domain/enums';
import { makeSummary } from '../fixtures/pokemon.fixtures';

const url = (id: number) => `https://pokeapi.co/api/v2/pokemon/${id}/`;
const typeDto = (
  name: string,
  entries: Array<[id: number, slot: number]>,
): TypeResponseDto => ({
  name,
  pokemon: entries.map(([id, slot]) => ({
    slot,
    pokemon: { name: `p${id}`, url: url(id) },
  })),
});

describe('mapTypeResponsesToIndex', () => {
  it('inverts type lists into per-Pokémon types ordered by slot', () => {
    const index = mapTypeResponsesToIndex([
      typeDto('poison', [[1, 2]]),
      typeDto('grass', [[1, 1]]),
      typeDto('fire', [[4, 1]]),
    ]);
    expect(index).toEqual({
      1: [PokemonType.GRASS, PokemonType.POISON],
      4: [PokemonType.FIRE],
    });
  });

  it('keeps alternative forms and skips unknown types', () => {
    const index = mapTypeResponsesToIndex([
      typeDto('fire', [[10034, 1]]),
      typeDto('dragon', [[10034, 2]]),
      typeDto('shadow', [[4, 1]]),
    ]);
    expect(index).toEqual({
      10034: [PokemonType.FIRE, PokemonType.DRAGON],
    });
  });
});

const httpReturning = (
  handler: (path: string) => Promise<unknown>,
): HttpClient => ({
  get: jest.fn(handler) as HttpClient['get'],
});

const relation = (...names: string[]) =>
  names.map(name => ({ name, url: `https://pokeapi.co/api/v2/type/${name}/` }));

describe('mapTypeResponsesToChart', () => {
  it('reads the defensive multipliers of each type', () => {
    const chart = mapTypeResponsesToChart([
      {
        ...typeDto('ghost', []),
        damage_relations: {
          double_damage_from: relation('ghost', 'dark'),
          half_damage_from: relation('poison', 'bug'),
          no_damage_from: relation('normal', 'fighting', 'shadow'),
        },
      },
    ]);
    expect(chart).toEqual({
      [PokemonType.GHOST]: {
        [PokemonType.GHOST]: 2,
        [PokemonType.DARK]: 2,
        [PokemonType.POISON]: 0.5,
        [PokemonType.BUG]: 0.5,
        [PokemonType.NORMAL]: 0,
        [PokemonType.FIGHTING]: 0,
      },
    });
  });

  it('leaves out types whose request failed or that are unknown', () => {
    expect(mapTypeResponsesToChart([typeDto('shadow', [])])).toEqual({});
  });
});

describe('PokeApiCatalogRemoteDataSource.fetchTypeIndex', () => {
  const options = { searchIndexLimit: 100_000 };

  it('requests every real type once and reports a complete index', async () => {
    const http = httpReturning(async path =>
      typeDto(path.replace('type/', ''), path === 'type/fire' ? [[4, 1]] : []),
    );
    const snapshot = await new PokeApiCatalogRemoteDataSource(
      http,
      options,
    ).fetchTypeIndex();

    expect(http.get).toHaveBeenCalledTimes(18);
    expect(http.get).not.toHaveBeenCalledWith('type/unknown');
    expect(snapshot).toMatchObject({
      index: { 4: [PokemonType.FIRE] },
      isComplete: true,
    });
    expect(Object.keys(snapshot.chart)).toHaveLength(18);
  });

  it('returns a partial index when some types fail', async () => {
    const http = httpReturning(async path => {
      if (path === 'type/water') {
        throw new AppError(ErrorCode.SERVER, 'down');
      }
      return typeDto(path.replace('type/', ''), []);
    });
    const snapshot = await new PokeApiCatalogRemoteDataSource(
      http,
      options,
    ).fetchTypeIndex();
    expect(snapshot.isComplete).toBe(false);
  });

  it('rejects when every type fails', async () => {
    const http = httpReturning(async () => {
      throw new TypeError('Network request failed');
    });
    await expect(
      new PokeApiCatalogRemoteDataSource(http, options).fetchTypeIndex(),
    ).rejects.toMatchObject({ code: ErrorCode.NETWORK });
  });
});

const createLocal = () =>
  new PokemonCatalogStorageDataSource(
    new StorageCache(new InMemoryKeyValueStorage(), { schemaVersion: 1 }),
    1000,
  );

const createRemote = (): jest.Mocked<
  TypeIndexRemoteDataSource & SearchIndexRemoteDataSource
> => ({
  fetchTypeIndex: jest.fn(),
  fetchSearchIndex: jest.fn(),
});

describe('PokemonTypeIndexRepositoryImpl', () => {
  it('persists a complete index and serves it from cache next time', async () => {
    const remote = createRemote();
    remote.fetchTypeIndex.mockResolvedValue({
      index: { 4: [PokemonType.FIRE] },
      chart: {},
      isComplete: true,
    });
    const repository = new PokemonTypeIndexRepositoryImpl(
      remote,
      createLocal(),
    );

    await repository.getTypeIndex();
    const second = await repository.getTypeIndex();

    expect(second).toEqual({
      data: { 4: [PokemonType.FIRE] },
      origin: DataOrigin.CACHE,
    });
    expect(remote.fetchTypeIndex).toHaveBeenCalledTimes(1);
  });

  it('serves the type chart from the same cached snapshot', async () => {
    const remote = createRemote();
    const chart = { [PokemonType.GHOST]: { [PokemonType.NORMAL]: 0 } };
    remote.fetchTypeIndex.mockResolvedValue({
      index: {},
      chart,
      isComplete: true,
    });
    const repository = new PokemonTypeIndexRepositoryImpl(
      remote,
      createLocal(),
    );

    await repository.getTypeIndex();
    const result = await repository.getTypeChart();

    expect(result).toEqual({ data: chart, origin: DataOrigin.CACHE });
    expect(remote.fetchTypeIndex).toHaveBeenCalledTimes(1);
  });

  it('uses but does not persist a partial index, so it is retried', async () => {
    const remote = createRemote();
    remote.fetchTypeIndex.mockResolvedValue({
      index: {},
      chart: {},
      isComplete: false,
    });
    const repository = new PokemonTypeIndexRepositoryImpl(
      remote,
      createLocal(),
    );

    await repository.getTypeIndex();
    await repository.getTypeIndex();

    expect(remote.fetchTypeIndex).toHaveBeenCalledTimes(2);
  });
});

describe('PokemonSearchIndexRepositoryImpl', () => {
  it('memoizes the index in memory across searches', async () => {
    const remote = createRemote();
    remote.fetchSearchIndex.mockResolvedValue([makeSummary(25, 'pikachu')]);
    const repository = new PokemonSearchIndexRepositoryImpl(
      remote,
      createLocal(),
    );

    await repository.getSearchIndex();
    await repository.getSearchIndex();

    expect(remote.fetchSearchIndex).toHaveBeenCalledTimes(1);
  });

  it('does not memoize failures, so the next search retries', async () => {
    const remote = createRemote();
    remote.fetchSearchIndex
      .mockRejectedValueOnce(new AppError(ErrorCode.NETWORK, 'offline'))
      .mockResolvedValue([makeSummary(25, 'pikachu')]);
    const repository = new PokemonSearchIndexRepositoryImpl(
      remote,
      createLocal(),
    );

    await expect(repository.getSearchIndex()).rejects.toMatchObject({
      code: ErrorCode.NETWORK,
    });
    await expect(repository.getSearchIndex()).resolves.toMatchObject({
      origin: DataOrigin.NETWORK,
    });
  });
});

describe('PokemonSearchIndexRepositoryImpl offline behaviour', () => {
  it('answers from the stale index instantly and revalidates in the background once', async () => {
    let now = 1_000_000;
    const storage = new InMemoryKeyValueStorage();
    const cache = new StorageCache(storage, {
      schemaVersion: 1,
      now: () => now,
    });
    const local = new PokemonCatalogStorageDataSource(cache, 1000);
    await local.saveSearchIndex([makeSummary(25, 'pikachu')]);
    now += 5000; // the saved index is now expired

    const remote = createRemote();
    remote.fetchSearchIndex
      .mockRejectedValueOnce(new AppError(ErrorCode.NETWORK, 'offline'))
      .mockRejectedValueOnce(new AppError(ErrorCode.NETWORK, 'still offline'));
    const repository = new PokemonSearchIndexRepositoryImpl(
      remote,
      local,
      () => now,
    );

    const first = await repository.getSearchIndex();
    expect(first.origin).toBe(DataOrigin.STALE_CACHE);
    await new Promise<void>(resolve => setImmediate(resolve));

    // Later searches reuse the stale index: no new blocking network attempt.
    await repository.getSearchIndex();
    await repository.getSearchIndex();
    expect(remote.fetchSearchIndex).toHaveBeenCalledTimes(2); // initial + one background retry
  });
});
