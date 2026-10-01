import type { typography } from './tokens';

export type ThemeColors = {
  primary: string;
  onPrimary: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  skeleton: string;
  /** Translucent band that sweeps across skeletons. */
  shimmer: string;
  warningBackground: string;
  warningText: string;
};

export type Theme = {
  isDark: boolean;
  colors: ThemeColors;
};

/** Named text styles available to `AppText`. */
export type TypographyVariant = keyof typeof typography;
