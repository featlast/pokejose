import type { GetPokemonDetailUseCase } from '../domain/usecases/GetPokemonDetailUseCase';
import type { GetPokemonPageUseCase } from '../domain/usecases/GetPokemonPageUseCase';
import type { GetPokemonTypeIndexUseCase } from '../domain/usecases/GetPokemonTypeIndexUseCase';
import type { SearchPokemonUseCase } from '../domain/usecases/SearchPokemonUseCase';

/** What the presentation layer is allowed to depend on: use cases only. */
export type AppDependencies = {
  getPokemonPage: GetPokemonPageUseCase;
  getPokemonDetail: GetPokemonDetailUseCase;
  getTypeIndex: GetPokemonTypeIndexUseCase;
  searchPokemon: SearchPokemonUseCase;
};
