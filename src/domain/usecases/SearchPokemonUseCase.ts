import type { PokemonType } from '../enums';
import type { PokemonSummary, PokemonTypeIndex } from '../models';
import type { FavoritesRepository } from '../repositories/FavoritesRepository.interface';
import type { PokemonSearchIndexRepository } from '../repositories/PokemonSearchIndexRepository.interface';
import type { PokemonTypeIndexRepository } from '../repositories/PokemonTypeIndexRepository.interface';

/** Spanish accents are enough here; avoids relying on `String.prototype.normalize`. */
const ACCENTS: Record<string, string> = {
  á: 'a',
  é: 'e',
  í: 'i',
  ó: 'o',
  ú: 'u',
  ü: 'u',
  ñ: 'n',
};

/** "  Mr. Mimé " → "mr mime": lowercase, no accents, separators collapsed to spaces. */
export const normalizeSearchText = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[áéíóúüñ]/g, char => ACCENTS[char] ?? char)
    .replace(/[\s\-_.']+/g, ' ')
    .trim();

const NUMBER_QUERY = /^#?\s*(\d+)$/;

/**
 * Pure search over the index: a number ("25", "#025") matches that id exactly;
 * text matches names containing it, names that start with it ranked first.
 */
export const searchPokemon = (
  index: readonly PokemonSummary[],
  query: string,
): PokemonSummary[] => {
  const numberMatch = NUMBER_QUERY.exec(query.trim());
  if (numberMatch) {
    const id = Number(numberMatch[1]);
    return index.filter(pokemon => pokemon.id === id);
  }

  const term = normalizeSearchText(query);
  if (!term) {
    return [];
  }

  const startsWith: PokemonSummary[] = [];
  const contains: PokemonSummary[] = [];
  index.forEach(pokemon => {
    const name = normalizeSearchText(pokemon.name);
    if (name.startsWith(term)) {
      startsWith.push(pokemon);
    } else if (name.includes(term)) {
      contains.push(pokemon);
    }
  });
  return [...startsWith, ...contains];
};

/** Pokémon that have `type` in any slot (Charizard is both Fire and Flying), in index order. */
export const filterByType = (
  index: readonly PokemonSummary[],
  typeIndex: PokemonTypeIndex,
  type: PokemonType,
): PokemonSummary[] =>
  index.filter(pokemon => typeIndex[pokemon.id]?.includes(type) ?? false);

/** Narrows a search; with no text, a filter alone lists everything it matches. */
export type SearchFilter = {
  type?: PokemonType | null;
  /** Only favorites, in their own order (most recent first) (ADR-26). */
  favoritesOnly?: boolean;
};

/**
 * Search by text, by filter or both. A filter alone lists everything it
 * matches; a text alone searches the whole index; neither returns nothing.
 */
export class SearchPokemonUseCase {
  constructor(
    private readonly searchIndex: PokemonSearchIndexRepository,
    private readonly typeIndex: PokemonTypeIndexRepository,
    private readonly favorites: FavoritesRepository,
  ) {}

  async execute(
    query: string,
    { type = null, favoritesOnly = false }: SearchFilter = {},
  ): Promise<PokemonSummary[]> {
    const hasQuery = query.trim().length > 0;
    if (!hasQuery && !type && !favoritesOnly) {
      return [];
    }
    const [index, typeIndex] = await Promise.all([
      favoritesOnly
        ? this.favorites.getFavorites()
        : this.searchIndex.getSearchIndex().then(({ data }) => data),
      type ? this.typeIndex.getTypeIndex() : Promise.resolve(null),
    ]);
    const candidates =
      type && typeIndex ? filterByType(index, typeIndex.data, type) : index;
    return hasQuery ? searchPokemon(candidates, query) : candidates;
  }
}
