import { StatName } from '../../domain/enums';

/** "mr-mime" → "Mr Mime" */
export const formatName = (name: string): string =>
  name
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

/** 25 → "#025" */
export const formatPokedexNumber = (id: number): string =>
  `#${String(id).padStart(3, '0')}`;

export const formatWeight = (kg: number): string => `${kg.toFixed(1)} kg`;

export const formatHeight = (m: number): string => `${m.toFixed(1)} m`;

export const STAT_LABELS: Record<StatName, { short: string; long: string }> = {
  [StatName.HP]: { short: 'PS', long: 'Puntos de salud' },
  [StatName.ATTACK]: { short: 'ATQ', long: 'Ataque' },
  [StatName.DEFENSE]: { short: 'DEF', long: 'Defensa' },
  [StatName.SPECIAL_ATTACK]: { short: 'AT.E', long: 'Ataque especial' },
  [StatName.SPECIAL_DEFENSE]: { short: 'DF.E', long: 'Defensa especial' },
  [StatName.SPEED]: { short: 'VEL', long: 'Velocidad' },
};

/** Highest base stat in the games (Blissey's HP); used to scale stat bars. */
export const MAX_BASE_STAT = 255;

const MULTIPLIER_TEXT: Record<number, { short: string; spoken: string }> = {
  4: { short: '×4', spoken: 'cuádruple de daño' },
  2: { short: '×2', spoken: 'doble de daño' },
  0.5: { short: '×½', spoken: 'mitad de daño' },
  0.25: { short: '×¼', spoken: 'un cuarto del daño' },
  0: { short: '×0', spoken: 'sin daño' },
};

/** 2 → "×2", 0.25 → "×¼" (FR-404). */
export const formatMultiplier = (multiplier: number): string =>
  MULTIPLIER_TEXT[multiplier]?.short ?? `×${multiplier}`;

/** 2 → "doble de daño": how screen readers announce a multiplier (NFR-403). */
export const describeMultiplier = (multiplier: number): string =>
  MULTIPLIER_TEXT[multiplier]?.spoken ?? `daño por ${multiplier}`;
