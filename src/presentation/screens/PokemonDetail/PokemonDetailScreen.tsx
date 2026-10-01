import React from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useDependencies } from '../../../di/DependenciesContext';
import { PokemonType } from '../../../domain/enums';
import {
  Banner,
  ProgressiveImage,
  ScreenHeader,
  Skeleton,
  StateMessage,
  TypeBadge,
} from '../../components';
import { pokemonImageSharedKey } from '../../components/sharedElementKeys';
import { SharedElementRole } from '../../enums/SharedElementRole.enum';
import { ViewStatus } from '../../enums/ViewStatus.enum';
import { useSafeAreaInsets } from '../../hooks/SafeArea';
import { useMinimumDuration } from '../../hooks/useMinimumDuration';
import { useSharedElement } from '../../sharedElement/SharedElementContext';
import type { ScreenProps } from '../../navigation';
import { TYPE_APPEARANCE, radius, spacing, useTheme } from '../../theme';
import { formatName, formatPokedexNumber } from '../../utils/formatters';
import { PokemonDetailContent } from './PokemonDetailContent';
import { usePokemonDetailViewModel } from './usePokemonDetailViewModel';

const MAX_CONTENT_WIDTH = 720;

export const PokemonDetailScreen = ({
  route,
  navigation,
}: ScreenProps<'PokemonDetail'>) => {
  const { id, name, imageUrl } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { getPokemonDetail } = useDependencies();
  const { state, retry } = usePokemonDetailViewModel(getPokemonDetail, id);
  // Same rule as the list: a cached detail (the usual case) never flashes a skeleton,
  // and a skeleton that does appear stays long enough not to blink.
  const showSkeleton = useMinimumDuration(state.status === ViewStatus.LOADING);
  const sharedImage = useSharedElement(
    pokemonImageSharedKey(id),
    SharedElementRole.TARGET,
  );

  const primaryType = state.detail?.types[0] ?? PokemonType.UNKNOWN;
  const accentColor = state.detail
    ? TYPE_APPEARANCE[primaryType].color
    : colors.primary;
  const displayName = formatName(name);
  const artworkSize = Math.min(width * 0.55, 260);

  const renderBody = () => {
    if (showSkeleton) {
      return (
        <View testID="pokemon-detail-loading" style={styles.skeletons}>
          <Skeleton style={styles.skeletonSection} />
          <Skeleton style={styles.skeletonSection} />
          <Skeleton style={[styles.skeletonSection, styles.skeletonTall]} />
        </View>
      );
    }
    switch (state.status) {
      case ViewStatus.LOADING:
        return null;
      case ViewStatus.ERROR:
        return state.error ? (
          <StateMessage
            testID="pokemon-detail-error"
            title={state.error.title}
            message={state.error.message}
            actionLabel={state.error.retryable ? 'Reintentar' : 'Volver'}
            onAction={state.error.retryable ? retry : navigation.goBack}
          />
        ) : null;
      case ViewStatus.SUCCESS:
        return state.detail ? (
          <PokemonDetailContent
            detail={state.detail}
            accentColor={accentColor}
          />
        ) : null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={displayName}
        subtitle={formatPokedexNumber(id)}
        onBack={navigation.goBack}
        backgroundColor={accentColor}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingLeft: insets.left + spacing.lg,
            paddingRight: insets.right + spacing.lg,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
      >
        <View style={styles.inner}>
          {/* Hero is rendered from route params, so it shows instantly while details load. */}
          <View style={[styles.hero, { backgroundColor: accentColor }]}>
            {/* Landing spot of the card image's shared transition. */}
            <Animated.View
              testID="shared-image-target"
              ref={sharedImage.ref}
              onLayout={sharedImage.onLayout}
              style={sharedImage.style}
            >
              <ProgressiveImage
                uri={imageUrl}
                size={artworkSize}
                accessibilityLabel={`Ilustración de ${displayName}`}
              />
            </Animated.View>
            <View style={styles.types}>
              {state.detail?.types.map(type => (
                <TypeBadge key={type} type={type} />
              ))}
            </View>
          </View>
          {/* Below the hero, so it can never shift the hero while the image flies in. */}
          {state.isShowingOfflineData ? (
            <Banner
              testID="offline-banner"
              message="No pudimos contactar al servidor: mostrando datos guardados."
            />
          ) : null}
          {renderBody()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: spacing.lg, flexGrow: 1 },
  inner: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    gap: spacing.lg,
    flexGrow: 1,
  },
  hero: {
    borderRadius: radius.lg,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
    minHeight: 120,
  },
  types: { flexDirection: 'row', gap: spacing.sm, minHeight: 30 },
  skeletons: { gap: spacing.lg },
  skeletonSection: { height: 110, borderRadius: radius.md },
  skeletonTall: { height: 240 },
});
