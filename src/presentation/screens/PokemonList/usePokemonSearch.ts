import { useCallback, useEffect, useReducer, useState } from 'react';
import { toUserFacingError } from '../../../core/errors';
import type { PokemonType } from '../../../domain/enums';
import type { SearchPokemonUseCase } from '../../../domain/usecases/SearchPokemonUseCase';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  initialPokemonSearchState,
  pokemonSearchReducer,
} from './pokemonSearchReducer';

export const SEARCH_DEBOUNCE_MS = 250;

/**
 * View model for the search bar and the type filter: raw input, debounced term,
 * selected type and results. The type applies at once; only typing is debounced.
 */
export const usePokemonSearch = (searchPokemon: SearchPokemonUseCase) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<PokemonType | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, dispatch] = useReducer(
    pokemonSearchReducer,
    initialPokemonSearchState,
  );
  const term = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (!term && !typeFilter) {
      dispatch({ type: 'CLEAR' });
      return;
    }
    let active = true;
    dispatch({ type: 'SEARCH_START', term, typeFilter });
    searchPokemon
      .execute(term, typeFilter)
      .then(
        results =>
          active &&
          dispatch({ type: 'SEARCH_SUCCESS', term, typeFilter, results }),
      )
      .catch(
        error =>
          active &&
          dispatch({
            type: 'SEARCH_FAILURE',
            term,
            typeFilter,
            error: toUserFacingError(error),
          }),
      );
    return () => {
      active = false;
    };
  }, [term, typeFilter, attempt, searchPokemon]);

  // Clearing is immediate: the list comes back without waiting for the debounce.
  // The type filter stays (FR-304): only the text is cleared.
  const clear = useCallback(() => {
    setQuery('');
    if (!typeFilter) {
      dispatch({ type: 'CLEAR' });
    }
  }, [typeFilter]);
  const retry = useCallback(() => setAttempt(value => value + 1), []);

  return {
    query,
    setQuery,
    clear,
    retry,
    typeFilter,
    setTypeFilter,
    /** True as soon as the user types or picks a type, before the debounce settles. */
    isActive: query.trim().length > 0 || typeFilter !== null,
    state,
  };
};
