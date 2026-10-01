export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

/**
 * Typefaces (Fontfabric Intro). Titles use Intro Bold; every other text uses
 * Intro Regular. One name works on both platforms: iOS resolves the PostScript
 * name and Android the asset file name (android/app/src/main/assets/fonts/).
 */
export const fontFamily = {
  display: 'Intro-Bold',
  text: 'Intro-Regular',
} as const;

/**
 * iOS-only vertical correction for the Intro fonts (Android already renders them
 * centred and is left untouched). On iOS their natural line box puts the glyphs
 * high: text sat ~4 pt high in a 14 pt pill. Calibrated on the simulator by
 * measuring pixels against Android:
 * - `lineHeightEm` gives every line a predictable box (iOS otherwise derives an
 *   oversized one from the font file), so stacked texts keep Android's spacing.
 * - `shiftEm` moves the glyphs down inside that box (a transform, layout untouched):
 *   the 14 pt pill then matches Android to the pixel and title/subtitle baselines
 *   end ~20.7 pt apart, as on Android (20.6 pt).
 */
export const iosTextMetricsFix: Readonly<
  Record<string, { lineHeightEm: number; shiftEm: number }>
> = {
  [fontFamily.display]: { lineHeightEm: 1.25, shiftEm: 0.119 }, // Intro Bold
  [fontFamily.text]: { lineHeightEm: 1.25, shiftEm: 0.119 }, // Intro Regular
};

/**
 * Text styles, consumed through `AppText` (`<AppText variant="heading">`).
 * Both families have a single weight: never add `fontWeight`, or Android would
 * synthesize a fake bold. Hierarchy comes from family, size and color.
 */
export const typography = {
  /** Screen titles (app name, Pokémon name). */
  title: { fontSize: 28, fontFamily: fontFamily.display },
  /** Section titles and state-message titles. */
  heading: { fontSize: 20, fontFamily: fontFamily.display },
  body: { fontSize: 16, fontFamily: fontFamily.text },
  /** Highlighted figures (weight, height, base experience). */
  value: { fontSize: 18, fontFamily: fontFamily.text },
  label: { fontSize: 14, fontFamily: fontFamily.text },
  caption: { fontSize: 12, fontFamily: fontFamily.text },
  /** Symbols used as icons (⌕ ✕): system font, the Intro families lack them. */
  glyph: { fontSize: 16 },
} as const;

/**
 * Upper bound for the OS text-size setting per variant: large enough for
 * accessibility, small enough that fixed-height UI (header, ribbons) never breaks.
 */
export const maxFontScale = {
  title: 1.2,
  heading: 1.4,
  body: 1.8,
  value: 1.5,
  label: 1.6,
  caption: 1.5,
  glyph: 1.3,
} as const;

/** Minimum touch target recommended by Apple HIG (44pt) and Material (48dp). */
export const MIN_TOUCH_TARGET = 48;
