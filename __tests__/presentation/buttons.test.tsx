import React from 'react';
import { StyleSheet, View } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { Chevron } from '../../src/presentation/components/Chevron';
import {
  CircleButton,
  brandButtonColors,
} from '../../src/presentation/components/CircleButton';
import { darkColors, lightColors } from '../../src/presentation/theme';

const render = (element: React.ReactElement) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(element);
  });
  return renderer;
};

/** The Pressable: the node with the testID whose style is a function of `pressed`. */
const button = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(
    node =>
      node.props.testID === 'btn' && typeof node.props.style === 'function',
  )[0];

const pressableStyle = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  pressed = false,
) => {
  const { style } = button(renderer).props;
  return StyleSheet.flatten(
    typeof style === 'function' ? style({ pressed }) : style,
  );
};

describe('Chevron', () => {
  it.each([
    ['left', '-45deg'],
    ['up', '45deg'],
    ['right', '135deg'],
    ['down', '-135deg'],
  ] as const)('points %s', (direction, rotation) => {
    const renderer = render(<Chevron direction={direction} color="#000" />);
    const { transform } = StyleSheet.flatten(
      renderer.root.findByType(View).props.style,
    );
    expect(transform).toContainEqual({ rotate: rotation });
  });
});

describe('CircleButton', () => {
  it('keeps a 48 pt touch target even when drawn smaller', () => {
    const renderer = render(
      <CircleButton
        testID="btn"
        variant="translucent"
        size={40}
        onPress={jest.fn()}
      >
        <View />
      </CircleButton>,
    );
    expect(button(renderer).props.hitSlop).toBe(4);
  });

  it('draws a round surface with a cross-platform shadow', () => {
    const translucent = pressableStyle(
      render(
        <CircleButton testID="btn" variant="translucent" size={40}>
          <View />
        </CircleButton>,
      ),
    );
    expect(translucent).toMatchObject({ width: 40, borderRadius: 20 });
    expect(translucent.boxShadow).toEqual(expect.any(String));
    expect(translucent.borderWidth).toBeGreaterThan(0);

    const elevated = pressableStyle(
      render(
        <CircleButton testID="btn" variant="elevated" size={52}>
          <View />
        </CircleButton>,
      ),
    );
    expect(elevated).toMatchObject({ width: 52, borderRadius: 26 });
    expect(elevated.boxShadow).toEqual(expect.any(String));
  });

  it('uses the header brand color for the brand variant', () => {
    const style = pressableStyle(
      render(
        <CircleButton testID="btn" variant="brand" size={52}>
          <View />
        </CircleButton>,
      ),
    );
    expect(style).toMatchObject({
      backgroundColor: lightColors.primary,
      borderRadius: 26,
    });
    expect(style.boxShadow).toEqual(expect.any(String));
  });

  it('brand is red with a white icon on light themes and white with a red icon on dark ones', () => {
    expect(brandButtonColors({ isDark: false, colors: lightColors })).toEqual({
      fill: lightColors.primary,
      content: lightColors.onPrimary,
    });
    expect(brandButtonColors({ isDark: true, colors: darkColors })).toEqual({
      fill: '#FFFFFF',
      content: darkColors.primary,
    });
  });

  it('shrinks slightly while pressed', () => {
    const style = pressableStyle(
      render(
        <CircleButton testID="btn" variant="elevated">
          <View />
        </CircleButton>,
      ),
      true,
    );
    expect(style.transform).toContainEqual({ scale: 0.92 });
  });
});
