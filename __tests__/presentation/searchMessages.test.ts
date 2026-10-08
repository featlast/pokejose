import {
  favoritesSubtitle,
  noFavoritesMessage,
  noResultsMessage,
  resultsSubtitle,
} from '../../src/presentation/screens/PokemonList/searchMessages';

describe('noResultsMessage', () => {
  it('says where the Pokédex ends for a number past it', () => {
    expect(noResultsMessage('1351', 1025)).toBe(
      'No existe el\u00A0#1351. La Pokédex llega hasta el\u00A0#1025.',
    );
    expect(noResultsMessage(' #2000 ', 1025)).toBe(
      'No existe el\u00A0#2000. La Pokédex llega hasta el\u00A0#1025.',
    );
  });

  it('keeps the generic text for names, valid numbers or an unknown total', () => {
    expect(noResultsMessage('zzz', 1025)).toBe(
      'No encontramos Pokémon para “zzz”.',
    );
    expect(noResultsMessage('1025', 1025)).toBe(
      'No encontramos Pokémon para “1025”.',
    );
    expect(noResultsMessage('1351', 0)).toBe(
      'No encontramos Pokémon para “1351”.',
    );
  });

  it('names the type filter, with or without a term', () => {
    expect(noResultsMessage('zzz', 1025, 'Fuego')).toBe(
      'No encontramos Pokémon de tipo Fuego para “zzz”.',
    );
    expect(noResultsMessage('', 1025, 'Fuego')).toBe(
      'No encontramos Pokémon de tipo Fuego.',
    );
  });
});

describe('resultsSubtitle', () => {
  it('counts search results, type results or both', () => {
    expect(resultsSubtitle(3, 'pika')).toBe('3 resultados');
    expect(resultsSubtitle(12, '', 'Fuego')).toBe('12 Pokémon de tipo Fuego');
    expect(resultsSubtitle(2, 'char', 'Fuego')).toBe(
      '2 resultados de tipo Fuego',
    );
  });
});

describe('favorites messages', () => {
  it('counts favorites and search results within them', () => {
    expect(favoritesSubtitle(1, '')).toBe('1 favorito');
    expect(favoritesSubtitle(3, '')).toBe('3 favoritos');
    expect(favoritesSubtitle(2, 'char')).toBe('2 resultados en favoritos');
  });

  it('explains how to add the first favorite, or the missing match', () => {
    expect(noFavoritesMessage('')).toContain('Toca el corazón');
    expect(noFavoritesMessage('zzz')).toBe(
      'No encontramos favoritos para “zzz”.',
    );
  });
});
