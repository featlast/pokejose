import { pokemonImageSharedKey } from '../components/sharedElementKeys';
import type { ScreenRegistry, SharedElementConfig } from '../navigation';
import { PokemonDetailScreen } from './PokemonDetail/PokemonDetailScreen';
import { PokemonListScreen } from './PokemonList/PokemonListScreen';

export const screens: ScreenRegistry = {
  PokemonList: PokemonListScreen,
  PokemonDetail: PokemonDetailScreen,
};

/** The detail opens with its artwork flying from the tapped card. */
export const sharedElements: SharedElementConfig = {
  PokemonDetail: route => ({
    key: pokemonImageSharedKey(route.params.id),
    uri: route.params.imageUrl,
  }),
};
