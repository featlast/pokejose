import type { UserFacingError } from '../../../core/errors';
import type { PokemonType } from '../../../domain/enums';
import type { PokemonSummary } from '../../../domain/models';
import type { CollectionFilter } from '../../enums/CollectionFilter.enum';
import type { SearchStatus } from '../../enums/SearchStatus.enum';

/** Single selection of the filter row: a type, favorites, or `null` for "Todos". */
export type ListFilter = PokemonType | CollectionFilter | null;

export type PokemonSearchState = {
  status: SearchStatus;
  /** The (debounced) term the current results belong to. */
  term: string;
  /** The filter the current results belong to (FR-302, FR-606). */
  filter: ListFilter;
  results: PokemonSummary[];
  error: UserFacingError | null;
};

export type PokemonSearchAction =
  | { type: 'CLEAR' }
  | { type: 'SEARCH_START'; term: string; filter: ListFilter }
  | {
      type: 'SEARCH_SUCCESS';
      term: string;
      filter: ListFilter;
      results: PokemonSummary[];
    }
  | {
      type: 'SEARCH_FAILURE';
      term: string;
      filter: ListFilter;
      error: UserFacingError;
    };
