import { useEffect, useState } from 'react';
import type { EvolutionChain } from '../../../domain/models';
import type { GetEvolutionChainUseCase } from '../../../domain/usecases/GetEvolutionChainUseCase';

/**
 * Evolution chain of a species, loaded in the background. The detail never
 * waits for it; on failure it stays null and the section is not shown (FR-510).
 */
export const useEvolutionChain = (
  getEvolutionChain: GetEvolutionChainUseCase,
  speciesId: number | undefined,
): EvolutionChain | null => {
  const [chain, setChain] = useState<EvolutionChain | null>(null);

  useEffect(() => {
    if (speciesId === undefined) {
      return;
    }
    let active = true;
    getEvolutionChain
      .execute(speciesId)
      .then(result => active && setChain(result))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [getEvolutionChain, speciesId]);

  return chain;
};
