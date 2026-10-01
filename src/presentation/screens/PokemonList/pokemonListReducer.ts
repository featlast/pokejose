import { DataOrigin } from '../../../domain/enums';
import type { Page, PokemonSummary } from '../../../domain/models';
import { ViewStatus } from '../../enums/ViewStatus.enum';
import type { PokemonListAction, PokemonListState } from './PokemonList.types';

export const initialPokemonListState: PokemonListState = {
  status: ViewStatus.LOADING,
  items: [],
  nextOffset: 0,
  totalCount: 0,
  error: null,
  refreshError: null,
  loadMoreError: null,
  isRefreshing: false,
  isLoadingMore: false,
  isShowingOfflineData: false,
};

/** A first page (initial load or refresh) resets pagination and every flag. */
const replaceWithPage = (
  page: Page<PokemonSummary>,
  origin: DataOrigin,
): PokemonListState => ({
  ...initialPokemonListState,
  status: page.items.length > 0 ? ViewStatus.SUCCESS : ViewStatus.EMPTY,
  items: page.items,
  nextOffset: page.nextOffset,
  totalCount: page.totalCount,
  isShowingOfflineData: origin === DataOrigin.STALE_CACHE,
});

/** Appends a page, ignoring ids already present (defensive against overlapping pages). */
const appendPage = (
  items: PokemonSummary[],
  page: Page<PokemonSummary>,
): PokemonSummary[] => {
  const seen = new Set(items.map(item => item.id));
  return [...items, ...page.items.filter(item => !seen.has(item.id))];
};

export const pokemonListReducer = (
  state: PokemonListState,
  action: PokemonListAction,
): PokemonListState => {
  switch (action.type) {
    case 'LOAD_START':
      return { ...initialPokemonListState, status: ViewStatus.LOADING };
    case 'LOAD_SUCCESS':
    case 'REFRESH_SUCCESS':
      return replaceWithPage(action.page, action.origin);
    case 'LOAD_FAILURE':
      return {
        ...initialPokemonListState,
        status: ViewStatus.ERROR,
        error: action.error,
      };
    case 'REFRESH_START':
      // A refresh supersedes any in-flight "load more" (its response is discarded).
      return {
        ...state,
        isRefreshing: true,
        refreshError: null,
        isLoadingMore: false,
        loadMoreError: null,
      };
    case 'REFRESH_FAILURE':
      return state.items.length > 0
        ? { ...state, isRefreshing: false, refreshError: action.error }
        : {
            ...initialPokemonListState,
            status: ViewStatus.ERROR,
            error: action.error,
          };
    case 'LOAD_MORE_START':
      return { ...state, isLoadingMore: true, loadMoreError: null };
    case 'LOAD_MORE_SUCCESS':
      return {
        ...state,
        items: appendPage(state.items, action.page),
        nextOffset: action.page.nextOffset,
        totalCount: action.page.totalCount,
        isLoadingMore: false,
        // Reflects the latest request: a successful network page clears the notice.
        isShowingOfflineData: action.origin === DataOrigin.STALE_CACHE,
      };
    case 'LOAD_MORE_FAILURE':
      return { ...state, isLoadingMore: false, loadMoreError: action.error };
    default:
      return state;
  }
};
