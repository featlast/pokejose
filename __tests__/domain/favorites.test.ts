import {
  RestoreFavoriteUseCase,
  ToggleFavoriteUseCase,
  isFavorite,
  restoreFavorite,
  toggleFavorite,
} from '../../src/domain/usecases/FavoritesUseCases';
import type { PokemonSummary } from '../../src/domain/models';
import { makeSummary } from '../fixtures/pokemon.fixtures';

const pikachu = makeSummary(25, 'pikachu');
const charizard = makeSummary(6, 'charizard');
const gengar = makeSummary(94, 'gengar');
const ids = (list: PokemonSummary[]) => list.map(p => p.id);

const memoryRepository = (initial: PokemonSummary[]) => {
  let stored = initial;
  return {
    getFavorites: jest.fn(async () => [...stored]),
    saveFavorites: jest.fn(async (list: readonly PokemonSummary[]) => {
      stored = [...list];
    }),
  };
};

describe('favorite rules', () => {
  it('adds new favorites first and removes saved ones', () => {
    expect(ids(toggleFavorite([charizard], pikachu))).toEqual([25, 6]);
    expect(ids(toggleFavorite([pikachu, charizard], pikachu))).toEqual([6]);
    expect(isFavorite([pikachu], 25)).toBe(true);
    expect(isFavorite([pikachu], 6)).toBe(false);
  });

  it('restores a removed favorite at its old position', () => {
    expect(ids(restoreFavorite([pikachu, gengar], charizard, 1))).toEqual([
      25, 6, 94,
    ]);
    expect(ids(restoreFavorite([pikachu], charizard, 9))).toEqual([25, 6]);
    expect(ids(restoreFavorite([pikachu], pikachu, 0))).toEqual([25]);
  });
});

describe('favorite use cases', () => {
  it('toggles, persists and reports where a removed favorite was', async () => {
    const repository = memoryRepository([pikachu, charizard]);
    const toggle = new ToggleFavoriteUseCase(repository);

    const removed = await toggle.execute(charizard);
    expect(removed).toMatchObject({ added: false, previousIndex: 1 });
    expect(ids(removed.favorites)).toEqual([25]);

    const added = await toggle.execute(gengar);
    expect(added.added).toBe(true);
    expect(ids(await repository.getFavorites())).toEqual([94, 25]);
  });

  it('undoes a removal', async () => {
    const repository = memoryRepository([pikachu]);
    const restored = await new RestoreFavoriteUseCase(repository).execute(
      charizard,
      0,
    );
    expect(ids(restored)).toEqual([6, 25]);
    expect(repository.saveFavorites).toHaveBeenCalled();
  });
});
