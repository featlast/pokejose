export enum SearchStatus {
  /** No search term: the paginated list is shown. */
  IDLE = 'idle',
  SEARCHING = 'searching',
  RESULTS = 'results',
  NO_RESULTS = 'no-results',
  ERROR = 'error',
}
