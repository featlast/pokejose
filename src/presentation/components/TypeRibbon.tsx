import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import type { PokemonType } from '../../domain/enums';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { TYPE_APPEARANCE } from '../theme';
import { AppText } from './AppText';

type TypeRibbonProps = {
  type: PokemonType;
  /** Width of the card it decorates; the ribbon scales with it. */
  cardWidth: number;
};

const FADE_MS = 250;

/**
 * Diagonal corner ribbon with the type's color and name. The parent card must
 * clip (`overflow: 'hidden'`). Decorative: the card's label already says the type.
 */
const TypeRibbonComponent = ({ type, cardWidth }: TypeRibbonProps) => {
  const { color, label } = TYPE_APPEARANCE[type];
  const reduceMotion = useReduceMotion();
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      return;
    }
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [opacity, reduceMotion]);

  // The band is centred on the corner's diagonal, `offset` away from both edges.
  const bandWidth = cardWidth * 0.7;
  const bandHeight = Math.max(18, cardWidth * 0.12);
  const offset = cardWidth * 0.16;

  return (
    <Animated.View
      testID={`type-ribbon-${type}`}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.band,
        {
          width: bandWidth,
          height: bandHeight,
          left: offset - bandWidth / 2,
          top: offset - bandHeight / 2,
          backgroundColor: color,
          opacity,
        },
      ]}
    >
      <AppText
        variant="caption"
        color="#FFFFFF"
        // Scales with the card; capped so the band never overflows with large OS text.
        maxFontSizeMultiplier={1.2}
        style={[styles.label, { fontSize: Math.max(9, cardWidth * 0.06) }]}
        numberOfLines={1}
      >
        {label.toUpperCase()}
      </AppText>
    </Animated.View>
  );
};

export const TypeRibbon = memo(TypeRibbonComponent);

const styles = StyleSheet.create({
  band: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-45deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  label: { letterSpacing: 0.5 },
});
