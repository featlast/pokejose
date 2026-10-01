import { useCallback, useEffect, useReducer, useState } from 'react';
import { toUserFacingError } from '../../../core/errors';
import type { SearchPokemonUseCase } from '../../../domain/usecases/SearchPokemonUseCase';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  initialPokemonSearchState,
  pokemonSearchReducer,
} from './pokemonSearchReducer';

export const SEARCH_DEBOUNCE_MS = 250;

/** View model for the search bar: raw input, debounced term and results. */
export const usePokemonSearch = (searchPokemon: SearchPokemonUseCase) => {
  const [query, setQuery] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [state, dispatch] = useReducer(
    pokemonSearchReducer,
    initialPokemonSearchState,
  );
  const term = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (!term) {
      dispatch({ type: 'CLEAR' });
      return;
    }
    let active = true;
    dispatch({ type: 'SEARCH_START', term });
    searchPokemon
      .execute(term)
      .then(
        results =>
          active && dispatch({ type: 'SEARCH_SUCCESS', term, results }),
      )
      .catch(
        error =>
          active &&
          dispatch({
            type: 'SEARCH_FAILURE',
            term,
            error: toUserFacingError(error),
          }),
      );
    return () => {
      active = false;
    };
  }, [term, attempt, searchPokemon]);

  // Clearing is immediate: the list comes back without waiting for the debounce.
  const clear = useCallback(() => {
    setQuery('');
    dispatch({ type: 'CLEAR' });
  }, []);
  const retry = useCallback(() => setAttempt(value => value + 1), []);

  return {
    query,
    setQuery,
    clear,
    retry,
    /** True as soon as the user types, before the debounce settles. */
    isActive: query.trim().length > 0,
    state,
  };
};
