import { toUserFacingError } from '../../src/core/errors';
import { PokemonType } from '../../src/domain/enums';
import { SearchStatus } from '../../src/presentation/enums/SearchStatus.enum';
import {
  initialPokemonSearchState,
  pokemonSearchReducer,
} from '../../src/presentation/screens/PokemonList/pokemonSearchReducer';
import { makeSummary } from '../fixtures/pokemon.fixtures';

const start = (term: string, filter: PokemonType | null = null) =>
  pokemonSearchReducer(initialPokemonSearchState, {
    type: 'SEARCH_START',
    term,
    filter,
  });

describe('pokemonSearchReducer', () => {
  it('moves to RESULTS or NO_RESULTS for the current term', () => {
    const results = pokemonSearchReducer(start('pika'), {
      type: 'SEARCH_SUCCESS',
      term: 'pika',
      filter: null,
      results: [makeSummary(25, 'pikachu')],
    });
    expect(results.status).toBe(SearchStatus.RESULTS);

    const none = pokemonSearchReducer(start('zzz'), {
      type: 'SEARCH_SUCCESS',
      term: 'zzz',
      filter: null,
      results: [],
    });
    expect(none.status).toBe(SearchStatus.NO_RESULTS);
  });

  it('ignores answers for a term the user already changed', () => {
    const state = pokemonSearchReducer(start('pikac'), {
      type: 'SEARCH_SUCCESS',
      term: 'pika',
      filter: null,
      results: [makeSummary(25)],
    });
    expect(state.status).toBe(SearchStatus.SEARCHING);
    expect(state.results).toEqual([]);
  });

  it('ignores answers for a type the user already changed', () => {
    const state = pokemonSearchReducer(start('', PokemonType.WATER), {
      type: 'SEARCH_SUCCESS',
      term: '',
      filter: PokemonType.FIRE,
      results: [makeSummary(4)],
    });
    expect(state.status).toBe(SearchStatus.SEARCHING);
    expect(state.results).toEqual([]);

    const current = pokemonSearchReducer(state, {
      type: 'SEARCH_SUCCESS',
      term: '',
      filter: PokemonType.WATER,
      results: [makeSummary(7)],
    });
    expect(current).toMatchObject({
      status: SearchStatus.RESULTS,
      filter: PokemonType.WATER,
    });
  });

  it('exposes a friendly error and clears back to IDLE', () => {
    const error = toUserFacingError(new TypeError('Network request failed'));
    const failed = pokemonSearchReducer(start('pika'), {
      type: 'SEARCH_FAILURE',
      term: 'pika',
      filter: null,
      error,
    });
    expect(failed).toMatchObject({ status: SearchStatus.ERROR, error });
    expect(pokemonSearchReducer(failed, { type: 'CLEAR' })).toEqual(
      initialPokemonSearchState,
    );
  });
});
