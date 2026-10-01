import { useCallback, useEffect, useRef, useState } from 'react';
import type { Animated, FlatList } from 'react-native';
import { useWindowDimensions } from 'react-native';

/** The button appears after this many screens of scroll… */
export const SHOW_AFTER_SCREENS = 2;
/** …and hides again closer than this to the top (hysteresis: no flicker at the edge). */
export const HIDE_BELOW_SCREENS = 1;

/** Next visibility of the button for a scroll distance from the top. */
export const nextScrollTopVisibility = (
  distance: number,
  viewport: number,
  visible: boolean,
) =>
  visible
    ? distance > viewport * HIDE_BELOW_SCREENS
    : distance > viewport * SHOW_AFTER_SCREENS;

type Options = {
  /** Raw content offset of the list (from `useHeaderScroll`); 0 is the top. */
  scrollY: Animated.Value;
};

/**
 * Scroll-to-top state for one list (FR-220). Visibility comes from a listener on the
 * scroll value; React state only changes when crossing a threshold, not on every frame.
 */
export const useScrollToTop = ({ scrollY }: Options) => {
  const { height: viewport } = useWindowDimensions();
  const listRef = useRef<FlatList | null>(null);
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      const next = nextScrollTopVisibility(value, viewport, visibleRef.current);
      if (next !== visibleRef.current) {
        visibleRef.current = next;
        setVisible(next);
      }
    });
    return () => scrollY.removeListener(id);
  }, [scrollY, viewport]);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  return { listRef, visible, scrollToTop };
};
