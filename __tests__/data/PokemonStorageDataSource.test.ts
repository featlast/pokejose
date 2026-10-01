import { InMemoryKeyValueStorage } from '../../src/core/storage/InMemoryKeyValueStorage';
import { StorageCache } from '../../src/data/cache/StorageCache';
import { PokemonStorageDataSource } from '../../src/data/datasources/local/PokemonStorageDataSource';
import { bulbasaurDetail, makePage } from '../fixtures/pokemon.fixtures';

const TTL = 1000;

const setup = (schemaVersion = 1) => {
  let now = 10_000;
  const storage = new InMemoryKeyValueStorage();
  const cache = new StorageCache(storage, { schemaVersion, now: () => now });
  const dataSource = new PokemonStorageDataSource(cache, {
    listTtlMs: TTL,
    detailTtlMs: TTL,
  });
  return {
    storage,
    dataSource,
    advance: (ms: number) => {
      now += ms;
    },
  };
};

describe('PokemonStorageDataSource', () => {
  it('returns null on cache miss', async () => {
    const { dataSource } = setup();
    await expect(dataSource.getPage(0, 20)).resolves.toBeNull();
    await expect(dataSource.getDetail(1)).resolves.toBeNull();
  });

  it('round-trips pages keyed by offset and limit', async () => {
    const { dataSource } = setup();
    const page = makePage([1, 2], 2);

    await dataSource.savePage(0, 20, page);

    await expect(dataSource.getPage(0, 20)).resolves.toEqual({
      data: page,
      isExpired: false,
    });
    await expect(dataSource.getPage(20, 20)).resolves.toBeNull();
  });

  it('flags entries older than the TTL as expired but still returns them', async () => {
    const { dataSource, advance } = setup();
    await dataSource.saveDetail(bulbasaurDetail);

    advance(TTL + 1);

    await expect(dataSource.getDetail(1)).resolves.toEqual({
      data: bulbasaurDetail,
      isExpired: true,
    });
  });

  it('discards entries written with another schema version', async () => {
    const { storage, dataSource } = setup(2);
    await storage.setItem(
      'pokedex:detail:1',
      JSON.stringify({ schemaVersion: 1, savedAt: 0, data: {} }),
    );

    await expect(dataSource.getDetail(1)).resolves.toBeNull();
    await expect(storage.getItem('pokedex:detail:1')).resolves.toBeNull();
  });

  it('discards corrupted JSON', async () => {
    const { storage, dataSource } = setup();
    await storage.setItem('pokedex:detail:1', '{not json');

    await expect(dataSource.getDetail(1)).resolves.toBeNull();
  });
});
