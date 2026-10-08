import type { EvolutionChain, EvolutionNode } from '../models';
import type { PokemonEvolutionRepository } from '../repositories/PokemonEvolutionRepository.interface';

/** Every member of the chain in depth-first order, each with its parent. */
export const flattenEvolutionChain = (
  chain: EvolutionChain,
): { node: EvolutionNode; parent: EvolutionNode | null }[] => {
  const members: { node: EvolutionNode; parent: EvolutionNode | null }[] = [];
  const visit = (node: EvolutionNode, parent: EvolutionNode | null) => {
    members.push({ node, parent });
    node.evolvesTo.forEach(child => visit(child, node));
  };
  visit(chain.root, null);
  return members;
};

export class GetEvolutionChainUseCase {
  constructor(private readonly repository: PokemonEvolutionRepository) {}

  async execute(speciesId: number): Promise<EvolutionChain> {
    const { data } = await this.repository.getEvolutionChain(speciesId);
    return data;
  }
}
