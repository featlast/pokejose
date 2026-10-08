import type { Resource, TypeChart } from '../models';
import type { FetchPolicy } from './FetchPolicy.types';

export interface PokemonTypeChartRepository {
  /** Damage multipliers between types, used to compute weaknesses and resistances. */
  getTypeChart(policy?: FetchPolicy): Promise<Resource<TypeChart>>;
}
