import React, { memo, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Animated, StyleSheet, View } from 'react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { useTheme } from '../theme';

type ProgressiveImageProps = {
  uri: string;
  size: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
};

const FADE_MS = 220;

/**
 * Remote image that fades in once decoded and degrades to a neutral
 * silhouette when it cannot be loaded, so a broken URL never breaks a card.
 */
const ProgressiveImageComponent = ({
  uri,
  size,
  style,
  accessibilityLabel,
  testID,
}: ProgressiveImageProps) => {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const [failed, setFailed] = useState(false);

  const onLoad = () => {
    if (reduceMotion) {
      opacity.setValue(1);
      return;
    }
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View
      testID={testID}
      style={[{ width: size, height: size }, styles.center, style]}
      accessible={Boolean(accessibilityLabel)}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      {failed ? (
        <FallbackSilhouette
          size={size * 0.5}
          color={colors.textSecondary}
          testID={testID ? `${testID}-fallback` : 'image-fallback'}
        />
      ) : (
        <Animated.Image
          source={{ uri, cache: 'force-cache' }}
          style={{ width: size, height: size, opacity }}
          resizeMode="contain"
          // Android fades images in by default; we already do it on the native driver.
          fadeDuration={0}
          onLoad={onLoad}
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
};

export const ProgressiveImage = memo(ProgressiveImageComponent);

/** Neutral Poké Ball outline drawn with views, shown when an image cannot load. */
const FallbackSilhouette = ({
  size,
  color,
  testID,
}: {
  size: number;
  color: string;
  testID: string;
}) => {
  const stroke = Math.max(2, size * 0.07);
  const core = size * 0.3;
  return (
    <View
      testID={testID}
      style={[
        styles.center,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: color,
        },
        styles.silhouette,
      ]}
    >
      <View style={[styles.band, { height: stroke, backgroundColor: color }]} />
      <View
        style={{
          width: core,
          height: core,
          borderRadius: core / 2,
          borderWidth: stroke,
          borderColor: color,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  band: { position: 'absolute', left: 0, right: 0 },
  silhouette: { opacity: 0.5 },
});
