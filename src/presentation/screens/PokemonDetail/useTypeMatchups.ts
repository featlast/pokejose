import { useEffect, useState } from 'react';
import type { PokemonType } from '../../../domain/enums';
import type { TypeMatchups } from '../../../domain/models';
import type { GetTypeMatchupsUseCase } from '../../../domain/usecases/GetTypeMatchupsUseCase';

/**
 * Weaknesses and resistances for the Pokémon's types, loaded in the background.
 * The detail never waits for them; on failure they stay null and the section
 * is simply not shown (FR-406).
 */
export const useTypeMatchups = (
  getTypeMatchups: GetTypeMatchupsUseCase,
  types: readonly PokemonType[] | undefined,
): TypeMatchups | null => {
  const [matchups, setMatchups] = useState<TypeMatchups | null>(null);
  // A string key: a new detail object with the same types must not reload.
  const typesKey = types?.join('/') ?? '';

  useEffect(() => {
    if (!typesKey) {
      return;
    }
    let active = true;
    getTypeMatchups
      .execute(typesKey.split('/') as PokemonType[])
      .then(result => active && setMatchups(result))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [getTypeMatchups, typesKey]);

  return matchups;
};
