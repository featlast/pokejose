import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from '../hooks/SafeArea';
import { spacing, useTheme } from '../theme';
import { AppText } from './AppText';
import { Chevron } from './Chevron';
import { CircleButton } from './CircleButton';

/** Header text sits on a saturated color (primary or Pokémon type) in both themes. */
const ON_HEADER = '#FFFFFF';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Overrides the default primary background, e.g. with the Pokémon type color. */
  backgroundColor?: string;
};

export const ScreenHeader = ({
  title,
  subtitle,
  onBack,
  backgroundColor,
}: ScreenHeaderProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const background = backgroundColor ?? colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: background,
          paddingTop: insets.top + spacing.sm,
          paddingLeft: insets.left + spacing.lg,
          paddingRight: insets.right + spacing.lg,
        },
      ]}
    >
      {onBack ? (
        <CircleButton
          testID="header-back"
          variant="translucent"
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={styles.back}
        >
          <Chevron direction="left" color={ON_HEADER} size={11} />
        </CircleButton>
      ) : null}
      <View style={styles.titles}>
        <AppText
          variant="title"
          color={ON_HEADER}
          accessibilityRole="header"
          numberOfLines={1}
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="label" color={ON_HEADER} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  back: { marginRight: spacing.md },
  titles: { flex: 1 },
});
