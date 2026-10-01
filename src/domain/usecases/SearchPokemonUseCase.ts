import type { PokemonSummary } from '../models';
import type { PokemonSearchIndexRepository } from '../repositories/PokemonSearchIndexRepository.interface';

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

export class SearchPokemonUseCase {
  constructor(private readonly repository: PokemonSearchIndexRepository) {}

  async execute(query: string): Promise<PokemonSummary[]> {
    if (!query.trim()) {
      return [];
    }
    const { data } = await this.repository.getSearchIndex();
    return searchPokemon(data, query);
  }
}
