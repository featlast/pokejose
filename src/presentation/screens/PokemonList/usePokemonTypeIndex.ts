import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { PokemonTypeIndex } from '../../../domain/models';
import type { GetPokemonTypeIndexUseCase } from '../../../domain/usecases/GetPokemonTypeIndexUseCase';

/**
 * Loads the type index in the background. The list never waits for it: cards
 * render without a ribbon until it arrives. While it is missing it is retried
 * whenever `retryToken` changes (pull-to-refresh) or the app returns to the foreground.
 */
export const usePokemonTypeIndex = (
  getTypeIndex: GetPokemonTypeIndexUseCase,
  retryToken = 0,
): PokemonTypeIndex | null => {
  const [index, setIndex] = useState<PokemonTypeIndex | null>(null);
  const [foregroundAttempt, setForegroundAttempt] = useState(0);
  const hasIndex = useRef(false);

  useEffect(() => {
    if (hasIndex.current) {
      return;
    }
    let active = true;
    getTypeIndex
      .execute()
      .then(({ data }) => {
        if (active) {
          hasIndex.current = true;
          setIndex(data);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [getTypeIndex, retryToken, foregroundAttempt]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && !hasIndex.current) {
        setForegroundAttempt(attempt => attempt + 1);
      }
    });
    return () => subscription.remove();
  }, []);

  return index;
};
