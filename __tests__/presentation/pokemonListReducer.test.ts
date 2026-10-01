import { toUserFacingError } from '../../src/core/errors';
import { DataOrigin } from '../../src/domain/enums';
import { ViewStatus } from '../../src/presentation/enums/ViewStatus.enum';
import {
  initialPokemonListState,
  pokemonListReducer,
} from '../../src/presentation/screens/PokemonList/pokemonListReducer';
import { makePage } from '../fixtures/pokemon.fixtures';

const error = toUserFacingError(new TypeError('Network request failed'));

describe('pokemonListReducer', () => {
  const loaded = pokemonListReducer(initialPokemonListState, {
    type: 'LOAD_SUCCESS',
    page: makePage([1, 2], 2),
    origin: DataOrigin.NETWORK,
  });

  it('moves to SUCCESS with items and pagination on first load', () => {
    expect(loaded.status).toBe(ViewStatus.SUCCESS);
    expect(loaded.items.map(p => p.id)).toEqual([1, 2]);
    expect(loaded.nextOffset).toBe(2);
  });

  it('moves to EMPTY when the first page has no items', () => {
    const state = pokemonListReducer(initialPokemonListState, {
      type: 'LOAD_SUCCESS',
      page: makePage([], null, 0),
      origin: DataOrigin.NETWORK,
    });
    expect(state.status).toBe(ViewStatus.EMPTY);
  });

  it('moves to ERROR on initial failure', () => {
    const state = pokemonListReducer(initialPokemonListState, {
      type: 'LOAD_FAILURE',
      error,
    });
    expect(state.status).toBe(ViewStatus.ERROR);
    expect(state.error).toBe(error);
  });

  it('appends pages without duplicating ids', () => {
    const state = pokemonListReducer(
      { ...loaded, isLoadingMore: true },
      {
        type: 'LOAD_MORE_SUCCESS',
        page: makePage([2, 3], null),
        origin: DataOrigin.NETWORK,
      },
    );
    expect(state.items.map(p => p.id)).toEqual([1, 2, 3]);
    expect(state.nextOffset).toBeNull();
    expect(state.isLoadingMore).toBe(false);
  });

  it('keeps items and exposes a footer error when loading more fails', () => {
    const state = pokemonListReducer(loaded, {
      type: 'LOAD_MORE_FAILURE',
      error,
    });
    expect(state.items).toHaveLength(2);
    expect(state.loadMoreError).toBe(error);
  });

  it('flags offline data when a page comes from stale cache', () => {
    const state = pokemonListReducer(loaded, {
      type: 'LOAD_MORE_SUCCESS',
      page: makePage([3], 3),
      origin: DataOrigin.STALE_CACHE,
    });
    expect(state.isShowingOfflineData).toBe(true);
  });

  it('keeps data on screen when a refresh fails', () => {
    const refreshing = pokemonListReducer(loaded, { type: 'REFRESH_START' });
    const state = pokemonListReducer(refreshing, {
      type: 'REFRESH_FAILURE',
      error,
    });
    expect(state.status).toBe(ViewStatus.SUCCESS);
    expect(state.isRefreshing).toBe(false);
    expect(state.refreshError).toBe(error);
  });

  it('cancels an in-flight load more when a refresh starts (no stuck spinner)', () => {
    const loadingMore = pokemonListReducer(loaded, { type: 'LOAD_MORE_START' });
    const refreshing = pokemonListReducer(loadingMore, {
      type: 'REFRESH_START',
    });
    const failed = pokemonListReducer(refreshing, {
      type: 'REFRESH_FAILURE',
      error,
    });
    expect(failed.isLoadingMore).toBe(false);
    expect(failed.items).toHaveLength(2);
  });

  it('clears the offline notice once a page arrives from the network', () => {
    const offline = pokemonListReducer(loaded, {
      type: 'LOAD_MORE_SUCCESS',
      page: makePage([3], 3),
      origin: DataOrigin.STALE_CACHE,
    });
    const online = pokemonListReducer(offline, {
      type: 'LOAD_MORE_SUCCESS',
      page: makePage([4], 4),
      origin: DataOrigin.NETWORK,
    });
    expect(online.isShowingOfflineData).toBe(false);
  });
});
