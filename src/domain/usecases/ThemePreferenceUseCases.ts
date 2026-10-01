import { ThemePreference } from '../enums';

const CYCLE: readonly ThemePreference[] = [
  ThemePreference.SYSTEM,
  ThemePreference.LIGHT,
  ThemePreference.DARK,
];

/** Order used by the header toggle: Sistema → Claro → Oscuro → Sistema. */
export const nextThemePreference = (
  current: ThemePreference,
): ThemePreference => CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
