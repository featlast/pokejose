const NUMBER_QUERY = /^#?\s*(\d+)$/;

/**
 * Text for an empty search. A number past the end of the Pokédex says where it
 * ends, instead of a generic "not found" (the API lists 1025 Pokémon today).
 */
export const noResultsMessage = (term: string, pokedexSize: number): string => {
  const match = NUMBER_QUERY.exec(term.trim());
  const requested = match ? Number(match[1]) : 0;
  if (pokedexSize > 0 && requested > pokedexSize) {
    // Non-breaking spaces keep "el #1025" together when the text wraps.
    return `No existe el\u00A0#${requested}. La Pokédex llega hasta el\u00A0#${pokedexSize}.`;
  }
  return `No encontramos Pokémon para “${term}”.`;
};
