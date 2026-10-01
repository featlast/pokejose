import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing, useTheme } from '../theme';
import { AppText } from './AppText';

type BannerProps = { message: string; testID?: string };

/** Non-blocking notice, e.g. "showing offline data". */
export const Banner = ({ message, testID }: BannerProps) => {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: colors.warningBackground }]}
    >
      <AppText variant="caption" color={colors.warningText} style={styles.text}>
        {message}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  text: { textAlign: 'center' },
});
