const HOUR_MS = 60 * 60 * 1000;

export const API_CONFIG = {
  baseUrl: 'https://pokeapi.co/api/v2',
  artworkBaseUrl:
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork',
  requestTimeoutMs: 10_000,
} as const;

export const PAGINATION_CONFIG = {
  pageSize: 20,
} as const;

export const CACHE_CONFIG = {
  /**
   * Bump when the persisted shape or meaning of cached data changes.
   * v2: the type index now includes alternative forms (spec 002).
   * v3: list pages come from `pokemon-species` (1025 Pokémon, no forms).
   */
  schemaVersion: 3,
  listTtlMs: 24 * HOUR_MS,
  detailTtlMs: 7 * 24 * HOUR_MS,
  /** Type and name indexes change only when new games are released. */
  indexTtlMs: 7 * 24 * HOUR_MS,
} as const;

export const CATALOG_CONFIG = {
  /** Large enough to return every Pokémon in one request (~1350 today). */
  searchIndexLimit: 100_000,
} as const;
