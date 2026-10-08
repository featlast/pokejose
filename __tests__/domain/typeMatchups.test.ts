import { PokemonType } from '../../src/domain/enums';
import type { TypeChart } from '../../src/domain/models';
import {
  GetTypeMatchupsUseCase,
  defensiveMatchups,
} from '../../src/domain/usecases/GetTypeMatchupsUseCase';
import { resource } from '../fixtures/pokemon.fixtures';

const {
  BUG,
  ELECTRIC,
  FAIRY,
  FIGHTING,
  FIRE,
  FLYING,
  GHOST,
  GRASS,
  GROUND,
  ICE,
  NORMAL,
  POISON,
  PSYCHIC,
  WATER,
} = PokemonType;

/** Defensive relations as PokéAPI reports them for these types. */
const chart: TypeChart = {
  [GRASS]: {
    [FLYING]: 2,
    [POISON]: 2,
    [BUG]: 2,
    [FIRE]: 2,
    [ICE]: 2,
    [GROUND]: 0.5,
    [WATER]: 0.5,
    [GRASS]: 0.5,
    [ELECTRIC]: 0.5,
  },
  [POISON]: {
    [GROUND]: 2,
    [PSYCHIC]: 2,
    [FIGHTING]: 0.5,
    [POISON]: 0.5,
    [BUG]: 0.5,
    [GRASS]: 0.5,
    [FAIRY]: 0.5,
  },
  [GHOST]: { [NORMAL]: 0, [FIGHTING]: 0, [POISON]: 0.5, [BUG]: 0.5 },
};

const summary = (matchups: { type: PokemonType; multiplier: number }[]) =>
  matchups.map(({ type, multiplier }) => `${type}×${multiplier}`);

describe('defensiveMatchups', () => {
  it('multiplies both types and drops what cancels out (Bulbasaur)', () => {
    const result = defensiveMatchups(chart, [GRASS, POISON]);
    expect(result).not.toBeNull();
    expect(summary(result!.weaknesses)).toEqual([
      'fire×2',
      'ice×2',
      'flying×2',
      'psychic×2',
    ]);
    // Grass ×¼ comes first; Bug, Poison and Ground cancel out to ×1.
    expect(summary(result!.resistances)).toEqual([
      'grass×0.25',
      'water×0.5',
      'electric×0.5',
      'fighting×0.5',
      'fairy×0.5',
    ]);
    expect(result!.immunities).toEqual([]);
  });

  it('lists immunities separately', () => {
    const result = defensiveMatchups(chart, [GHOST]);
    expect(summary(result!.immunities)).toEqual(['normal×0', 'fighting×0']);
    expect(summary(result!.resistances)).toEqual(['poison×0.5', 'bug×0.5']);
  });

  it('returns null when the chart lacks one of the types', () => {
    expect(defensiveMatchups(chart, [GRASS, WATER])).toBeNull();
    expect(defensiveMatchups(chart, [])).toBeNull();
  });
});

describe('GetTypeMatchupsUseCase', () => {
  it('computes the matchups from the repository chart', async () => {
    const repository = {
      getTypeChart: jest.fn().mockResolvedValue(resource(chart)),
    };
    const result = await new GetTypeMatchupsUseCase(repository).execute([
      GHOST,
    ]);
    expect(result?.immunities).toHaveLength(2);
  });
});
