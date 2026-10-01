import React, { createContext, useContext, useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { AppState, Dimensions, Platform, StatusBar } from 'react-native';
import NativeSafeArea from '../../native/specs/NativeSafeArea';
import type {
  SafeAreaInsets,
  Spec as SafeAreaReader,
} from '../../native/specs/NativeSafeArea';

const fallbackInsets = (): SafeAreaInsets => ({
  top: Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 20,
  right: 0,
  bottom: 0,
  left: 0,
});

const RETRY_DELAY_MS = 250;

const SafeAreaContext = createContext<SafeAreaInsets>(fallbackInsets());

type SafeAreaProviderProps = PropsWithChildren<{
  /** Injectable for tests; defaults to the native TurboModule. */
  reader?: SafeAreaReader | null;
}>;

/**
 * Supplies real device insets (notch, home indicator, edge-to-edge bars).
 * Children render only after the first measurement to avoid a layout jump.
 */
export const SafeAreaProvider = ({
  children,
  reader = NativeSafeArea,
}: SafeAreaProviderProps) => {
  const [insets, setInsets] = useState<SafeAreaInsets | null>(
    reader ? null : fallbackInsets(),
  );

  useEffect(() => {
    if (!reader) {
      return;
    }
    let active = true;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const measure = (canRetry = false) => {
      reader
        .getInsets()
        .then(value => active && setInsets(value))
        .catch(() => {
          if (!active) {
            return;
          }
          // The window may not be attached yet: render with a fallback and try again.
          setInsets(current => current ?? fallbackInsets());
          if (canRetry) {
            retry = setTimeout(() => measure(false), RETRY_DELAY_MS);
          }
        });
    };

    measure(true);
    const onChange = () => measure(true);
    const dimensions = Dimensions.addEventListener('change', onChange);
    // Navigation-mode or multi-window changes can happen while backgrounded.
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') {
        onChange();
      }
    });
    return () => {
      active = false;
      clearTimeout(retry);
      dimensions.remove();
      appState.remove();
    };
  }, [reader]);

  if (!insets) {
    return null;
  }
  return (
    <SafeAreaContext.Provider value={insets}>
      {children}
    </SafeAreaContext.Provider>
  );
};

export const useSafeAreaInsets = (): SafeAreaInsets =>
  useContext(SafeAreaContext);
