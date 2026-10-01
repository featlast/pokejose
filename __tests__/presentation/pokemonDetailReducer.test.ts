import { toUserFacingError } from '../../src/core/errors';
import { DataOrigin } from '../../src/domain/enums';
import { ViewStatus } from '../../src/presentation/enums/ViewStatus.enum';
import {
  initialPokemonDetailState,
  pokemonDetailReducer,
} from '../../src/presentation/screens/PokemonDetail/pokemonDetailReducer';
import { bulbasaurDetail } from '../fixtures/pokemon.fixtures';

describe('pokemonDetailReducer', () => {
  it('starts in LOADING', () => {
    expect(initialPokemonDetailState.status).toBe(ViewStatus.LOADING);
  });

  it('stores the detail and flags stale data', () => {
    const state = pokemonDetailReducer(initialPokemonDetailState, {
      type: 'LOAD_SUCCESS',
      detail: bulbasaurDetail,
      origin: DataOrigin.STALE_CACHE,
    });
    expect(state.status).toBe(ViewStatus.SUCCESS);
    expect(state.detail).toBe(bulbasaurDetail);
    expect(state.isShowingOfflineData).toBe(true);
  });

  it('moves to ERROR and back to LOADING on retry', () => {
    const error = toUserFacingError(new TypeError('Network request failed'));
    const failed = pokemonDetailReducer(initialPokemonDetailState, {
      type: 'LOAD_FAILURE',
      error,
    });
    expect(failed).toMatchObject({ status: ViewStatus.ERROR, error });
    expect(pokemonDetailReducer(failed, { type: 'LOAD_START' })).toEqual(
      initialPokemonDetailState,
    );
  });
});
