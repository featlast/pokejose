import {
  EvolutionTrigger,
  PokemonGender,
  PokemonType,
} from '../../src/domain/enums';
import type {
  EvolutionCondition,
  EvolutionNode,
} from '../../src/domain/models';
import { TYPE_APPEARANCE } from '../../src/presentation/theme';
import { evolutionLayout } from '../../src/presentation/utils/evolutionLayout';
import {
  describeEvolutionCondition,
  itemName,
} from '../../src/presentation/utils/evolutionText';

const condition = (
  overrides: Partial<EvolutionCondition> = {},
): EvolutionCondition => ({
  trigger: EvolutionTrigger.LEVEL_UP,
  minLevel: null,
  item: null,
  heldItem: null,
  friendship: false,
  timeOfDay: null,
  knownMoveType: null,
  gender: null,
  ...overrides,
});

const node = (
  id: number,
  evolvesTo: EvolutionNode[] = [],
  cond: EvolutionCondition | null = condition({ minLevel: 10 }),
): EvolutionNode => ({
  id,
  name: `p${id}`,
  imageUrl: `${id}.png`,
  condition: cond,
  evolvesTo,
});

/** Glyphs without the text-presentation selector, to keep expectations readable. */
const text = (c: EvolutionCondition) =>
  describeEvolutionCondition(c)
    .parts.map(part => `${part.glyph?.replace('\uFE0E', '') ?? ''}${part.text}`)
    .join(' · ');

describe('describeEvolutionCondition', () => {
  it('reads levels, stones, friendship, time and moves', () => {
    expect(text(condition({ minLevel: 16 }))).toBe('Nv. 16');
    expect(
      text(
        condition({ trigger: EvolutionTrigger.USE_ITEM, item: 'water-stone' }),
      ),
    ).toBe('Piedra Agua');
    expect(text(condition({ friendship: true, timeOfDay: 'night' }))).toBe(
      '♥Amistad · ☾Noche',
    );
    expect(
      text(condition({ friendship: true, knownMoveType: PokemonType.FAIRY })),
    ).toBe('♥Amistad · mov. Hada');
  });

  it('asks for the monochrome form of symbols', () => {
    const { parts } = describeEvolutionCondition(
      condition({ friendship: true }),
    );
    expect(parts[0].glyph).toBe('♥\uFE0E');
  });

  it('colours elemental stones with their type', () => {
    const { parts } = describeEvolutionCondition(
      condition({ trigger: EvolutionTrigger.USE_ITEM, item: 'fire-stone' }),
    );
    expect(parts[0].dotColor).toBe(TYPE_APPEARANCE[PokemonType.FIRE].color);
  });

  it('reads trades, held items and gender', () => {
    expect(text(condition({ trigger: EvolutionTrigger.TRADE }))).toBe(
      '⇄Intercambio',
    );
    expect(
      text(
        condition({ trigger: EvolutionTrigger.TRADE, heldItem: 'metal-coat' }),
      ),
    ).toBe('⇄Intercambio con Revestimiento Metálico');
    expect(
      text(condition({ minLevel: 20, gender: PokemonGender.FEMALE })),
    ).toBe('Nv. 20 · ♀');
  });

  it('falls back for bare level ups and special triggers', () => {
    expect(text(condition())).toBe('Subir de nivel');
    expect(text(condition({ trigger: EvolutionTrigger.OTHER }))).toBe(
      'Condición especial',
    );
  });

  it('says the condition in words for screen readers', () => {
    expect(
      describeEvolutionCondition(
        condition({ friendship: true, timeOfDay: 'day' }),
      ).spoken,
    ).toBe('con amistad de día');
    expect(describeEvolutionCondition(condition({ minLevel: 16 })).spoken).toBe(
      'al nivel 16',
    );
  });

  it('formats items without a translation', () => {
    expect(itemName('galarica-cuff')).toBe('Galarica Cuff');
  });
});

describe('evolutionLayout', () => {
  it('shows a single Pokémon as not evolving (Tauros)', () => {
    const root = node(128, [], null);
    expect(evolutionLayout({ id: 63, root })).toEqual({ kind: 'none', root });
  });

  it('puts linear chains in one row (Charmander)', () => {
    const layout = evolutionLayout({
      id: 2,
      root: node(4, [node(5, [node(6)])], null),
    });
    expect(layout.kind).toBe('linear');
    expect(
      layout.kind === 'linear' && layout.stages.map(stage => stage.id),
    ).toEqual([4, 5, 6]);
  });

  it('splits after the linear start (Oddish → Gloom → two branches)', () => {
    const layout = evolutionLayout({
      id: 18,
      root: node(43, [node(44, [node(45), node(182)])], null),
    });
    expect(layout.kind).toBe('branched');
    if (layout.kind !== 'branched') {
      return;
    }
    expect(layout.stages.map(stage => stage.id)).toEqual([43, 44]);
    expect(layout.branches.map(branch => branch.node.id)).toEqual([45, 182]);
    expect(layout.branches.every(branch => branch.fromSplit)).toBe(true);
  });

  it('keeps deeper members with their parent (Wurmple)', () => {
    const layout = evolutionLayout({
      id: 135,
      root: node(265, [node(266, [node(267)]), node(268, [node(269)])], null),
    });
    if (layout.kind !== 'branched') {
      throw new Error('expected a branched layout');
    }
    expect(
      layout.branches.map(
        branch => `${branch.node.id}<${branch.parent.id}:${branch.fromSplit}`,
      ),
    ).toEqual([
      '266<265:true',
      '267<266:false',
      '268<265:true',
      '269<268:false',
    ]);
  });
});
