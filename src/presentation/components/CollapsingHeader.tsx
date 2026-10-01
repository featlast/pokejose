import React, { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from '../hooks/SafeArea';
import { AppText } from './AppText';
import { TITLE_BLOCK_HEIGHT } from '../hooks/useCollapsingHeader';
import { radius, spacing, useTheme } from '../theme';

type CollapsingHeaderProps = {
  title: string;
  subtitle?: string;
  /** Scroll offset (0 = top) of the list(s) under the header. */
  scrollOffset: Animated.AnimatedAddition;
  expandedHeight: number;
  collapseDistance: number;
  /** Renders the search row; receives the collapse progress (0 → 1). */
  renderSearch: (progress: Animated.AnimatedInterpolation<number>) => ReactNode;
  trailing?: ReactNode;
  /** Rendered right below the header (e.g. offline banners); moves with it. */
  bottomAccessory?: ReactNode;
};

export const HEADER_ICON_SIZE = 36;
/** Space the collapsed header reserves on the left of the search bar for the icon. */
export const HEADER_ICON_SLOT = HEADER_ICON_SIZE + spacing.sm;

/** Header text sits on the saturated primary color in both themes. */
const ON_HEADER = '#FFFFFF';

const appIcon = require('../../assets/images/app-icon.png');

/**
 * Large-title header that collapses on scroll (native driver, transforms only):
 * the title shrinks and fades away under the status bar, and the app icon
 * appears next to the search bar, which stays pinned.
 */
export const CollapsingHeader = ({
  title,
  subtitle,
  scrollOffset,
  expandedHeight,
  collapseDistance,
  renderSearch,
  trailing,
  bottomAccessory,
}: CollapsingHeaderProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Memoized: rebuilding these nodes would re-attach them to the native driver on every render.
  const animation = useMemo(() => {
    const progress = scrollOffset.interpolate({
      inputRange: [0, collapseDistance],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    return {
      progress,
      translateY: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -collapseDistance],
      }),
      titleOpacity: progress.interpolate({
        inputRange: [0, 0.6],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
      titleScale: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.8],
      }),
      iconOpacity: progress.interpolate({
        inputRange: [0.5, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
      iconScale: progress.interpolate({
        inputRange: [0.5, 1],
        outputRange: [0.6, 1],
        extrapolate: 'clamp',
      }),
    };
  }, [scrollOffset, collapseDistance]);
  const {
    progress,
    translateY,
    titleOpacity,
    titleScale,
    iconOpacity,
    iconScale,
  } = animation;

  const horizontal = {
    paddingLeft: insets.left + spacing.lg,
    paddingRight: insets.right + spacing.sm,
  };

  return (
    <>
      <Animated.View
        testID="collapsing-header"
        style={[
          styles.header,
          {
            height: expandedHeight,
            backgroundColor: colors.primary,
            paddingTop: insets.top + spacing.sm,
            transform: [{ translateY }],
          },
          horizontal,
        ]}
      >
        <Animated.View
          style={[
            styles.titleBlock,
            { opacity: titleOpacity, transform: [{ scale: titleScale }] },
          ]}
        >
          <AppText
            variant="title"
            color={ON_HEADER}
            accessibilityRole="header"
            numberOfLines={1}
          >
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="label" color={ON_HEADER} numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </Animated.View>
        <View style={styles.searchRow}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.icon,
              { opacity: iconOpacity, transform: [{ scale: iconScale }] },
            ]}
          >
            <Image
              source={appIcon}
              style={styles.iconImage}
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
          {renderSearch(progress)}
          {trailing}
        </View>
        {bottomAccessory ? (
          <View
            pointerEvents="none"
            style={[styles.accessory, { top: expandedHeight }]}
          >
            {bottomAccessory}
          </View>
        ) : null}
      </Animated.View>
      {/* Masks the title as it slides under the status bar. */}
      <View
        pointerEvents="none"
        style={[
          styles.statusBarScrim,
          { height: insets.top, backgroundColor: colors.primary },
        ]}
      />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing.md,
  },
  titleBlock: {
    height: TITLE_BLOCK_HEIGHT,
    justifyContent: 'center',
    transformOrigin: 'left',
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  icon: { position: 'absolute', left: 0 },
  iconImage: {
    width: HEADER_ICON_SIZE,
    height: HEADER_ICON_SIZE,
    borderRadius: radius.sm,
  },
  accessory: { position: 'absolute', left: 0, right: 0 },
  statusBarScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // zIndex only: an Android elevation shadow would draw a band over the header.
    zIndex: 2,
  },
});
