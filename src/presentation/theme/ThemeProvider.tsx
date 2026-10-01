import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { ThemePreference } from '../../domain/enums';
import { darkColors, lightColors } from './palette';
import type { Theme } from './Theme.types';

type ThemeContextValue = {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Keeps keyboard, alerts and other native UI in the chosen appearance. Called
 * before updating state, so the next render's `useColorScheme()` is already right.
 */
const applyToNative = (preference: ThemePreference) =>
  Appearance.setColorScheme(
    preference === ThemePreference.SYSTEM ? 'auto' : preference,
  );

/**
 * Resolves Sistema / Claro / Oscuro into a palette. The app always starts on
 * Sistema (FR-210); a manual choice lasts for the session and is not stored.
 */
export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState(ThemePreference.SYSTEM);

  const setPreference = useCallback((next: ThemePreference) => {
    applyToNative(next);
    setPreferenceState(next);
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const isDark =
      preference === ThemePreference.SYSTEM
        ? systemScheme === 'dark'
        : preference === ThemePreference.DARK;
    return {
      theme: { isDark, colors: isDark ? darkColors : lightColors },
      preference,
      setPreference,
    };
  }, [preference, systemScheme, setPreference]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

/** Palette for the current theme; outside a provider it follows the system. */
export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  const isSystemDark = useColorScheme() === 'dark';
  return useMemo(
    () =>
      context?.theme ?? {
        isDark: isSystemDark,
        colors: isSystemDark ? darkColors : lightColors,
      },
    [context, isSystemDark],
  );
};

export const useThemePreference = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemePreference must be used inside <ThemeProvider>');
  }
  return {
    preference: context.preference,
    setPreference: context.setPreference,
  };
};
