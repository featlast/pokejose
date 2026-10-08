import type { EvolutionChain } from '../../../domain/models';

export interface EvolutionRemoteDataSource {
  fetchEvolutionChain(speciesId: number): Promise<EvolutionChain>;
}
