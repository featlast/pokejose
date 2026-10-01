import type { UserFacingError } from '../../../core/errors';
import type { DataOrigin } from '../../../domain/enums';
import type { Page, PokemonSummary } from '../../../domain/models';
import type { ViewStatus } from '../../enums/ViewStatus.enum';

export type PokemonListState = {
  status: ViewStatus;
  items: PokemonSummary[];
  nextOffset: number | null;
  totalCount: number;
  /** Error that replaced the whole list (initial load). */
  error: UserFacingError | null;
  /** A refresh failed while previous data is still on screen. */
  refreshError: UserFacingError | null;
  loadMoreError: UserFacingError | null;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  /** The latest page came from an expired cache because the network request failed. */
  isShowingOfflineData: boolean;
};

type PagePayload = { page: Page<PokemonSummary>; origin: DataOrigin };

export type PokemonListAction =
  | { type: 'LOAD_START' }
  | ({ type: 'LOAD_SUCCESS' } & PagePayload)
  | { type: 'LOAD_FAILURE'; error: UserFacingError }
  | { type: 'REFRESH_START' }
  | ({ type: 'REFRESH_SUCCESS' } & PagePayload)
  | { type: 'REFRESH_FAILURE'; error: UserFacingError }
  | { type: 'LOAD_MORE_START' }
  | ({ type: 'LOAD_MORE_SUCCESS' } & PagePayload)
  | { type: 'LOAD_MORE_FAILURE'; error: UserFacingError };
