import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { FlatList, ListRenderItem, ListViewToken } from 'react-native';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useDependencies } from '../../../di/DependenciesContext';
import type { PokemonSummary, PokemonTypeIndex } from '../../../domain/models';
import { primaryTypeOf } from '../../../domain/usecases/GetPokemonTypeIndexUseCase';
import {
  HEADER_ICON_SLOT,
  AppText,
  Banner,
  CollapsingHeader,
  PokemonCard,
  PokemonCardSkeleton,
  ScrollToTopButton,
  SearchBar,
  StateMessage,
  ThemeToggle,
} from '../../components';
import { POKEMON_CARD_HEIGHT_RATIO } from '../../components/PokemonCard';
import { SearchStatus } from '../../enums/SearchStatus.enum';
import { ViewStatus } from '../../enums/ViewStatus.enum';
import { useSafeAreaInsets } from '../../hooks/SafeArea';
import {
  useCollapsingHeaderLayout,
  useHeaderScroll,
} from '../../hooks/useCollapsingHeader';
import {
  GRID_GAP,
  GRID_PADDING,
  useGridLayout,
} from '../../hooks/useGridLayout';
import { useMinimumDuration } from '../../hooks/useMinimumDuration';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { useSkeletonCount } from '../../hooks/useSkeletonCount';
import { useSharedElementVisibleTop } from '../../sharedElement/SharedElementContext';
import type { ScreenProps } from '../../navigation';
import { MIN_TOUCH_TARGET, spacing, useTheme } from '../../theme';
import { usePokemonListViewModel } from './usePokemonListViewModel';
import { usePokemonSearch } from './usePokemonSearch';
import { usePokemonTypeIndex } from './usePokemonTypeIndex';
import { noResultsMessage } from './searchMessages';

const isIOS = Platform.OS === 'ios';
const keyExtractor = (item: PokemonSummary) => String(item.id);
/** Start prefetching the next page when this many items remain below the viewport. */
const PREFETCH_DISTANCE = 10;
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 10 };
const SEARCH_COLLAPSE_MS = 200;

type GridProps = {
  data: PokemonSummary[];
  columns: number;
  itemWidth: number;
  typeIndex: PokemonTypeIndex | null;
  onPressItem: (pokemon: PokemonSummary) => void;
  listRef?: React.Ref<FlatList<PokemonSummary>>;
} & Omit<
  React.ComponentProps<typeof Animated.FlatList<PokemonSummary>>,
  'data' | 'renderItem' | 'numColumns'
>;

/** Responsive, virtualized grid of cards shared by the paged list and search results. */
const PokemonGrid = ({
  data,
  columns,
  itemWidth,
  typeIndex,
  onPressItem,
  listRef,
  ...listProps
}: GridProps) => {
  const renderItem = useCallback<ListRenderItem<PokemonSummary>>(
    ({ item }) => (
      <PokemonCard
        pokemon={item}
        width={itemWidth}
        onPress={onPressItem}
        primaryType={primaryTypeOf(typeIndex, item.id)}
      />
    ),
    [itemWidth, onPressItem, typeIndex],
  );

  return (
    <Animated.FlatList
      ref={listRef}
      key={`grid-${columns}`}
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      numColumns={columns}
      columnWrapperStyle={columns > 1 ? styles.row : undefined}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={7}
      removeClippedSubviews
      {...listProps}
    />
  );
};

export const PokemonListScreen = ({
  navigation,
}: ScreenProps<'PokemonList'>) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { getPokemonPage, getTypeIndex, searchPokemon } = useDependencies();
  const { state, retry, refresh, loadMore, prefetchNext } =
    usePokemonListViewModel(getPokemonPage);
  const [refreshCount, setRefreshCount] = useState(0);
  const typeIndex = usePokemonTypeIndex(getTypeIndex, refreshCount);
  const onRefresh = useCallback(() => {
    // Pull-to-refresh also retries the type index if it is still missing.
    setRefreshCount(count => count + 1);
    refresh();
  }, [refresh]);
  const search = usePokemonSearch(searchPokemon);
  const { columns, itemWidth } = useGridLayout();
  const { expandedHeight, collapseDistance } = useCollapsingHeaderLayout();

  const collapsedHeight = expandedHeight - collapseDistance;
  // Cards above the compact header's bottom may be under the header: never fly back there.
  useSharedElementVisibleTop(collapsedHeight);
  const reduceMotion = useReduceMotion();
  const pagedScroll = useHeaderScroll(expandedHeight);
  // Results sit under the compact header: searching always collapses the title.
  const searchScroll = useHeaderScroll(collapsedHeight);
  const searchCollapse = useRef(new Animated.Value(0)).current;
  const headerOffset = useMemo(
    () =>
      Animated.add(
        Animated.add(pagedScroll.offset, searchScroll.offset),
        searchCollapse,
      ),
    [pagedScroll.offset, searchScroll.offset, searchCollapse],
  );

  const isSearching = search.state.status !== SearchStatus.IDLE;

  // FR-220: one "back to top" state per list; the button follows the visible one.
  const pagedTop = useScrollToTop({ scrollY: pagedScroll.scrollY });
  const searchTop = useScrollToTop({ scrollY: searchScroll.scrollY });
  const activeTop = isSearching ? searchTop : pagedTop;
  const { reset: resetSearchScroll } = searchScroll;
  useEffect(() => {
    const toValue = isSearching ? collapseDistance : 0;
    if (!isSearching) {
      resetSearchScroll();
    }
    if (reduceMotion) {
      searchCollapse.setValue(toValue);
      return;
    }
    Animated.timing(searchCollapse, {
      toValue,
      duration: SEARCH_COLLAPSE_MS,
      useNativeDriver: true,
    }).start();
  }, [
    isSearching,
    collapseDistance,
    reduceMotion,
    resetSearchScroll,
    searchCollapse,
  ]);

  // A new column count remounts the grid at its top; the header must follow.
  const { reset: resetPagedScroll } = pagedScroll;
  useEffect(() => {
    resetPagedScroll();
    resetSearchScroll();
  }, [columns, resetPagedScroll, resetSearchScroll]);

  const showSkeleton = useMinimumDuration(state.status === ViewStatus.LOADING);
  const skeletonCount = useSkeletonCount({
    itemHeight: itemWidth * POKEMON_CARD_HEIGHT_RATIO,
    gap: GRID_GAP,
    columns,
    offsetTop: expandedHeight,
  });

  const openDetail = useCallback(
    (pokemon: PokemonSummary) =>
      navigation.navigate('PokemonDetail', {
        id: pokemon.id,
        name: pokemon.name,
        imageUrl: pokemon.imageUrl,
      }),
    [navigation],
  );

  // FlatList requires a stable `onViewableItemsChanged`; it reads the latest values via refs.
  const itemCountRef = useRef(state.items.length);
  itemCountRef.current = state.items.length;
  const prefetchNextRef = useRef(prefetchNext);
  prefetchNextRef.current = prefetchNext;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
      const lastVisible = Math.max(
        -1,
        ...viewableItems.map(token => token.index ?? -1),
      );
      if (lastVisible >= itemCountRef.current - PREFETCH_DISTANCE) {
        prefetchNextRef.current();
      }
    },
  ).current;

  const gridPadding = useMemo(
    () => ({
      paddingLeft: insets.left + GRID_PADDING,
      paddingRight: insets.right + GRID_PADDING,
    }),
    [insets.left, insets.right],
  );
  const contentStyleFor = useCallback(
    (paddingTop: number) => [
      styles.content,
      gridPadding,
      {
        paddingTop: paddingTop + GRID_PADDING,
        paddingBottom: insets.bottom + spacing.xl,
      },
    ],
    [gridPadding, insets.bottom],
  );
  // Stable identities: a new style or footer on every keystroke re-renders/remounts list parts.
  const pagedContentStyle = useMemo(
    () => contentStyleFor(pagedScroll.contentPaddingTop),
    [contentStyleFor, pagedScroll.contentPaddingTop],
  );
  const searchContentStyle = useMemo(
    () => contentStyleFor(searchScroll.contentPaddingTop),
    [contentStyleFor, searchScroll.contentPaddingTop],
  );

  const subtitle = isSearching
    ? search.state.status === SearchStatus.RESULTS
      ? `${search.state.results.length} resultados`
      : undefined
    : state.totalCount > 0
    ? `${state.items.length} de ${state.totalCount} Pokémon`
    : undefined;

  const { isLoadingMore, loadMoreError } = state;
  const footer = useMemo(() => {
    if (isLoadingMore) {
      return (
        <ActivityIndicator
          style={styles.footer}
          color={colors.primary}
          accessibilityLabel="Cargando más Pokémon"
        />
      );
    }
    if (loadMoreError) {
      return (
        <Pressable
          testID="load-more-retry"
          onPress={loadMore}
          accessibilityRole="button"
          style={styles.footerButton}
        >
          <AppText
            variant="label"
            color={colors.primary}
            style={styles.footerText}
          >
            {loadMoreError.title}. Toca para reintentar
          </AppText>
        </Pressable>
      );
    }
    return null;
  }, [isLoadingMore, loadMoreError, loadMore, colors.primary]);

  /** Non-list states are offset so the header never covers them. */
  const underHeader = (
    content: React.ReactNode,
    headerHeight = expandedHeight,
  ) => (
    <View style={[styles.fill, { paddingTop: headerHeight }]}>{content}</View>
  );

  const renderPagedList = () => {
    if (showSkeleton) {
      return underHeader(
        <View
          testID="pokemon-list-loading"
          accessibilityLabel="Cargando Pokémon"
          accessibilityRole="progressbar"
          style={[
            styles.skeletonGrid,
            gridPadding,
            { paddingTop: GRID_PADDING },
          ]}
        >
          {Array.from({ length: skeletonCount }, (_, index) => (
            <PokemonCardSkeleton key={index} width={itemWidth} />
          ))}
        </View>,
      );
    }
    switch (state.status) {
      case ViewStatus.LOADING:
        // Fast (cache) loads finish before the skeleton delay: show nothing rather than a flash.
        return underHeader(null);
      case ViewStatus.ERROR:
        return underHeader(
          state.error ? (
            <StateMessage
              testID="pokemon-list-error"
              title={state.error.title}
              message={state.error.message}
              actionLabel={state.error.retryable ? 'Reintentar' : undefined}
              onAction={retry}
            />
          ) : null,
        );
      case ViewStatus.EMPTY:
        return underHeader(
          <StateMessage
            testID="pokemon-list-empty"
            title="No hay Pokémon"
            message="No encontramos Pokémon para mostrar."
            actionLabel="Recargar"
            onAction={retry}
          />,
        );
      case ViewStatus.SUCCESS:
        return (
          <PokemonGrid
            testID="pokemon-list"
            listRef={pagedTop.listRef}
            data={state.items}
            columns={columns}
            itemWidth={itemWidth}
            typeIndex={typeIndex}
            onPressItem={openDetail}
            onScroll={pagedScroll.onScroll}
            {...pagedScroll.listProps}
            contentContainerStyle={pagedContentStyle}
            onEndReached={loadMore}
            onEndReachedThreshold={0.6}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={VIEWABILITY_CONFIG}
            ListFooterComponent={footer ?? undefined}
            refreshControl={
              <RefreshControl
                refreshing={state.isRefreshing}
                onRefresh={onRefresh}
                // iOS draws its spinner at the very top, behind the header: it stays
                // invisible and the list shows its own one below the header.
                tintColor={isIOS ? 'transparent' : colors.primary}
                colors={[colors.primary]}
                progressViewOffset={pagedScroll.progressViewOffset}
              />
            }
          />
        );
    }
  };

  const renderSearchResults = () => {
    const { status, results, term, error } = search.state;
    if (status === SearchStatus.ERROR && error) {
      return underHeader(
        <StateMessage
          testID="search-error"
          title={error.title}
          message={error.message}
          actionLabel={error.retryable ? 'Reintentar' : undefined}
          onAction={search.retry}
        />,
        collapsedHeight,
      );
    }
    if (status === SearchStatus.NO_RESULTS) {
      return underHeader(
        <StateMessage
          testID="search-empty"
          title="Sin resultados"
          message={noResultsMessage(term, state.totalCount)}
        />,
        collapsedHeight,
      );
    }
    if (status === SearchStatus.SEARCHING && results.length === 0) {
      return underHeader(
        <ActivityIndicator
          testID="search-loading"
          style={styles.footer}
          color={colors.primary}
          accessibilityLabel="Buscando"
        />,
        collapsedHeight,
      );
    }
    return (
      <PokemonGrid
        testID="search-results"
        data={results}
        columns={columns}
        itemWidth={itemWidth}
        typeIndex={typeIndex}
        onPressItem={openDetail}
        listRef={searchTop.listRef}
        onScroll={searchScroll.onScroll}
        {...searchScroll.listProps}
        contentContainerStyle={searchContentStyle}
      />
    );
  };

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {/* The paged list stays mounted under the results so it keeps its scroll. */}
      <View
        style={styles.fill}
        pointerEvents={isSearching ? 'none' : 'auto'}
        accessibilityElementsHidden={isSearching}
        importantForAccessibility={isSearching ? 'no-hide-descendants' : 'auto'}
      >
        {renderPagedList()}
        {isIOS && state.isRefreshing ? (
          <ActivityIndicator
            testID="ios-refresh-indicator"
            style={[styles.iosRefresh, { top: expandedHeight + spacing.md }]}
            color={colors.primary}
            accessibilityLabel="Actualizando"
          />
        ) : null}
      </View>
      {isSearching ? (
        <View style={[styles.overlay, { backgroundColor: colors.background }]}>
          {renderSearchResults()}
        </View>
      ) : null}
      <ScrollToTopButton
        visible={activeTop.visible}
        onPress={activeTop.scrollToTop}
        bottom={insets.bottom + spacing.lg}
      />
      <CollapsingHeader
        title="Pokédex de José"
        subtitle={subtitle}
        scrollOffset={headerOffset}
        expandedHeight={expandedHeight}
        collapseDistance={collapseDistance}
        trailing={<ThemeToggle />}
        bottomAccessory={
          state.isShowingOfflineData || state.refreshError ? (
            <>
              {state.isShowingOfflineData ? (
                <Banner
                  testID="offline-banner"
                  message="No pudimos contactar al servidor: mostrando datos guardados."
                />
              ) : null}
              {state.refreshError ? (
                <Banner
                  testID="refresh-error-banner"
                  message={`No se pudo actualizar. ${state.refreshError.message}`}
                />
              ) : null}
            </>
          ) : null
        }
        renderSearch={progress => (
          <SearchBar
            value={search.query}
            onChangeText={search.setQuery}
            onClear={search.clear}
            collapseProgress={progress}
            leadingInset={HEADER_ICON_SLOT}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  iosRefresh: { position: 'absolute', alignSelf: 'center' },
  overlay: { ...StyleSheet.absoluteFill },
  content: { gap: GRID_GAP },
  row: { gap: GRID_GAP },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  footer: { paddingVertical: spacing.xl },
  footerButton: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  footerText: { textAlign: 'center' },
});
