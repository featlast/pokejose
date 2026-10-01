import { PokemonType } from '../../domain/enums';

type TypeAppearance = { color: string; label: string };

/** Type palette tuned so white text on every background reaches WCAG AA (≥ 4.5:1). */
export const TYPE_APPEARANCE: Record<PokemonType, TypeAppearance> = {
  [PokemonType.NORMAL]: { color: '#6B6B4A', label: 'Normal' },
  [PokemonType.FIRE]: { color: '#C4501B', label: 'Fuego' },
  [PokemonType.WATER]: { color: '#3B6FD8', label: 'Agua' },
  [PokemonType.ELECTRIC]: { color: '#806600', label: 'Eléctrico' },
  [PokemonType.GRASS]: { color: '#3F7F22', label: 'Planta' },
  [PokemonType.ICE]: { color: '#2A7F7B', label: 'Hielo' },
  [PokemonType.FIGHTING]: { color: '#A3261F', label: 'Lucha' },
  [PokemonType.POISON]: { color: '#8A3B8A', label: 'Veneno' },
  [PokemonType.GROUND]: { color: '#8C6A26', label: 'Tierra' },
  [PokemonType.FLYING]: { color: '#6D5CC4', label: 'Volador' },
  [PokemonType.PSYCHIC]: { color: '#C73864', label: 'Psíquico' },
  [PokemonType.BUG]: { color: '#6B7A12', label: 'Bicho' },
  [PokemonType.ROCK]: { color: '#8A7524', label: 'Roca' },
  [PokemonType.GHOST]: { color: '#5A4682', label: 'Fantasma' },
  [PokemonType.DRAGON]: { color: '#5B2CE0', label: 'Dragón' },
  [PokemonType.DARK]: { color: '#5A4638', label: 'Siniestro' },
  [PokemonType.STEEL]: { color: '#6B6B85', label: 'Acero' },
  [PokemonType.FAIRY]: { color: '#B5487A', label: 'Hada' },
  [PokemonType.STELLAR]: { color: '#2F6A86', label: 'Astral' },
  [PokemonType.UNKNOWN]: { color: '#5E6B6B', label: 'Desconocido' },
};
