import { useEffect, useRef, useState } from 'react';

type MinimumDurationOptions = {
  /** Loading shorter than this never shows the indicator (e.g. a cache hit). */
  delayMs?: number;
  /** Once shown, the indicator stays at least this long so it never flickers. */
  minVisibleMs?: number;
};

/**
 * Decides whether a loading indicator should be visible for a given `active`
 * flag, avoiding both a flash on fast loads and a blink on slightly slower ones.
 */
export const useMinimumDuration = (
  active: boolean,
  { delayMs = 150, minVisibleMs = 300 }: MinimumDurationOptions = {},
): boolean => {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    if (active) {
      if (visible) {
        return;
      }
      const timer = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, delayMs);
      return () => clearTimeout(timer);
    }

    if (!visible) {
      return;
    }
    const elapsed = Date.now() - (shownAt.current ?? 0);
    const timer = setTimeout(() => {
      shownAt.current = null;
      setVisible(false);
    }, Math.max(minVisibleMs - elapsed, 0));
    return () => clearTimeout(timer);
  }, [active, visible, delayMs, minVisibleMs]);

  return visible;
};
