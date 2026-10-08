import { SearchStatus } from '../../enums/SearchStatus.enum';
import type {
  ListFilter,
  PokemonSearchAction,
  PokemonSearchState,
} from './PokemonSearch.types';

export const initialPokemonSearchState: PokemonSearchState = {
  status: SearchStatus.IDLE,
  term: '',
  filter: null,
  results: [],
  error: null,
};

/** True when an answer belongs to criteria the user has already moved past. */
const isStale = (
  state: PokemonSearchState,
  action: { term: string; filter: ListFilter },
) => action.term !== state.term || action.filter !== state.filter;

export const pokemonSearchReducer = (
  state: PokemonSearchState,
  action: PokemonSearchAction,
): PokemonSearchState => {
  switch (action.type) {
    case 'CLEAR':
      return initialPokemonSearchState;
    case 'SEARCH_START':
      // Previous results stay visible while the next ones are computed.
      return {
        ...state,
        status: SearchStatus.SEARCHING,
        term: action.term,
        filter: action.filter,
      };
    case 'SEARCH_SUCCESS':
      // Ignore answers for a term or filter the user has already moved past.
      if (isStale(state, action)) {
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
      if (isStale(state, action)) {
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
