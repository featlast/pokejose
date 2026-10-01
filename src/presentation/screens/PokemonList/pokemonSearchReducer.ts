import { SearchStatus } from '../../enums/SearchStatus.enum';
import type {
  PokemonSearchAction,
  PokemonSearchState,
} from './PokemonSearch.types';

export const initialPokemonSearchState: PokemonSearchState = {
  status: SearchStatus.IDLE,
  term: '',
  results: [],
  error: null,
};

export const pokemonSearchReducer = (
  state: PokemonSearchState,
  action: PokemonSearchAction,
): PokemonSearchState => {
  switch (action.type) {
    case 'CLEAR':
      return initialPokemonSearchState;
    case 'SEARCH_START':
      // Previous results stay visible while the next ones are computed.
      return { ...state, status: SearchStatus.SEARCHING, term: action.term };
    case 'SEARCH_SUCCESS':
      // Ignore answers for a term the user has already moved past.
      if (action.term !== state.term) {
        return state;
      }
      return {
        ...state,
        status:
          action.results.length > 0
            ? SearchStatus.RESULTS
            : SearchStatus.NO_RESULTS,
        results: action.results,
        error: null,
      };
    case 'SEARCH_FAILURE':
      if (action.term !== state.term) {
        return state;
      }
      return {
        ...state,
        status: SearchStatus.ERROR,
        results: [],
        error: action.error,
      };
    default:
      return state;
  }
};
