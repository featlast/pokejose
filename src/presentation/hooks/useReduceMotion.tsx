import React, { createContext, useContext, useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { AccessibilityInfo } from 'react-native';

const ReduceMotionContext = createContext(false);

/**
 * Reads the OS "Reduce motion" setting once for the whole app (instead of one
 * native call and listener per animated component) and renders children only
 * once it is known, so the first fade already honours it.
 */
export const ReduceMotionProvider = ({ children }: PropsWithChildren) => {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => active && setReduceMotion(value))
      .catch(() => active && setReduceMotion(false));
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  if (reduceMotion === null) {
    return null;
  }
  return (
    <ReduceMotionContext.Provider value={reduceMotion}>
      {children}
    </ReduceMotionContext.Provider>
  );
};

/** Whether decorative animations must be skipped. False outside the provider. */
export const useReduceMotion = (): boolean => useContext(ReduceMotionContext);
