import {
  EvolutionTrigger,
  PokemonGender,
  PokemonType,
} from '../../domain/enums';
import type { EvolutionCondition } from '../../domain/models';
import { TYPE_APPEARANCE } from '../theme';
import { formatName } from './formatters';

/** One visual piece of a condition: optional symbol or coloured dot, then text. */
export type ConditionPart = { glyph?: string; dotColor?: string; text: string };

export type ConditionText = {
  parts: ConditionPart[];
  /** Same condition in words, for screen readers (NFR-503). */
  spoken: string;
};

/** Evolution items in Spanish (FR-505); the rest fall back to a readable name. */
const ITEM_NAMES: Record<string, string> = {
  'water-stone': 'Piedra Agua',
  'thunder-stone': 'Piedra Trueno',
  'fire-stone': 'Piedra Fuego',
  'leaf-stone': 'Piedra Hoja',
  'ice-stone': 'Piedra Hielo',
  'moon-stone': 'Piedra Lunar',
  'sun-stone': 'Piedra Solar',
  'shiny-stone': 'Piedra Día',
  'dusk-stone': 'Piedra Noche',
  'dawn-stone': 'Piedra Alba',
  'oval-stone': 'Piedra Oval',
  'kings-rock': 'Roca del Rey',
  'metal-coat': 'Revestimiento Metálico',
  'dragon-scale': 'Escama Dragón',
  'up-grade': 'Mejora',
  'dubious-disc': 'Disco Extraño',
  protector: 'Protector',
  electirizer: 'Electrizador',
  magmarizer: 'Magmatizador',
  'reaper-cloth': 'Tela Terrible',
  'prism-scale': 'Escama Bella',
  'deep-sea-tooth': 'Diente Marino',
  'deep-sea-scale': 'Escama Marina',
  'razor-claw': 'Garra Afilada',
  'razor-fang': 'Colmillo Agudo',
};

/** Elemental stones carry a dot in their type's colour. */
const STONE_TYPES: Record<string, PokemonType> = {
  'water-stone': PokemonType.WATER,
  'thunder-stone': PokemonType.ELECTRIC,
  'fire-stone': PokemonType.FIRE,
  'leaf-stone': PokemonType.GRASS,
  'ice-stone': PokemonType.ICE,
};

/**
 * U+FE0E asks for the text (monochrome) form: without it Android draws ♥ and ☀
 * as colour emoji.
 */
const TEXT_STYLE = '\uFE0E';
const GLYPHS = {
  trade: `⇄${TEXT_STYLE}`,
  friendship: `♥${TEXT_STYLE}`,
  day: `☀${TEXT_STYLE}`,
  night: `☾${TEXT_STYLE}`,
} as const;

export const itemName = (item: string): string =>
  ITEM_NAMES[item] ?? formatName(item);

const itemPart = (item: string): ConditionPart => {
  const stoneType = STONE_TYPES[item];
  return {
    text: itemName(item),
    dotColor: stoneType ? TYPE_APPEARANCE[stoneType].color : undefined,
  };
};

/**
 * Turns a raw condition into what the chip shows and what screen readers say,
 * e.g. level 16 → "Nv. 16" / "al nivel 16".
 */
export const describeEvolutionCondition = (
  condition: EvolutionCondition,
): ConditionText => {
  const parts: ConditionPart[] = [];
  const spoken: string[] = [];

  switch (condition.trigger) {
    case EvolutionTrigger.USE_ITEM:
      if (condition.item) {
        parts.push(itemPart(condition.item));
        spoken.push(`con ${itemName(condition.item)}`);
      }
      break;
    case EvolutionTrigger.TRADE:
      parts.push({
        glyph: GLYPHS.trade,
        text: condition.heldItem
          ? `Intercambio con ${itemName(condition.heldItem)}`
          : 'Intercambio',
      });
      spoken.push(
        condition.heldItem
          ? `por intercambio con ${itemName(condition.heldItem)}`
          : 'por intercambio',
      );
      break;
    case EvolutionTrigger.LEVEL_UP:
      if (condition.minLevel !== null) {
        parts.push({ text: `Nv. ${condition.minLevel}` });
        spoken.push(`al nivel ${condition.minLevel}`);
      }
      if (condition.heldItem) {
        parts.push(itemPart(condition.heldItem));
        spoken.push(`sosteniendo ${itemName(condition.heldItem)}`);
      }
      break;
    default:
      break;
  }

  if (condition.friendship) {
    parts.push({ glyph: GLYPHS.friendship, text: 'Amistad' });
    spoken.push('con amistad');
  }
  if (condition.knownMoveType) {
    const typeLabel = TYPE_APPEARANCE[condition.knownMoveType].label;
    parts.push({ text: `mov. ${typeLabel}` });
    spoken.push(`conociendo un movimiento de tipo ${typeLabel}`);
  }
  if (condition.timeOfDay) {
    const isDay = condition.timeOfDay === 'day';
    parts.push({
      glyph: isDay ? GLYPHS.day : GLYPHS.night,
      text: isDay ? 'Día' : 'Noche',
    });
    spoken.push(isDay ? 'de día' : 'de noche');
  }
  if (condition.gender) {
    const female = condition.gender === PokemonGender.FEMALE;
    parts.push({ text: female ? '♀' : '♂' });
    spoken.push(female ? 'si es hembra' : 'si es macho');
  }

  if (parts.length === 0) {
    const levelUp = condition.trigger === EvolutionTrigger.LEVEL_UP;
    const text = levelUp ? 'Subir de nivel' : 'Condición especial';
    return {
      parts: [{ text }],
      spoken: levelUp ? 'al subir de nivel' : 'con una condición especial',
    };
  }
  return { parts, spoken: spoken.join(' ') };
};
