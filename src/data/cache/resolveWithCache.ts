import { toAppError } from '../../core/errors';
import { DataOrigin } from '../../domain/enums';
import type { Resource } from '../../domain/models';
import type { FetchPolicy } from '../../domain/repositories/FetchPolicy.types';
import type { CachedValue } from './CacheEntry.types';

export type CacheSteps<TData> = {
  policy: FetchPolicy;
  readCache: () => Promise<CachedValue<TData> | null>;
  fetchRemote: () => Promise<TData>;
  writeCache: (data: TData) => Promise<void>;
};

/**
 * Cache-first policy shared by every repository (plan 001 ADR-02):
 * fresh cache → network (persisted) → stale cache as offline fallback → error.
 */
export const resolveWithCache = async <TData>(
  steps: CacheSteps<TData>,
): Promise<Resource<TData>> => {
  // A broken cache must never block the network path.
  const cached = await steps.readCache().catch(() => null);

  if (cached && !cached.isExpired && !steps.policy.forceRefresh) {
    return { data: cached.data, origin: DataOrigin.CACHE };
  }

  try {
    const data = await steps.fetchRemote();
    // Persisting is best effort: a full disk should not hide fresh data.
    await steps.writeCache(data).catch(() => undefined);
    return { data, origin: DataOrigin.NETWORK };
  } catch (error) {
    if (cached && steps.policy.allowStaleFallback !== false) {
      return { data: cached.data, origin: DataOrigin.STALE_CACHE };
    }
    throw toAppError(error);
  }
};
