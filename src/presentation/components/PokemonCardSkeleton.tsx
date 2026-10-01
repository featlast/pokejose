import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, spacing, useTheme } from '../theme';
import { POKEMON_CARD_HEIGHT_RATIO } from './PokemonCard';
import { Skeleton } from './Skeleton';

type PokemonCardSkeletonProps = { width: number };

const PokemonCardSkeletonComponent = ({ width }: PokemonCardSkeletonProps) => {
  const { colors } = useTheme();
  const imageSize = width * 0.7;
  return (
    <View
      style={[
        styles.card,
        {
          width,
          height: width * POKEMON_CARD_HEIGHT_RATIO,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Skeleton style={styles.number} />
      <Skeleton
        style={{
          width: imageSize,
          height: imageSize,
          borderRadius: radius.pill,
        }}
      />
      <Skeleton style={styles.name} />
    </View>
  );
};

export const PokemonCardSkeleton = memo(PokemonCardSkeletonComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  number: { width: 36, height: 12, borderRadius: 4, alignSelf: 'flex-end' },
  name: { width: '70%', height: 14, borderRadius: 4 },
});
