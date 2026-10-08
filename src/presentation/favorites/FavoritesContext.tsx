import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { useDependencies } from '../../di/DependenciesContext';
import type { PokemonSummary } from '../../domain/models';
import { isFavorite as isInFavorites } from '../../domain/usecases/FavoritesUseCases';
import { Snackbar } from '../components/Snackbar';
import { formatName } from '../utils/formatters';

type FavoritesContextValue = {
  /** Most recently added first. */
  favorites: PokemonSummary[];
  isFavorite: (id: number) => boolean;
  toggle: (pokemon: PokemonSummary) => void;
};

type Notice = { message: string; undo?: () => void };

export const SNACKBAR_MS = 3200;

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/**
 * Favorites shared by every screen (FR-609), plus the snackbar that confirms
 * each change and offers undo (FR-605). Changes run one after another so fast
 * taps never overwrite each other.
 */
export const FavoritesProvider = ({ children }: PropsWithChildren) => {
  const { getFavorites, toggleFavorite, restoreFavorite } = useDependencies();
  const [favorites, setFavorites] = useState<PokemonSummary[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    let active = true;
    getFavorites
      .execute()
      .then(list => active && setFavorites(list))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [getFavorites]);

  useEffect(() => {
    if (!notice) {
      return;
    }
    AccessibilityInfo.announceForAccessibility(notice.message);
    const timer = setTimeout(() => setNotice(null), SNACKBAR_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const enqueue = useCallback((task: () => Promise<void>) => {
    queue.current = queue.current.then(task).catch(() =>
      setNotice({
        message: 'No pudimos guardar tus favoritos. Inténtalo de nuevo.',
      }),
    );
  }, []);

  const toggle = useCallback(
    (pokemon: PokemonSummary) =>
      enqueue(async () => {
        const result = await toggleFavorite.execute(pokemon);
        setFavorites(result.favorites);
        const name = formatName(pokemon.name);
        if (result.added) {
          setNotice({ message: `${name} se guardó en favoritos` });
          return;
        }
        setNotice({
          message: `Se quitó ${name} de favoritos`,
          undo: () => {
            setNotice(null);
            enqueue(async () =>
              setFavorites(
                await restoreFavorite.execute(pokemon, result.previousIndex),
              ),
            );
          },
        });
      }),
    [enqueue, toggleFavorite, restoreFavorite],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      isFavorite: (id: number) => isInFavorites(favorites, id),
      toggle,
    }),
    [favorites, toggle],
  );

  return (
    <FavoritesContext.Provider value={value}>
      <View style={styles.fill}>
        {children}
        <Snackbar
          message={notice?.message ?? null}
          actionLabel={notice?.undo ? 'Deshacer' : undefined}
          onAction={notice?.undo}
        />
      </View>
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextValue => {
  const value = useContext(FavoritesContext);
  if (!value) {
    throw new Error('useFavorites must be used inside <FavoritesProvider>');
  }
  return value;
};

const styles = StyleSheet.create({ fill: { flex: 1 } });
