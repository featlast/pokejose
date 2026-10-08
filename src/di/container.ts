import {
  API_CONFIG,
  CACHE_CONFIG,
  CATALOG_CONFIG,
  PAGINATION_CONFIG,
} from '../core/config/app.config';
import { FetchHttpClient } from '../core/http/FetchHttpClient';
import type { HttpClient } from '../core/http/HttpClient.interface';
import { InMemoryKeyValueStorage } from '../core/storage/InMemoryKeyValueStorage';
import type { KeyValueStorage } from '../core/storage/KeyValueStorage.interface';
import { NativeKeyValueStorage } from '../core/storage/NativeKeyValueStorage';
import { StorageCache } from '../data/cache/StorageCache';
import { EvolutionStorageDataSource } from '../data/datasources/local/EvolutionStorageDataSource';
import { PokemonCatalogStorageDataSource } from '../data/datasources/local/PokemonCatalogStorageDataSource';
import { PokemonStorageDataSource } from '../data/datasources/local/PokemonStorageDataSource';
import { PokeApiCatalogRemoteDataSource } from '../data/datasources/remote/PokeApiCatalogRemoteDataSource';
import { PokeApiEvolutionRemoteDataSource } from '../data/datasources/remote/PokeApiEvolutionRemoteDataSource';
import { PokeApiRemoteDataSource } from '../data/datasources/remote/PokeApiRemoteDataSource';
import { FavoritesRepositoryImpl } from '../data/repositories/FavoritesRepositoryImpl';
import { PokemonEvolutionRepositoryImpl } from '../data/repositories/PokemonEvolutionRepositoryImpl';
import { PokemonRepositoryImpl } from '../data/repositories/PokemonRepositoryImpl';
import { PokemonSearchIndexRepositoryImpl } from '../data/repositories/PokemonSearchIndexRepositoryImpl';
import { PokemonTypeIndexRepositoryImpl } from '../data/repositories/PokemonTypeIndexRepositoryImpl';
import type { FavoritesRepository } from '../domain/repositories/FavoritesRepository.interface';
import type { PokemonEvolutionRepository } from '../domain/repositories/PokemonEvolutionRepository.interface';
import type { PokemonRepository } from '../domain/repositories/PokemonRepository.interface';
import type { PokemonSearchIndexRepository } from '../domain/repositories/PokemonSearchIndexRepository.interface';
import type { PokemonTypeChartRepository } from '../domain/repositories/PokemonTypeChartRepository.interface';
import type { PokemonTypeIndexRepository } from '../domain/repositories/PokemonTypeIndexRepository.interface';
import {
  GetFavoritesUseCase,
  RestoreFavoriteUseCase,
  ToggleFavoriteUseCase,
} from '../domain/usecases/FavoritesUseCases';
import { GetEvolutionChainUseCase } from '../domain/usecases/GetEvolutionChainUseCase';
import { GetPokemonDetailUseCase } from '../domain/usecases/GetPokemonDetailUseCase';
import { GetPokemonPageUseCase } from '../domain/usecases/GetPokemonPageUseCase';
import { GetPokemonTypeIndexUseCase } from '../domain/usecases/GetPokemonTypeIndexUseCase';
import { GetTypeMatchupsUseCase } from '../domain/usecases/GetTypeMatchupsUseCase';
import { SearchPokemonUseCase } from '../domain/usecases/SearchPokemonUseCase';
import NativeKeyValueStore from '../native/specs/NativeKeyValueStore';
import type { AppDependencies } from './AppDependencies.types';

type ContainerOverrides = {
  httpClient?: HttpClient;
  storage?: KeyValueStorage;
  repository?: PokemonRepository;
  typeIndexRepository?: PokemonTypeIndexRepository;
  typeChartRepository?: PokemonTypeChartRepository;
  searchIndexRepository?: PokemonSearchIndexRepository;
  evolutionRepository?: PokemonEvolutionRepository;
  favoritesRepository?: FavoritesRepository;
};

const createDefaultStorage = (): KeyValueStorage => {
  if (NativeKeyValueStore) {
    return new NativeKeyValueStorage(NativeKeyValueStore);
  }
  if (__DEV__) {
    console.warn(
      'NativeKeyValueStore is not linked; falling back to in-memory storage.',
    );
  }
  return new InMemoryKeyValueStorage();
};

/** Builds a shared instance on first use, so fully faked graphs never touch it. */
const lazy = <T>(create: () => T): (() => T) => {
  let instance: T | undefined;
  return () => {
    if (instance === undefined) {
      instance = create();
    }
    return instance;
  };
};

/**
 * Composition root: the only place that knows concrete implementations.
 * Tests pass overrides to swap any layer for a fake.
 */
export const createAppDependencies = (
  overrides: ContainerOverrides = {},
): AppDependencies => {
  const storage = lazy(() => overrides.storage ?? createDefaultStorage());
  const http = lazy(
    () =>
      overrides.httpClient ??
      new FetchHttpClient({
        baseUrl: API_CONFIG.baseUrl,
        timeoutMs: API_CONFIG.requestTimeoutMs,
      }),
  );
  const cache = lazy(
    () =>
      new StorageCache(storage(), {
        schemaVersion: CACHE_CONFIG.schemaVersion,
      }),
  );
  const catalogRemote = lazy(
    () => new PokeApiCatalogRemoteDataSource(http(), CATALOG_CONFIG),
  );
  const catalogLocal = lazy(
    () => new PokemonCatalogStorageDataSource(cache(), CACHE_CONFIG.indexTtlMs),
  );

  const repository =
    overrides.repository ??
    new PokemonRepositoryImpl(
      new PokeApiRemoteDataSource(http()),
      new PokemonStorageDataSource(cache(), CACHE_CONFIG),
    );
  // Index and chart share one `/type` snapshot, hence one instance.
  const typeCatalog = lazy(
    () => new PokemonTypeIndexRepositoryImpl(catalogRemote(), catalogLocal()),
  );
  const typeIndexRepository = overrides.typeIndexRepository ?? typeCatalog();
  const typeChartRepository = overrides.typeChartRepository ?? typeCatalog();
  const searchIndexRepository =
    overrides.searchIndexRepository ??
    new PokemonSearchIndexRepositoryImpl(catalogRemote(), catalogLocal());

  const evolutionRepository =
    overrides.evolutionRepository ??
    new PokemonEvolutionRepositoryImpl(
      new PokeApiEvolutionRemoteDataSource(http()),
      new EvolutionStorageDataSource(cache(), CACHE_CONFIG.detailTtlMs),
    );

  // Favorites skip `StorageCache`: schema bumps must never erase them (ADR-24).
  const favoritesRepository =
    overrides.favoritesRepository ?? new FavoritesRepositoryImpl(storage());

  return {
    getPokemonPage: new GetPokemonPageUseCase(
      repository,
      PAGINATION_CONFIG.pageSize,
    ),
    getPokemonDetail: new GetPokemonDetailUseCase(repository),
    getTypeIndex: new GetPokemonTypeIndexUseCase(typeIndexRepository),
    getTypeMatchups: new GetTypeMatchupsUseCase(typeChartRepository),
    getEvolutionChain: new GetEvolutionChainUseCase(evolutionRepository),
    searchPokemon: new SearchPokemonUseCase(
      searchIndexRepository,
      typeIndexRepository,
      favoritesRepository,
    ),
    getFavorites: new GetFavoritesUseCase(favoritesRepository),
    toggleFavorite: new ToggleFavoriteUseCase(favoritesRepository),
    restoreFavorite: new RestoreFavoriteUseCase(favoritesRepository),
  };
};
