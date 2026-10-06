const NUMBER_QUERY = /^#?\s*(\d+)$/;

/**
 * Text for an empty search. With a type filter it names the type (FR-305).
 * A number past the end of the Pokédex says where it ends, instead of a
 * generic "not found" (the API lists 1025 Pokémon today).
 */
export const noResultsMessage = (
  term: string,
  pokedexSize: number,
  typeLabel?: string,
): string => {
  if (typeLabel) {
    return term
      ? `No encontramos Pokémon de tipo ${typeLabel} para “${term}”.`
      : `No encontramos Pokémon de tipo ${typeLabel}.`;
  }
  const match = NUMBER_QUERY.exec(term.trim());
  const requested = match ? Number(match[1]) : 0;
  if (pokedexSize > 0 && requested > pokedexSize) {
    // Non-breaking spaces keep "el #1025" together when the text wraps.
    return `No existe el\u00A0#${requested}. La Pokédex llega hasta el\u00A0#${pokedexSize}.`;
  }
  return `No encontramos Pokémon para “${term}”.`;
};

/** Header subtitle for search or type-filter results (FR-305). */
export const resultsSubtitle = (
  count: number,
  term: string,
  typeLabel?: string,
): string => {
  if (!typeLabel) {
    return `${count} resultados`;
  }
  return term
    ? `${count} resultados de tipo ${typeLabel}`
    : `${count} Pokémon de tipo ${typeLabel}`;
};
