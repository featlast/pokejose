import { toUserFacingError } from '../../src/core/errors';
import { SearchStatus } from '../../src/presentation/enums/SearchStatus.enum';
import {
  initialPokemonSearchState,
  pokemonSearchReducer,
} from '../../src/presentation/screens/PokemonList/pokemonSearchReducer';
import { makeSummary } from '../fixtures/pokemon.fixtures';

const start = (term: string) =>
  pokemonSearchReducer(initialPokemonSearchState, {
    type: 'SEARCH_START',
    term,
  });

describe('pokemonSearchReducer', () => {
  it('moves to RESULTS or NO_RESULTS for the current term', () => {
    const results = pokemonSearchReducer(start('pika'), {
      type: 'SEARCH_SUCCESS',
      term: 'pika',
      results: [makeSummary(25, 'pikachu')],
    });
    expect(results.status).toBe(SearchStatus.RESULTS);

    const none = pokemonSearchReducer(start('zzz'), {
      type: 'SEARCH_SUCCESS',
      term: 'zzz',
      results: [],
    });
    expect(none.status).toBe(SearchStatus.NO_RESULTS);
  });

  it('ignores answers for a term the user already changed', () => {
    const state = pokemonSearchReducer(start('pikac'), {
      type: 'SEARCH_SUCCESS',
      term: 'pika',
      results: [makeSummary(25)],
    });
    expect(state.status).toBe(SearchStatus.SEARCHING);
    expect(state.results).toEqual([]);
  });

  it('exposes a friendly error and clears back to IDLE', () => {
    const error = toUserFacingError(new TypeError('Network request failed'));
    const failed = pokemonSearchReducer(start('pika'), {
      type: 'SEARCH_FAILURE',
      term: 'pika',
      error,
    });
    expect(failed).toMatchObject({ status: SearchStatus.ERROR, error });
    expect(pokemonSearchReducer(failed, { type: 'CLEAR' })).toEqual(
      initialPokemonSearchState,
    );
  });
});
