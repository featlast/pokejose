import { DataOrigin } from '../../../domain/enums';
import { ViewStatus } from '../../enums/ViewStatus.enum';
import type {
  PokemonDetailAction,
  PokemonDetailState,
} from './PokemonDetail.types';

export const initialPokemonDetailState: PokemonDetailState = {
  status: ViewStatus.LOADING,
  detail: null,
  error: null,
  isShowingOfflineData: false,
};

export const pokemonDetailReducer = (
  state: PokemonDetailState,
  action: PokemonDetailAction,
): PokemonDetailState => {
  switch (action.type) {
    case 'LOAD_START':
      return initialPokemonDetailState;
    case 'LOAD_SUCCESS':
      return {
        status: ViewStatus.SUCCESS,
        detail: action.detail,
        error: null,
        isShowingOfflineData: action.origin === DataOrigin.STALE_CACHE,
      };
    case 'LOAD_FAILURE':
      return {
        ...initialPokemonDetailState,
        status: ViewStatus.ERROR,
        error: action.error,
      };
    default:
      return state;
  }
};
