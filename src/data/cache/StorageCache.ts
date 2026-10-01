import type { KeyValueStorage } from '../../core/storage/KeyValueStorage.interface';
import type { CacheEntry, CachedValue } from './CacheEntry.types';

export type StorageCacheOptions = {
  /** Bump when the persisted shape changes; older entries are discarded. */
  schemaVersion: number;
  now?: () => number;
};

/**
 * Typed, versioned, TTL-aware envelope over the raw key/value storage.
 * Every local data source persists through it, so the rules live in one place.
 */
export class StorageCache {
  private readonly now: () => number;

  constructor(
    private readonly storage: KeyValueStorage,
    private readonly options: StorageCacheOptions,
  ) {
    this.now = options.now ?? Date.now;
  }

  async read<TData>(
    key: string,
    ttlMs: number,
  ): Promise<CachedValue<TData> | null> {
    const raw = await this.storage.getItem(key);
    if (raw === null) {
      return null;
    }

    let entry: CacheEntry<TData>;
    try {
      entry = JSON.parse(raw) as CacheEntry<TData>;
    } catch {
      await this.storage.removeItem(key);
      return null;
    }

    // Entries written by an older app version may not match today's models.
    if (entry?.schemaVersion !== this.options.schemaVersion) {
      await this.storage.removeItem(key);
      return null;
    }

    return {
      data: entry.data,
      isExpired: this.now() - entry.savedAt > ttlMs,
    };
  }

  write<TData>(key: string, data: TData): Promise<void> {
    const entry: CacheEntry<TData> = {
      schemaVersion: this.options.schemaVersion,
      savedAt: this.now(),
      data,
    };
    return this.storage.setItem(key, JSON.stringify(entry));
  }
}
