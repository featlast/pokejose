import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Platform } from 'react-native';
import { spacing } from '../theme';
import { useSafeAreaInsets } from './SafeArea';

/** Height of the title block that disappears when collapsing. */
export const TITLE_BLOCK_HEIGHT = 64;
const SEARCH_ROW_HEIGHT = 44;

/** Geometry of the list screen's collapsing header for the current safe area. */
export const useCollapsingHeaderLayout = () => {
  const insets = useSafeAreaInsets();
  const expandedHeight =
    insets.top +
    spacing.sm +
    TITLE_BLOCK_HEIGHT +
    SEARCH_ROW_HEIGHT +
    spacing.md;
  return {
    expandedHeight,
    collapseDistance: TITLE_BLOCK_HEIGHT,
  };
};

const isIOS = Platform.OS === 'ios';

/**
 * Raw content offset → "distance scrolled from the top", clamped at 0 from below:
 * iOS bounce (e.g. pull-to-refresh) yields negative offsets that would otherwise
 * cancel other contributions to the header state (such as search collapsing it).
 */
export const normalizedScrollOffset = (
  scrollY: Animated.Value,
  topInset: number,
) =>
  Animated.add(scrollY, topInset).interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolateLeft: 'clamp',
  });

/**
 * Scroll tracking for a list that sits under the absolute collapsing header. Both
 * platforms reserve the header's space with top padding, so offset 0 is always the
 * real top of the list.
 *
 * iOS used to reserve it with `contentInset`, but `UIRefreshControl` also rewrites
 * `contentInset.top` while refreshing, and the two drifted apart: the list could end
 * up with no inset, unable to scroll back above the header, and with the refresh
 * spinner drawn behind the cards. With padding nothing can alter where the top is.
 */
export const useHeaderScroll = (headerHeight: number) => {
  const scrollY = useRef(new Animated.Value(0)).current;

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
      }),
    [scrollY],
  );

  const offset = useMemo(() => normalizedScrollOffset(scrollY, 0), [scrollY]);

  /** Back to "at the top": when the list unmounts or is remounted (e.g. new column count). */
  const reset = useCallback(() => scrollY.setValue(0), [scrollY]);

  useEffect(() => {
    reset();
  }, [reset, headerHeight]);

  const listProps = useMemo(
    // iOS must not add its own safe-area inset: the header already accounts for it.
    () => (isIOS ? { contentInsetAdjustmentBehavior: 'never' as const } : {}),
    [],
  );

  return {
    onScroll,
    /** Raw content offset (negative while bouncing on iOS): scroll-to-top. */
    scrollY,
    offset,
    reset,
    listProps,
    /** Top padding the content needs so its first row starts below the header. */
    contentPaddingTop: headerHeight,
    /** Where the refresh spinner must appear (Android; iOS shows its own, see the list). */
    progressViewOffset: headerHeight,
  };
};
