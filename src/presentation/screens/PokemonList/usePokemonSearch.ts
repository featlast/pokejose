import { useCallback, useEffect, useReducer, useState } from 'react';
import { toUserFacingError } from '../../../core/errors';
import type { PokemonType } from '../../../domain/enums';
import type { SearchPokemonUseCase } from '../../../domain/usecases/SearchPokemonUseCase';
import { CollectionFilter } from '../../enums/CollectionFilter.enum';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import type { ListFilter } from './PokemonSearch.types';
import {
  initialPokemonSearchState,
  pokemonSearchReducer,
} from './pokemonSearchReducer';

export const SEARCH_DEBOUNCE_MS = 250;

/**
 * View model for the search bar and the filter row: raw input, debounced term,
 * selected filter and results. The filter applies at once; only typing is debounced.
 * `favorites` (any value that changes with them) refreshes the favorites filter (FR-609).
 */
export const usePokemonSearch = (
  searchPokemon: SearchPokemonUseCase,
  favorites?: unknown,
) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ListFilter>(null);
  const favoritesOnly = filter === CollectionFilter.FAVORITES;
  const typeFilter: PokemonType | null =
    filter && filter !== CollectionFilter.FAVORITES ? filter : null;
  // Only the favorites filter depends on the favorites themselves.
  const favoritesKey = favoritesOnly ? favorites : null;
  const [attempt, setAttempt] = useState(0);
  const [state, dispatch] = useReducer(
    pokemonSearchReducer,
    initialPokemonSearchState,
  );
  const term = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (!term && !filter) {
      dispatch({ type: 'CLEAR' });
      return;
    }
    let active = true;
    dispatch({ type: 'SEARCH_START', term, filter });
    searchPokemon
      .execute(term, {
        type: filter && filter !== CollectionFilter.FAVORITES ? filter : null,
        favoritesOnly: filter === CollectionFilter.FAVORITES,
      })
      .then(
        results =>
          active && dispatch({ type: 'SEARCH_SUCCESS', term, filter, results }),
      )
      .catch(
        error =>
          active &&
          dispatch({
            type: 'SEARCH_FAILURE',
            term,
            filter,
            error: toUserFacingError(error),
          }),
      );
    return () => {
      active = false;
    };
  }, [term, filter, favoritesKey, attempt, searchPokemon]);

  // Clearing is immediate: the list comes back without waiting for the debounce.
  // The filter stays (FR-304): only the text is cleared.
  const clear = useCallback(() => {
    setQuery('');
    if (!filter) {
      dispatch({ type: 'CLEAR' });
    }
  }, [filter]);
  const retry = useCallback(() => setAttempt(value => value + 1), []);

  return {
    query,
    setQuery,
    clear,
    retry,
    filter,
    setFilter,
    typeFilter,
    favoritesOnly,
    /** True as soon as the user types or picks a filter, before the debounce settles. */
    isActive: query.trim().length > 0 || filter !== null,
    state,
  };
};
