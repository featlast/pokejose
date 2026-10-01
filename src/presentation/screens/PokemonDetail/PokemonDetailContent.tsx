import React from 'react';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PokemonDetail } from '../../../domain/models';
import { AppText, StatBar } from '../../components';
import { radius, spacing, useTheme } from '../../theme';
import { formatHeight, formatName, formatWeight } from '../../utils/formatters';

type PokemonDetailContentProps = { detail: PokemonDetail; accentColor: string };

const Section = ({ title, children }: PropsWithChildren<{ title: string }>) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
};

const InfoTile = ({ label, value }: { label: string; value: string }) => {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.tile, { backgroundColor: colors.surfaceMuted }]}
    >
      <AppText variant="value">{value}</AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
};

export const PokemonDetailContent = ({
  detail,
  accentColor,
}: PokemonDetailContentProps) => {
  const { colors } = useTheme();
  const totalStats = detail.stats.reduce(
    (sum, stat) => sum + stat.baseValue,
    0,
  );

  return (
    <View style={styles.container} testID="pokemon-detail-content">
      <Section title="Información">
        <View style={styles.tiles}>
          <InfoTile label="Peso" value={formatWeight(detail.weightKg)} />
          <InfoTile label="Altura" value={formatHeight(detail.heightM)} />
          <InfoTile
            label="Exp. base"
            value={detail.baseExperience?.toString() ?? '—'}
          />
        </View>
      </Section>

      <Section title="Habilidades">
        <View style={styles.chips}>
          {detail.abilities.map(ability => (
            <View
              key={ability.name}
              accessible
              accessibilityLabel={`${formatName(ability.name)}${
                ability.isHidden ? ', habilidad oculta' : ''
              }`}
              style={[
                styles.chip,
                {
                  borderColor: accentColor,
                  backgroundColor: colors.surfaceMuted,
                },
              ]}
            >
              <AppText variant="label">{formatName(ability.name)}</AppText>
              {ability.isHidden ? (
                <AppText variant="caption" color={colors.textSecondary}>
                  oculta
                </AppText>
              ) : null}
            </View>
          ))}
        </View>
      </Section>

      <Section title="Estadísticas base">
        <View style={styles.stats}>
          {detail.stats.map(stat => (
            <StatBar key={stat.name} stat={stat} color={accentColor} />
          ))}
          <View
            accessible
            accessibilityLabel={`Total: ${totalStats}`}
            style={[styles.total, { borderTopColor: colors.border }]}
          >
            <AppText variant="caption" color={colors.textSecondary}>
              TOTAL
            </AppText>
            <AppText variant="label">{totalStats}</AppText>
          </View>
        </View>
      </Section>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  section: { borderRadius: radius.md, padding: spacing.lg, gap: spacing.md },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  stats: { gap: spacing.xs },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
});
