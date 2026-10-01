import React from 'react';
import type { ReactNode } from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet } from 'react-native';
import type { Theme } from '../theme';
import { MIN_TOUCH_TARGET, useTheme } from '../theme';

/**
 * - `translucent`: frosted look over colored headers (semi-transparent white fill,
 *   light rim and a soft shadow).
 * - `elevated`: solid surface floating over content, with a deeper shadow.
 * - `brand`: the most visible floating button. Red (the header's primary color)
 *   on a light theme, white on a dark one, so it always stands out from the list.
 *   "Sistema" is already resolved to light/dark by the theme.
 */
export type CircleButtonVariant = 'translucent' | 'elevated' | 'brand';

/** Fill and content (icon) color of the `brand` variant for the active theme. */
export const brandButtonColors = ({ isDark, colors }: Theme) =>
  isDark
    ? { fill: '#FFFFFF', content: colors.primary }
    : { fill: colors.primary, content: colors.onPrimary };

/** Icon color to use inside a `brand` CircleButton for the active theme. */
export const useBrandButtonContentColor = () =>
  brandButtonColors(useTheme()).content;

type CircleButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  variant: CircleButtonVariant;
  /** Visual diameter; the touch area is always at least 48 pt. */
  size?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Round icon button with a real shadow on both platforms. `boxShadow` (RN ≥ 0.76,
 * New Architecture) replaces the old iOS `shadow*` / Android `elevation` split.
 */
export const CircleButton = ({
  variant,
  size = 40,
  children,
  style,
  hitSlop,
  ...pressableProps
}: CircleButtonProps) => {
  const theme = useTheme();
  const { colors, isDark } = theme;
  const touchPadding = Math.max(0, (MIN_TOUCH_TARGET - size) / 2);

  const floatingShadow = isDark
    ? '0 6px 16px rgba(0,0,0,0.55)'
    : '0 6px 16px rgba(17,24,39,0.18), 0 1px 3px rgba(17,24,39,0.12)';

  const SURFACES: Record<CircleButtonVariant, ViewStyle> = {
    translucent: {
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderColor: 'rgba(255,255,255,0.55)',
      borderWidth: 1.5,
      boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    },
    elevated: { backgroundColor: colors.surface, boxShadow: floatingShadow },
    brand: {
      backgroundColor: brandButtonColors(theme).fill,
      boxShadow: floatingShadow,
    },
  };
  const PRESSED: Record<CircleButtonVariant, ViewStyle> = {
    translucent: { backgroundColor: 'rgba(255,255,255,0.32)' },
    elevated: { backgroundColor: colors.surfaceMuted },
    // Keeps the brand color; the press reads through the scale and a dimmer fill.
    brand: { opacity: 0.88 },
  };

  return (
    <Pressable
      {...pressableProps}
      hitSlop={hitSlop ?? touchPadding}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        SURFACES[variant],
        pressed && [{ transform: [{ scale: 0.92 }] }, PRESSED[variant]],
        style,
      ]}
    >
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
