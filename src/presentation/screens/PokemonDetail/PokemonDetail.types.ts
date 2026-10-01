import type { UserFacingError } from '../../../core/errors';
import type { DataOrigin } from '../../../domain/enums';
import type { PokemonDetail } from '../../../domain/models';
import type { ViewStatus } from '../../enums/ViewStatus.enum';

export type PokemonDetailState = {
  status: Exclude<ViewStatus, ViewStatus.EMPTY>;
  detail: PokemonDetail | null;
  error: UserFacingError | null;
  isShowingOfflineData: boolean;
};

export type PokemonDetailAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; detail: PokemonDetail; origin: DataOrigin }
  | { type: 'LOAD_FAILURE'; error: UserFacingError };
