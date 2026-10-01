/** How a repository may trade freshness for availability on a single request. */
export type FetchPolicy = {
  /** Skip a fresh cache entry and go to the network first. */
  forceRefresh?: boolean;
  /**
   * When the network fails, return expired cached data instead of throwing.
   * Defaults to true; a user-initiated refresh disables it to surface the error.
   */
  allowStaleFallback?: boolean;
};
