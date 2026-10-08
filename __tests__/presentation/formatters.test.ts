import {
  describeMultiplier,
  formatMultiplier,
} from '../../src/presentation/utils/formatters';

describe('multiplier formatting', () => {
  it.each([
    [4, '×4', 'cuádruple de daño'],
    [2, '×2', 'doble de daño'],
    [0.5, '×½', 'mitad de daño'],
    [0.25, '×¼', 'un cuarto del daño'],
    [0, '×0', 'sin daño'],
  ])('%p reads as %p / %p', (multiplier, short, spoken) => {
    expect(formatMultiplier(multiplier)).toBe(short);
    expect(describeMultiplier(multiplier)).toBe(spoken);
  });

  it('falls back to the number for unexpected values', () => {
    expect(formatMultiplier(8)).toBe('×8');
    expect(describeMultiplier(8)).toBe('daño por 8');
  });
});
