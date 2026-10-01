import { useCallback, useEffect, useReducer, useRef } from 'react';
import { toUserFacingError } from '../../../core/errors';
import type { GetPokemonDetailUseCase } from '../../../domain/usecases/GetPokemonDetailUseCase';
import {
  initialPokemonDetailState,
  pokemonDetailReducer,
} from './pokemonDetailReducer';

/** View model for the detail screen; stale or post-unmount responses are dropped. */
export const usePokemonDetailViewModel = (
  getDetail: GetPokemonDetailUseCase,
  id: number,
) => {
  const [state, dispatch] = useReducer(
    pokemonDetailReducer,
    initialPokemonDetailState,
  );
  const generation = useRef(0);
  const isMounted = useRef(true);

  const load = useCallback(async () => {
    const requestGeneration = ++generation.current;
    const isCurrent = () =>
      isMounted.current && requestGeneration === generation.current;

    dispatch({ type: 'LOAD_START' });
    try {
      const { data, origin } = await getDetail.execute(id);
      if (isCurrent()) {
        dispatch({ type: 'LOAD_SUCCESS', detail: data, origin });
      }
    } catch (error) {
      if (isCurrent()) {
        dispatch({ type: 'LOAD_FAILURE', error: toUserFacingError(error) });
      }
    }
  }, [getDetail, id]);

  useEffect(() => {
    isMounted.current = true;
    load();
    return () => {
      isMounted.current = false;
    };
  }, [load]);

  return { state, retry: load };
};
