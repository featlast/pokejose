/** Where a piece of data came from; lets the UI tell the user when it is offline data. */
export enum DataOrigin {
  NETWORK = 'network',
  CACHE = 'cache',
  STALE_CACHE = 'stale-cache',
}
