import React from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { AppText, iosTextFix } from '../../src/presentation/components/AppText';
import {
  fontFamily,
  lightColors,
  maxFontScale,
  typography,
} from '../../src/presentation/theme';

const render = (element: React.ReactElement) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(element);
  });
  const text = renderer.root.findByType(Text);
  return { props: text.props, style: StyleSheet.flatten(text.props.style) };
};

describe('AppText', () => {
  it('uses Intro Bold only for titles and Intro Regular for everything else', () => {
    expect(typography.title.fontFamily).toBe(fontFamily.display);
    expect(typography.heading.fontFamily).toBe(fontFamily.display);
    (['body', 'value', 'label', 'caption'] as const).forEach(variant =>
      expect(typography[variant].fontFamily).toBe(fontFamily.text),
    );
  });

  it('never sets fontWeight on single-weight families (no fake bold on Android)', () => {
    Object.values(typography).forEach(style =>
      expect(style).not.toHaveProperty('fontWeight'),
    );
  });

  it('defaults to the body variant in the theme primary text color', () => {
    const { style, props } = render(<AppText>Hola</AppText>);
    expect(style).toMatchObject({
      fontFamily: 'Intro-Regular',
      fontSize: typography.body.fontSize,
      color: lightColors.textPrimary,
    });
    expect(props.maxFontSizeMultiplier).toBe(maxFontScale.body);
  });

  it('applies the requested variant, color and font-scale cap', () => {
    const { style, props } = render(
      <AppText variant="title" color="#FFFFFF">
        Pokédex de José
      </AppText>,
    );
    expect(style).toMatchObject({
      fontFamily: 'Intro-Bold',
      fontSize: 28,
      color: '#FFFFFF',
    });
    expect(props.maxFontSizeMultiplier).toBe(maxFontScale.title);
  });

  it('merges layout styles last and lets callers override the scale cap', () => {
    const { style, props } = render(
      <AppText
        variant="caption"
        style={{ textAlign: 'center' }}
        maxFontSizeMultiplier={1.1}
      >
        x
      </AppText>,
    );
    expect(style).toMatchObject({ textAlign: 'center', fontSize: 12 });
    expect(props.maxFontSizeMultiplier).toBe(1.1);
  });

  it('keeps the system font for glyph icons', () => {
    const { style } = render(<AppText variant="glyph">✕</AppText>);
    expect(style.fontFamily).toBeUndefined();
  });

  describe('iOS vertical metrics of the Intro fonts', () => {
    it('sets a fixed line height and shifts the glyphs down, per family', () => {
      const regular = iosTextFix(
        { fontFamily: 'Intro-Regular', fontSize: 14 },
        1,
        1.6,
      );
      expect(regular?.lineHeight).toBeCloseTo(14 * 1.25);
      expect(regular?.transform).toEqual([
        { translateY: expect.closeTo(14 * 0.119, 5) },
      ]);
      const bold = iosTextFix(
        { fontFamily: 'Intro-Bold', fontSize: 28 },
        1,
        1.2,
      );
      expect(bold?.lineHeight).toBeCloseTo(28 * 1.25);
    });

    it('shifts for the rendered size, within the variant cap', () => {
      const fix = iosTextFix(
        { fontFamily: 'Intro-Regular', fontSize: 14 },
        3,
        1.6,
      );
      expect(fix?.transform).toEqual([
        { translateY: expect.closeTo(14 * 1.6 * 0.119, 5) },
      ]);
      // RN already scales lineHeight with the OS text size.
      expect(fix?.lineHeight).toBeCloseTo(14 * 1.25);
    });

    it('leaves system-font glyphs untouched', () => {
      expect(iosTextFix({ fontSize: 22 }, 1, 1.3)).toBeUndefined();
    });

    it('is applied on iOS and caller styles still win', () => {
      const { style } = render(<AppText variant="label">Bicho</AppText>);
      expect(style.lineHeight).toBeCloseTo(14 * 1.25);
      expect(style.transform).toHaveLength(1);

      const custom = render(
        <AppText variant="label" style={{ lineHeight: 30 }}>
          x
        </AppText>,
      ).style;
      expect(custom.lineHeight).toBe(30);
    });

    it('does nothing on Android, which already renders them centred', () => {
      const restore = jest.replaceProperty(Platform, 'OS', 'android');
      const { style } = render(<AppText variant="label">Bicho</AppText>);
      expect(style).not.toHaveProperty('lineHeight');
      expect(style).not.toHaveProperty('transform');
      restore.restore();
    });
  });
});
