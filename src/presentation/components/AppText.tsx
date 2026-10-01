import React from 'react';
// The only allowed import of Text in the app (enforced by ESLint).
import { Platform, StyleSheet, Text, useWindowDimensions } from 'react-native';
import type { TextProps, TextStyle } from 'react-native';
import type { TypographyVariant } from '../theme';
import {
  iosTextMetricsFix,
  maxFontScale,
  typography,
  useTheme,
} from '../theme';

export type AppTextProps = TextProps & {
  /** Text style from the typography tokens. Defaults to `body`. */
  variant?: TypographyVariant;
  /** Overrides the theme's primary text color (e.g. white on colored headers). */
  color?: string;
};

/**
 * iOS style that normalises the Intro fonts for the size the text is actually drawn
 * at (OS text size included, within the variant's cap): a fixed line height plus a
 * small downward shift of the glyphs. Undefined for system-font text.
 */
export const iosTextFix = (
  style: TextStyle,
  fontScale: number,
  maxScale: number,
): TextStyle | undefined => {
  const fix = style.fontFamily
    ? iosTextMetricsFix[style.fontFamily]
    : undefined;
  if (!fix || !style.fontSize) {
    return undefined;
  }
  const rendered = style.fontSize * Math.min(fontScale, maxScale);
  return {
    // RN scales lineHeight with the OS text size itself, so it uses the base size.
    lineHeight: style.fontSize * fix.lineHeightEm,
    transform: [{ translateY: rendered * fix.shiftEm }],
  };
};

/**
 * Single entry point for text: applies the typeface, size and theme color of a
 * typography variant, and caps OS font scaling per variant so layouts hold.
 * Extra `style` is merged last for layout tweaks (alignment, margins).
 * On iOS it also corrects the Intro fonts' vertical metrics (see `iosTextMetricsFix`).
 */
export const AppText = ({
  variant = 'body',
  color,
  style,
  maxFontSizeMultiplier,
  ...props
}: AppTextProps) => {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const maxScale = maxFontSizeMultiplier ?? maxFontScale[variant];

  const textStyle = [
    typography[variant],
    { color: color ?? colors.textPrimary },
    style,
  ];
  // Flattened only to read the final family and size (callers may override them).
  const resolved: TextStyle = StyleSheet.flatten(textStyle) ?? {};
  const iosFix =
    Platform.OS === 'ios'
      ? iosTextFix(resolved, fontScale, maxScale)
      : undefined;

  return (
    <Text
      {...props}
      maxFontSizeMultiplier={maxScale}
      // Callers' own styles (layout tweaks) still win: they come last.
      style={[iosFix, ...textStyle]}
    />
  );
};
