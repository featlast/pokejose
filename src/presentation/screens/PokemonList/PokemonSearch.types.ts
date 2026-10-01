import type { UserFacingError } from '../../../core/errors';
import type { PokemonSummary } from '../../../domain/models';
import type { SearchStatus } from '../../enums/SearchStatus.enum';

export type PokemonSearchState = {
  status: SearchStatus;
  /** The (debounced) term the current results belong to. */
  term: string;
  results: PokemonSummary[];
  error: UserFacingError | null;
};

export type PokemonSearchAction =
  | { type: 'CLEAR' }
  | { type: 'SEARCH_START'; term: string }
  | { type: 'SEARCH_SUCCESS'; term: string; results: PokemonSummary[] }
  | { type: 'SEARCH_FAILURE'; term: string; error: UserFacingError };
