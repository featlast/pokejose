import { DataOrigin } from '../../domain/enums';
import type { PokemonSummary, Resource } from '../../domain/models';
import type { FetchPolicy } from '../../domain/repositories/FetchPolicy.types';
import type { PokemonSearchIndexRepository } from '../../domain/repositories/PokemonSearchIndexRepository.interface';
import { resolveWithCache } from '../cache/resolveWithCache';
import type { SearchIndexLocalDataSource } from '../datasources/local/SearchIndexLocalDataSource.interface';
import type { SearchIndexRemoteDataSource } from '../datasources/remote/SearchIndexRemoteDataSource.interface';

type Clock = () => number;

/** Minimum time between background attempts to replace an offline (stale) index. */
const REVALIDATE_INTERVAL_MS = 60_000;

/**
 * Search index under the shared cache policy, memoized in memory so each keystroke
 * searches the parsed list instead of reading ~100 KB from disk again.
 * An offline (stale) index is kept and answered instantly; the network is retried
 * in the background at most once per minute instead of blocking every search.
 */
export class PokemonSearchIndexRepositoryImpl
  implements PokemonSearchIndexRepository
{
  private memo: Promise<Resource<PokemonSummary[]>> | null = null;
  private lastRevalidation = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly remote: SearchIndexRemoteDataSource,
    private readonly local: SearchIndexLocalDataSource,
    private readonly now: Clock = Date.now,
  ) {}

  getSearchIndex(
    policy: FetchPolicy = {},
  ): Promise<Resource<PokemonSummary[]>> {
    if (this.memo && !policy.forceRefresh) {
      return this.memo;
    }
    const request = this.resolve(policy);
    this.memo = request;
    request.then(
      ({ origin }) => {
        if (origin === DataOrigin.STALE_CACHE) {
          this.revalidateInBackground();
        }
      },
      // A failure must not be memoized: the next search retries.
      () => {
        if (this.memo === request) {
          this.memo = null;
        }
      },
    );
    return request;
  }

  private resolve(policy: FetchPolicy) {
    return resolveWithCache({
      policy,
      readCache: () => this.local.getSearchIndex(),
      fetchRemote: () => this.remote.fetchSearchIndex(),
      writeCache: entries => this.local.saveSearchIndex(entries),
    });
  }

  private revalidateInBackground() {
    const now = this.now();
    if (now - this.lastRevalidation < REVALIDATE_INTERVAL_MS) {
      return;
    }
    this.lastRevalidation = now;
    this.resolve({ forceRefresh: true, allowStaleFallback: false })
      .then(fresh => {
        this.memo = Promise.resolve(fresh);
      })
      .catch(() => undefined);
  }
}
