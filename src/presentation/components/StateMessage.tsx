import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MIN_TOUCH_TARGET, radius, spacing, useTheme } from '../theme';
import { AppText } from './AppText';

type StateMessageProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

/** Full-area message for error and empty states, with an optional action. */
export const StateMessage = ({
  title,
  message,
  actionLabel,
  onAction,
  testID,
}: StateMessageProps) => {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <AppText
        variant="heading"
        accessibilityRole="header"
        style={styles.center}
      >
        {title}
      </AppText>
      <AppText color={colors.textSecondary} style={styles.center}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable
          testID={testID ? `${testID}-action` : undefined}
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <AppText variant="label" color={colors.onPrimary}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  center: { textAlign: 'center' },
  button: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: 160,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
});
