import { PokemonType } from '../../src/domain/enums';
import {
  SearchPokemonUseCase,
  filterByType,
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

const typeIndex = {
  25: [PokemonType.ELECTRIC],
  26: [PokemonType.ELECTRIC],
  122: [PokemonType.PSYCHIC, PokemonType.FAIRY],
  172: [PokemonType.ELECTRIC],
};

describe('filterByType', () => {
  it('keeps Pokémon with the type in any slot, in index order', () => {
    expect(
      filterByType(index, typeIndex, PokemonType.ELECTRIC).map(p => p.id),
    ).toEqual([25, 26, 172]);
    expect(
      filterByType(index, typeIndex, PokemonType.FAIRY).map(p => p.id),
    ).toEqual([122]);
  });

  it('leaves out Pokémon the type index does not know', () => {
    expect(
      filterByType(index, typeIndex, PokemonType.ELECTRIC).map(p => p.id),
    ).not.toContain(10080);
  });
});

describe('SearchPokemonUseCase', () => {
  const createUseCase = () => {
    const searchIndex = {
      getSearchIndex: jest.fn().mockResolvedValue(resource(index)),
    };
    const types = {
      getTypeIndex: jest.fn().mockResolvedValue(resource(typeIndex)),
    };
    const favorites = {
      getFavorites: jest
        .fn()
        .mockResolvedValue([
          makeSummary(172, 'pichu'),
          makeSummary(122, 'mr-mime'),
        ]),
      saveFavorites: jest.fn(),
    };
    return {
      searchIndex,
      types,
      favorites,
      useCase: new SearchPokemonUseCase(searchIndex, types, favorites),
    };
  };

  it('loads nothing without a query or a type', async () => {
    const { searchIndex, types, useCase } = createUseCase();
    await expect(useCase.execute('  ')).resolves.toEqual([]);
    expect(searchIndex.getSearchIndex).not.toHaveBeenCalled();
    expect(types.getTypeIndex).not.toHaveBeenCalled();
  });

  it('searches over the repository index without loading types', async () => {
    const { types, useCase } = createUseCase();
    const results = await useCase.execute('rai');
    expect(results.map(p => p.name)).toEqual(['raichu']);
    expect(types.getTypeIndex).not.toHaveBeenCalled();
  });

  it('lists every Pokémon of a type when there is no query', async () => {
    const { useCase } = createUseCase();
    const results = await useCase.execute('', { type: PokemonType.ELECTRIC });
    expect(results.map(p => p.id)).toEqual([25, 26, 172]);
  });

  it('combines the query with the type', async () => {
    const { useCase } = createUseCase();
    const results = await useCase.execute('pi', { type: PokemonType.ELECTRIC });
    expect(results.map(p => p.id)).toEqual([25, 172]);
    await expect(
      useCase.execute('mime', { type: PokemonType.ELECTRIC }),
    ).resolves.toEqual([]);
  });

  it('lists favorites in their own order and searches within them', async () => {
    const { searchIndex, useCase } = createUseCase();
    const all = await useCase.execute('', { favoritesOnly: true });
    expect(all.map(p => p.id)).toEqual([172, 122]);
    expect(searchIndex.getSearchIndex).not.toHaveBeenCalled();
    const matches = await useCase.execute('pi', { favoritesOnly: true });
    expect(matches.map(p => p.id)).toEqual([172]);
    const electric = await useCase.execute('', {
      favoritesOnly: true,
      type: PokemonType.ELECTRIC,
    });
    expect(electric.map(p => p.id)).toEqual([172]);
  });
});
