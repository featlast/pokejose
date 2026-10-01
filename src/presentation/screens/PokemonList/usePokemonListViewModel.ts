import { useCallback, useEffect, useReducer, useRef } from 'react';
import { toUserFacingError } from '../../../core/errors';
import type { Page, PokemonSummary, Resource } from '../../../domain/models';
import type { GetPokemonPageUseCase } from '../../../domain/usecases/GetPokemonPageUseCase';
import { ViewStatus } from '../../enums/ViewStatus.enum';
import type { ImagePrefetcher } from '../../services/imagePrefetcher';
import { prefetchImages } from '../../services/imagePrefetcher';
import {
  initialPokemonListState,
  pokemonListReducer,
} from './pokemonListReducer';

/**
 * View model for the list screen. A generation counter discards responses that
 * belong to a superseded request (e.g. a page arriving after a pull-to-refresh).
 */
export const usePokemonListViewModel = (
  getPage: GetPokemonPageUseCase,
  prefetch: ImagePrefetcher = prefetchImages,
) => {
  const [state, dispatch] = useReducer(
    pokemonListReducer,
    initialPokemonListState,
  );
  const generation = useRef(0);
  const isMounted = useRef(true);
  /** Requests started by `prefetchNext`, reused by `loadMore` so a page is never fetched twice. */
  const pendingPages = useRef(
    new Map<number, Promise<Resource<Page<PokemonSummary>>>>(),
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  const isCurrent = (requestGeneration: number) =>
    isMounted.current && requestGeneration === generation.current;

  const load = useCallback(async () => {
    const requestGeneration = ++generation.current;
    pendingPages.current.clear();
    dispatch({ type: 'LOAD_START' });
    try {
      const { data, origin } = await getPage.execute(0);
      if (isCurrent(requestGeneration)) {
        dispatch({ type: 'LOAD_SUCCESS', page: data, origin });
      }
    } catch (error) {
      if (isCurrent(requestGeneration)) {
        dispatch({ type: 'LOAD_FAILURE', error: toUserFacingError(error) });
      }
    }
  }, [getPage]);

  const refresh = useCallback(async () => {
    const requestGeneration = ++generation.current;
    pendingPages.current.clear();
    dispatch({ type: 'REFRESH_START' });
    try {
      const { data, origin } = await getPage.execute(0, {
        forceRefresh: true,
        // Keep what is on screen and report the failure instead of swapping in stale page 0.
        allowStaleFallback: false,
      });
      if (isCurrent(requestGeneration)) {
        dispatch({ type: 'REFRESH_SUCCESS', page: data, origin });
      }
    } catch (error) {
      if (isCurrent(requestGeneration)) {
        dispatch({ type: 'REFRESH_FAILURE', error: toUserFacingError(error) });
      }
    }
  }, [getPage]);

  const loadMore = useCallback(async () => {
    const { nextOffset, isLoadingMore, isRefreshing, status } =
      stateRef.current;
    if (
      nextOffset === null ||
      isLoadingMore ||
      isRefreshing ||
      status !== ViewStatus.SUCCESS
    ) {
      return;
    }
    const requestGeneration = generation.current;
    dispatch({ type: 'LOAD_MORE_START' });
    const request =
      pendingPages.current.get(nextOffset) ?? getPage.execute(nextOffset);
    pendingPages.current.delete(nextOffset);
    try {
      const { data, origin } = await request;
      if (isCurrent(requestGeneration)) {
        dispatch({ type: 'LOAD_MORE_SUCCESS', page: data, origin });
      }
    } catch (error) {
      if (isCurrent(requestGeneration)) {
        dispatch({
          type: 'LOAD_MORE_FAILURE',
          error: toUserFacingError(error),
        });
      }
    }
  }, [getPage]);

  /**
   * Called as the user approaches the end: starts fetching the next page ahead of
   * time and warms its images. `loadMore` awaits this same request instead of
   * issuing a second one, so a fling never duplicates network calls.
   */
  const prefetchNext = useCallback(() => {
    const { nextOffset, status, isLoadingMore } = stateRef.current;
    if (
      nextOffset === null ||
      status !== ViewStatus.SUCCESS ||
      isLoadingMore ||
      pendingPages.current.has(nextOffset)
    ) {
      return;
    }
    const request = getPage.execute(nextOffset);
    pendingPages.current.set(nextOffset, request);
    request
      .then(({ data }) => prefetch(data.items.map(item => item.imageUrl)))
      .catch(() => {
        // Forget failures so `loadMore` (or a later prefetch) retries.
        if (pendingPages.current.get(nextOffset) === request) {
          pendingPages.current.delete(nextOffset);
        }
      });
  }, [getPage, prefetch]);

  useEffect(() => {
    isMounted.current = true;
    load();
    return () => {
      isMounted.current = false;
    };
  }, [load]);

  return { state, retry: load, refresh, loadMore, prefetchNext };
};
