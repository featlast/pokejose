import type { EvolutionChain, EvolutionNode } from '../../domain/models';

export type EvolutionBranch = {
  node: EvolutionNode;
  /** Shown as "de X" when it does not come straight from the split point. */
  parent: EvolutionNode;
  fromSplit: boolean;
};

/**
 * How the chain is drawn (ADR-20):
 * - `none`: a single Pokémon (Tauros).
 * - `linear`: no member has more than one evolution (Charmander → Charizard).
 * - `branched`: the linear start, then every later member as a card (Eevee, Oddish).
 */
export type EvolutionLayout =
  | { kind: 'none'; root: EvolutionNode }
  | { kind: 'linear'; stages: EvolutionNode[] }
  | { kind: 'branched'; stages: EvolutionNode[]; branches: EvolutionBranch[] };

const collectBranches = (
  node: EvolutionNode,
  split: EvolutionNode,
  out: EvolutionBranch[],
) =>
  node.evolvesTo.forEach(child => {
    out.push({ node: child, parent: node, fromSplit: node === split });
    collectBranches(child, split, out);
  });

export const evolutionLayout = (chain: EvolutionChain): EvolutionLayout => {
  const { root } = chain;
  if (root.evolvesTo.length === 0) {
    return { kind: 'none', root };
  }
  // Linear prefix: follow single evolutions until the chain ends or splits.
  const stages: EvolutionNode[] = [root];
  let last = root;
  while (last.evolvesTo.length === 1) {
    last = last.evolvesTo[0];
    stages.push(last);
  }
  if (last.evolvesTo.length === 0) {
    return { kind: 'linear', stages };
  }
  const branches: EvolutionBranch[] = [];
  collectBranches(last, last, branches);
  return { kind: 'branched', stages, branches };
};
