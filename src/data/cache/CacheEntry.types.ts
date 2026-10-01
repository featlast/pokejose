/** Envelope persisted around every cached payload. */
export type CacheEntry<TData> = {
  schemaVersion: number;
  savedAt: number;
  data: TData;
};

/** A cache read: the data plus whether its TTL has elapsed. */
export type CachedValue<TData> = {
  data: TData;
  isExpired: boolean;
};
