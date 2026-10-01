import { AppError, ErrorCode } from '../../src/core/errors';
import type { CachedValue } from '../../src/data/cache/CacheEntry.types';
import type { PokemonLocalDataSource } from '../../src/data/datasources/local/PokemonLocalDataSource.interface';
import type { PokemonRemoteDataSource } from '../../src/data/datasources/remote/PokemonRemoteDataSource.interface';
import { PokemonRepositoryImpl } from '../../src/data/repositories/PokemonRepositoryImpl';
import { DataOrigin } from '../../src/domain/enums';
import type { Page, PokemonSummary } from '../../src/domain/models';
import { bulbasaurDetail, makePage } from '../fixtures/pokemon.fixtures';

const networkError = new AppError(ErrorCode.NETWORK, 'offline');

const createRemote = (): jest.Mocked<PokemonRemoteDataSource> => ({
  fetchPage: jest.fn(),
  fetchDetail: jest.fn(),
});

const createLocal = (): jest.Mocked<PokemonLocalDataSource> => ({
  getPage: jest.fn().mockResolvedValue(null),
  savePage: jest.fn().mockResolvedValue(undefined),
  getDetail: jest.fn().mockResolvedValue(null),
  saveDetail: jest.fn().mockResolvedValue(undefined),
});

const cached = <T>(data: T, isExpired: boolean): CachedValue<T> => ({
  data,
  isExpired,
});

describe('PokemonRepositoryImpl', () => {
  const cachedPage = makePage([1, 2], 2);
  const networkPage = makePage([1, 2, 3], 3);

  it('serves a fresh cache entry without touching the network', async () => {
    const remote = createRemote();
    const local = createLocal();
    local.getPage.mockResolvedValue(cached(cachedPage, false));

    const result = await new PokemonRepositoryImpl(
      remote,
      local,
    ).getPokemonPage(0, 20);

    expect(result).toEqual({ data: cachedPage, origin: DataOrigin.CACHE });
    expect(remote.fetchPage).not.toHaveBeenCalled();
  });

  it('fetches and persists when the cache is empty', async () => {
    const remote = createRemote();
    const local = createLocal();
    remote.fetchPage.mockResolvedValue(networkPage);

    const result = await new PokemonRepositoryImpl(
      remote,
      local,
    ).getPokemonPage(0, 20);

    expect(result).toEqual({ data: networkPage, origin: DataOrigin.NETWORK });
    expect(local.savePage).toHaveBeenCalledWith(0, 20, networkPage);
  });

  it('refreshes an expired entry from the network', async () => {
    const remote = createRemote();
    const local = createLocal();
    local.getPage.mockResolvedValue(cached(cachedPage, true));
    remote.fetchPage.mockResolvedValue(networkPage);

    const result = await new PokemonRepositoryImpl(
      remote,
      local,
    ).getPokemonPage(0, 20);

    expect(result.origin).toBe(DataOrigin.NETWORK);
    expect(result.data).toBe(networkPage);
  });

  it('bypasses a fresh cache when forceRefresh is set', async () => {
    const remote = createRemote();
    const local = createLocal();
    local.getPage.mockResolvedValue(cached(cachedPage, false));
    remote.fetchPage.mockResolvedValue(networkPage);

    const result = await new PokemonRepositoryImpl(
      remote,
      local,
    ).getPokemonPage(0, 20, { forceRefresh: true });

    expect(result.origin).toBe(DataOrigin.NETWORK);
  });

  it('falls back to stale cache when the network fails (offline)', async () => {
    const remote = createRemote();
    const local = createLocal();
    local.getDetail.mockResolvedValue(cached(bulbasaurDetail, true));
    remote.fetchDetail.mockRejectedValue(networkError);

    const result = await new PokemonRepositoryImpl(
      remote,
      local,
    ).getPokemonDetail(1);

    expect(result).toEqual({
      data: bulbasaurDetail,
      origin: DataOrigin.STALE_CACHE,
    });
  });

  it('throws instead of returning stale data when allowStaleFallback is false', async () => {
    const remote = createRemote();
    const local = createLocal();
    local.getPage.mockResolvedValue(cached(cachedPage, true));
    remote.fetchPage.mockRejectedValue(networkError);

    await expect(
      new PokemonRepositoryImpl(remote, local).getPokemonPage(0, 20, {
        forceRefresh: true,
        allowStaleFallback: false,
      }),
    ).rejects.toMatchObject({ code: ErrorCode.NETWORK });
  });

  it('propagates the error when there is nothing cached', async () => {
    const remote = createRemote();
    const local = createLocal();
    remote.fetchDetail.mockRejectedValue(networkError);

    await expect(
      new PokemonRepositoryImpl(remote, local).getPokemonDetail(1),
    ).rejects.toMatchObject({ code: ErrorCode.NETWORK });
  });

  it('still returns network data when persisting or reading the cache fails', async () => {
    const remote = createRemote();
    const local = createLocal();
    local.getPage.mockRejectedValue(new AppError(ErrorCode.STORAGE, 'read'));
    local.savePage.mockRejectedValue(
      new AppError(ErrorCode.STORAGE, 'disk full'),
    );
    remote.fetchPage.mockResolvedValue(networkPage);

    const result: { data: Page<PokemonSummary> } =
      await new PokemonRepositoryImpl(remote, local).getPokemonPage(0, 20);

    expect(result.data).toBe(networkPage);
  });
});
