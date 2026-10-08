import type {
  GetFavoritesUseCase,
  RestoreFavoriteUseCase,
  ToggleFavoriteUseCase,
} from '../domain/usecases/FavoritesUseCases';
import type { GetEvolutionChainUseCase } from '../domain/usecases/GetEvolutionChainUseCase';
import type { GetPokemonDetailUseCase } from '../domain/usecases/GetPokemonDetailUseCase';
import type { GetPokemonPageUseCase } from '../domain/usecases/GetPokemonPageUseCase';
import type { GetPokemonTypeIndexUseCase } from '../domain/usecases/GetPokemonTypeIndexUseCase';
import type { GetTypeMatchupsUseCase } from '../domain/usecases/GetTypeMatchupsUseCase';
import type { SearchPokemonUseCase } from '../domain/usecases/SearchPokemonUseCase';

/** What the presentation layer is allowed to depend on: use cases only. */
export type AppDependencies = {
  getPokemonPage: GetPokemonPageUseCase;
  getPokemonDetail: GetPokemonDetailUseCase;
  getTypeIndex: GetPokemonTypeIndexUseCase;
  getTypeMatchups: GetTypeMatchupsUseCase;
  getEvolutionChain: GetEvolutionChainUseCase;
  searchPokemon: SearchPokemonUseCase;
  getFavorites: GetFavoritesUseCase;
  toggleFavorite: ToggleFavoriteUseCase;
  restoreFavorite: RestoreFavoriteUseCase;
};
