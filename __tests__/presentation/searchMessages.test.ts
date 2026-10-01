import { noResultsMessage } from '../../src/presentation/screens/PokemonList/searchMessages';

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
});
