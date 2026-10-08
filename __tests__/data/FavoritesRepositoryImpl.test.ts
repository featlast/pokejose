import { InMemoryKeyValueStorage } from '../../src/core/storage/InMemoryKeyValueStorage';
import { FavoritesRepositoryImpl } from '../../src/data/repositories/FavoritesRepositoryImpl';
import { makeSummary } from '../fixtures/pokemon.fixtures';

const KEY = 'pokedex:favorites';

describe('FavoritesRepositoryImpl', () => {
  it('persists favorites so a new instance (next launch) reads them', async () => {
    const storage = new InMemoryKeyValueStorage();
    await new FavoritesRepositoryImpl(storage).saveFavorites([
      makeSummary(25, 'pikachu'),
    ]);

    const reloaded = await new FavoritesRepositoryImpl(storage).getFavorites();

    expect(reloaded).toEqual([makeSummary(25, 'pikachu')]);
    expect(JSON.parse((await storage.getItem(KEY))!)).toMatchObject({
      version: 1,
    });
  });

  it.each([
    ['corrupt JSON', '{not json'],
    ['another version', JSON.stringify({ version: 99, items: [] })],
  ])('starts empty with %s', async (_, raw) => {
    const storage = new InMemoryKeyValueStorage();
    await storage.setItem(KEY, raw);
    await expect(
      new FavoritesRepositoryImpl(storage).getFavorites(),
    ).resolves.toEqual([]);
  });

  it('drops malformed entries and survives a failing storage read', async () => {
    const storage = new InMemoryKeyValueStorage();
    await storage.setItem(
      KEY,
      JSON.stringify({
        version: 1,
        items: [makeSummary(1, 'bulbasaur'), { id: 'x' }],
      }),
    );
    expect(await new FavoritesRepositoryImpl(storage).getFavorites()).toEqual([
      makeSummary(1, 'bulbasaur'),
    ]);

    const failing = new InMemoryKeyValueStorage();
    jest.spyOn(failing, 'getItem').mockRejectedValue(new Error('disk'));
    await expect(
      new FavoritesRepositoryImpl(failing).getFavorites(),
    ).resolves.toEqual([]);
  });

  it('serves changes from memory before the write finishes', async () => {
    const storage = new InMemoryKeyValueStorage();
    let finishWrite!: () => void;
    jest
      .spyOn(storage, 'setItem')
      .mockReturnValue(new Promise<void>(resolve => (finishWrite = resolve)));
    const repository = new FavoritesRepositoryImpl(storage);

    const saving = repository.saveFavorites([makeSummary(6, 'charizard')]);

    expect(await repository.getFavorites()).toEqual([
      makeSummary(6, 'charizard'),
    ]);
    finishWrite();
    await saving;
  });
});
