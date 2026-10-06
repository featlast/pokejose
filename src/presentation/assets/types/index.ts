/**
 * Type filter icons (FR-301): white on transparent, drawn for this app.
 * The Pokéball of "Todos" keeps its own colours.
 */
import type { ImageSourcePropType } from 'react-native';
import { PokemonType } from '../../../domain/enums';
import all from './all.png';
import normal from './normal.png';
import fire from './fire.png';
import water from './water.png';
import electric from './electric.png';
import grass from './grass.png';
import ice from './ice.png';
import fighting from './fighting.png';
import poison from './poison.png';
import ground from './ground.png';
import flying from './flying.png';
import psychic from './psychic.png';
import bug from './bug.png';
import rock from './rock.png';
import ghost from './ghost.png';
import dragon from './dragon.png';
import dark from './dark.png';
import steel from './steel.png';
import fairy from './fairy.png';

export const allTypesIcon: ImageSourcePropType = all;

/** Icons of the 18 playable types; Astral and Desconocido have none. */
export const typeIcons: Partial<Record<PokemonType, ImageSourcePropType>> = {
  [PokemonType.NORMAL]: normal,
  [PokemonType.FIRE]: fire,
  [PokemonType.WATER]: water,
  [PokemonType.ELECTRIC]: electric,
  [PokemonType.GRASS]: grass,
  [PokemonType.ICE]: ice,
  [PokemonType.FIGHTING]: fighting,
  [PokemonType.POISON]: poison,
  [PokemonType.GROUND]: ground,
  [PokemonType.FLYING]: flying,
  [PokemonType.PSYCHIC]: psychic,
  [PokemonType.BUG]: bug,
  [PokemonType.ROCK]: rock,
  [PokemonType.GHOST]: ghost,
  [PokemonType.DRAGON]: dragon,
  [PokemonType.DARK]: dark,
  [PokemonType.STEEL]: steel,
  [PokemonType.FAIRY]: fairy,
};
