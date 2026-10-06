import type { UserFacingError } from '../../../core/errors';
import type { PokemonType } from '../../../domain/enums';
import type { PokemonSummary } from '../../../domain/models';
import type { SearchStatus } from '../../enums/SearchStatus.enum';

export type PokemonSearchState = {
  status: SearchStatus;
  /** The (debounced) term the current results belong to. */
  term: string;
  /** The type filter the current results belong to (FR-302). */
  typeFilter: PokemonType | null;
  results: PokemonSummary[];
  error: UserFacingError | null;
};

export type PokemonSearchAction =
  | { type: 'CLEAR' }
  | { type: 'SEARCH_START'; term: string; typeFilter: PokemonType | null }
  | {
      type: 'SEARCH_SUCCESS';
      term: string;
      typeFilter: PokemonType | null;
      results: PokemonSummary[];
    }
  | {
      type: 'SEARCH_FAILURE';
      term: string;
      typeFilter: PokemonType | null;
      error: UserFacingError;
    };
