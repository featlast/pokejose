import {
  SearchPokemonUseCase,
  normalizeSearchText,
  searchPokemon,
} from '../../src/domain/usecases/SearchPokemonUseCase';
import { makeSummary, resource } from '../fixtures/pokemon.fixtures';

const index = [
  makeSummary(25, 'pikachu'),
  makeSummary(26, 'raichu'),
  makeSummary(122, 'mr-mime'),
  makeSummary(172, 'pichu'),
  makeSummary(10080, 'pikachu-rock-star'),
];

describe('normalizeSearchText', () => {
  it('lowercases, strips Spanish accents and collapses separators', () => {
    expect(normalizeSearchText('  Mr. Mimé ')).toBe('mr mime');
    expect(normalizeSearchText('PIKACHÚ')).toBe('pikachu');
  });
});

describe('searchPokemon', () => {
  it('ranks names that start with the term before names that contain it', () => {
    expect(searchPokemon(index, 'chu').map(p => p.name)).toEqual([
      'pikachu',
      'raichu',
      'pichu',
      'pikachu-rock-star',
    ]);
    expect(searchPokemon(index, 'pi').map(p => p.id)).toEqual([25, 172, 10080]);
  });

  it('ignores case, accents and hyphens', () => {
    expect(searchPokemon(index, 'Mr Mimé').map(p => p.id)).toEqual([122]);
  });

  it.each(['25', '#25', '#025', ' 25 '])(
    'matches the exact number for %p',
    q => {
      expect(searchPokemon(index, q).map(p => p.id)).toEqual([25]);
    },
  );

  it('returns nothing for blank queries or unknown names', () => {
    expect(searchPokemon(index, '   ')).toEqual([]);
    expect(searchPokemon(index, 'zzz')).toEqual([]);
  });
});

describe('SearchPokemonUseCase', () => {
  it('does not load the index for a blank query', async () => {
    const repository = { getSearchIndex: jest.fn() };
    await expect(
      new SearchPokemonUseCase(repository).execute('  '),
    ).resolves.toEqual([]);
    expect(repository.getSearchIndex).not.toHaveBeenCalled();
  });

  it('searches over the repository index', async () => {
    const repository = {
      getSearchIndex: jest.fn().mockResolvedValue(resource(index)),
    };
    const results = await new SearchPokemonUseCase(repository).execute('rai');
    expect(results.map(p => p.name)).toEqual(['raichu']);
  });
});
