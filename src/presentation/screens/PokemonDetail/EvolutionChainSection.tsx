import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type {
  EvolutionChain,
  EvolutionCondition,
  EvolutionNode,
} from '../../../domain/models';
import { AppText, Chevron, ProgressiveImage } from '../../components';
import { fontFamily, radius, spacing, useTheme } from '../../theme';
import { describeEvolutionCondition } from '../../utils/evolutionText';
import { evolutionLayout } from '../../utils/evolutionLayout';
import { formatName, formatPokedexNumber } from '../../utils/formatters';

type EvolutionChainSectionProps = {
  chain: EvolutionChain;
  /** Species on screen: ringed and not tappable (FR-507). */
  currentId: number;
  accentColor: string;
  onSelect: (node: EvolutionNode) => void;
};

const STAGE_WIDTH = 78;
const STAGE_ART = 68;
const BRANCH_ART = 48;
const NONE_ART = 64;
const RING_INSET = 5.5;

const ConditionChip = ({
  condition,
  muted,
}: {
  condition: EvolutionCondition;
  /** On a muted card the chip takes the surface colour to stand out. */
  muted?: boolean;
}) => {
  const { colors } = useTheme();
  const { parts } = describeEvolutionCondition(condition);
  return (
    <View
      style={[
        styles.condition,
        { backgroundColor: muted ? colors.surface : colors.surfaceMuted },
      ]}
    >
      {parts.map((part, index) => (
        <View key={index} style={styles.part}>
          {index > 0 ? (
            <AppText variant="caption" color={colors.textSecondary}>
              ·
            </AppText>
          ) : null}
          {part.dotColor ? (
            <View style={[styles.dot, { backgroundColor: part.dotColor }]} />
          ) : null}
          {part.glyph ? (
            <AppText variant="glyph" style={styles.glyph}>
              {part.glyph}
            </AppText>
          ) : null}
          <AppText variant="caption" maxFontSizeMultiplier={1.3}>
            {part.text}
          </AppText>
        </View>
      ))}
    </View>
  );
};

/** What screen readers say for a member (NFR-503). */
const memberLabel = (
  node: EvolutionNode,
  parent: EvolutionNode | null,
  isCurrent: boolean,
) => {
  const name = formatName(node.name);
  if (isCurrent) {
    return `${name}, estás viendo este Pokémon`;
  }
  if (!parent || !node.condition) {
    return `${name}, forma base`;
  }
  const { spoken } = describeEvolutionCondition(node.condition);
  return `${name}, evoluciona de ${formatName(parent.name)} ${spoken}`;
};

type MemberProps = {
  node: EvolutionNode;
  parent: EvolutionNode | null;
  isCurrent: boolean;
  accentColor: string;
  onSelect: (node: EvolutionNode) => void;
};

/** A stage of the linear part: artwork, name and number. */
const Stage = ({
  node,
  parent,
  isCurrent,
  accentColor,
  onSelect,
}: MemberProps) => {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={`evolution-${node.id}`}
      onPress={() => onSelect(node)}
      disabled={isCurrent}
      accessibilityRole={isCurrent ? undefined : 'button'}
      accessibilityLabel={memberLabel(node, parent, isCurrent)}
      style={({ pressed }) => [
        styles.stage,
        { transform: [{ scale: pressed ? 0.95 : 1 }] },
      ]}
    >
      <View style={styles.stageArtSlot}>
        {isCurrent ? (
          <View style={[styles.ring, { borderColor: accentColor }]} />
        ) : null}
        <View
          style={[styles.stageArt, { backgroundColor: colors.surfaceMuted }]}
        >
          <ProgressiveImage uri={node.imageUrl} size={STAGE_ART - 10} />
        </View>
      </View>
      <AppText
        variant="label"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={isCurrent ? styles.currentName : undefined}
      >
        {formatName(node.name)}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        {formatPokedexNumber(node.id)}
      </AppText>
    </Pressable>
  );
};

/** Arrow between two stages, with the condition above it. */
const Step = ({ condition }: { condition: EvolutionCondition | null }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.step}>
      {condition ? <ConditionChip condition={condition} /> : null}
      <View style={styles.arrow}>
        <View style={[styles.arrowLine, { backgroundColor: colors.border }]} />
        <Chevron
          direction="right"
          size={6}
          color={colors.textSecondary}
          strokeWidth={1.5}
        />
      </View>
    </View>
  );
};

/** A member after the split point (Eevee's evolutions), as a card. */
const BranchCard = ({
  node,
  parent,
  isCurrent,
  accentColor,
  onSelect,
  fromSplit,
}: MemberProps & { fromSplit: boolean }) => {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={`evolution-${node.id}`}
      onPress={() => onSelect(node)}
      disabled={isCurrent}
      accessibilityRole={isCurrent ? undefined : 'button'}
      accessibilityLabel={memberLabel(node, parent, isCurrent)}
      style={({ pressed }) => [
        styles.branch,
        {
          backgroundColor: colors.surfaceMuted,
          borderColor: isCurrent ? accentColor : 'transparent',
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <View style={styles.branchHead}>
        <View style={[styles.branchArt, { backgroundColor: colors.surface }]}>
          <ProgressiveImage uri={node.imageUrl} size={BRANCH_ART - 6} />
        </View>
        <View style={styles.branchText}>
          <AppText
            variant="label"
            numberOfLines={1}
            style={isCurrent ? styles.currentName : undefined}
          >
            {formatName(node.name)}
          </AppText>
          {!fromSplit && parent ? (
            <AppText variant="caption" color={colors.textSecondary}>
              de {formatName(parent.name)}
            </AppText>
          ) : null}
        </View>
      </View>
      {/* Below the head, the chip gets the card's full width and rarely wraps. */}
      {node.condition ? (
        <ConditionChip condition={node.condition} muted />
      ) : null}
    </Pressable>
  );
};

const EvolutionChainSectionComponent = ({
  chain,
  currentId,
  accentColor,
  onSelect,
}: EvolutionChainSectionProps) => {
  const { colors } = useTheme();
  const layout = useMemo(() => evolutionLayout(chain), [chain]);

  if (layout.kind === 'none') {
    const name = formatName(layout.root.name);
    return (
      <View testID="evolution-none" style={styles.none} accessible>
        <View
          style={[styles.noneArt, { backgroundColor: colors.surfaceMuted }]}
        >
          <ProgressiveImage uri={layout.root.imageUrl} size={NONE_ART - 10} />
        </View>
        <View style={styles.noneText}>
          <AppText variant="label" style={styles.currentName}>
            {name} no evoluciona
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            No tiene preevoluciones ni evoluciones.
          </AppText>
        </View>
      </View>
    );
  }

  const { stages } = layout;
  const split = stages[stages.length - 1];

  return (
    <View style={styles.container}>
      <View testID="evolution-stages" style={styles.stages}>
        {stages.map((node, index) => (
          <React.Fragment key={node.id}>
            {index > 0 ? <Step condition={node.condition} /> : null}
            <Stage
              node={node}
              parent={index > 0 ? stages[index - 1] : null}
              isCurrent={node.id === currentId}
              accentColor={accentColor}
              onSelect={onSelect}
            />
          </React.Fragment>
        ))}
      </View>
      {layout.kind === 'branched' ? (
        <>
          <View style={styles.fork}>
            <Chevron
              direction="down"
              size={6}
              color={colors.textSecondary}
              strokeWidth={1.5}
            />
            <AppText variant="caption" color={colors.textSecondary}>
              {formatName(split.name)} evoluciona en
            </AppText>
          </View>
          <View testID="evolution-branches" style={styles.branches}>
            {layout.branches.map(branch => (
              <BranchCard
                key={branch.node.id}
                node={branch.node}
                parent={branch.parent}
                fromSplit={branch.fromSplit}
                isCurrent={branch.node.id === currentId}
                accentColor={accentColor}
                onSelect={onSelect}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
};

export const EvolutionChainSection = memo(EvolutionChainSectionComponent);

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  stages: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  stage: { width: STAGE_WIDTH, alignItems: 'center', gap: 2 },
  stageArtSlot: {
    width: STAGE_ART + 2 * RING_INSET,
    height: STAGE_ART + 2 * RING_INSET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: STAGE_ART + 2 * RING_INSET,
    height: STAGE_ART + 2 * RING_INSET,
    borderRadius: (STAGE_ART + 2 * RING_INSET) / 2,
    borderWidth: 2.5,
  },
  stageArt: {
    width: STAGE_ART,
    height: STAGE_ART,
    borderRadius: STAGE_ART / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentName: { fontFamily: fontFamily.display },
  step: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.lg,
  },
  arrow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  arrowLine: { flex: 1, height: 1.5, marginRight: -4 },
  condition: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: spacing.xs,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  part: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  glyph: { fontSize: 11 },
  fork: { alignItems: 'center', gap: 2 },
  branches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  branch: {
    width: '48.5%',
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    padding: spacing.xs + 2,
  },
  branchArt: {
    width: BRANCH_ART,
    height: BRANCH_ART,
    borderRadius: BRANCH_ART / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  branchText: { flex: 1, minWidth: 0, gap: 2 },
  none: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  noneArt: {
    width: NONE_ART,
    height: NONE_ART,
    borderRadius: NONE_ART / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noneText: { flex: 1, gap: 2 },
});
