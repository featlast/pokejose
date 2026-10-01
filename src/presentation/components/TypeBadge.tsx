import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PokemonType } from '../../domain/enums';
import { TYPE_APPEARANCE, radius, spacing } from '../theme';
import { AppText } from './AppText';

type TypeBadgeProps = { type: PokemonType };

const TypeBadgeComponent = ({ type }: TypeBadgeProps) => {
  const { color, label } = TYPE_APPEARANCE[type];
  return (
    <View
      accessible
      accessibilityLabel={`Tipo ${label}`}
      style={[styles.badge, { backgroundColor: color }]}
    >
      <AppText variant="label" color="#FFFFFF">
        {label}
      </AppText>
    </View>
  );
};

export const TypeBadge = memo(TypeBadgeComponent);

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
});
