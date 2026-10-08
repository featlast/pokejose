import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from '../hooks/SafeArea';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { fontFamily, radius, spacing } from '../theme';
import { AppText } from './AppText';

type SnackbarProps = {
  message: string | null;
  actionLabel?: string;
  onAction?: () => void;
};

/** Dark in both themes, like the platforms' own snackbars. */
const BACKGROUND = '#24262B';
const ACTION_COLOR = '#FF8A98';
const SLIDE_MS = 220;
const HIDDEN_OFFSET = 160;

/** Bottom message that slides in while `message` is set (FR-605). */
export const Snackbar = ({ message, actionLabel, onAction }: SnackbarProps) => {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const offset = useRef(new Animated.Value(HIDDEN_OFFSET)).current;
  // Keeps the last text while sliding out.
  const shown = useRef(message);
  if (message) {
    shown.current = message;
  }

  useEffect(() => {
    const toValue = message ? 0 : HIDDEN_OFFSET;
    if (reduceMotion) {
      offset.setValue(toValue);
      return;
    }
    const animation = Animated.timing(offset, {
      toValue,
      duration: SLIDE_MS,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [message, offset, reduceMotion]);

  return (
    <Animated.View
      testID="snackbar"
      pointerEvents={message ? 'box-none' : 'none'}
      accessibilityLiveRegion="polite"
      importantForAccessibility={message ? 'auto' : 'no-hide-descendants'}
      style={[
        styles.container,
        {
          bottom: insets.bottom + spacing.lg,
          left: insets.left + spacing.lg,
          right: insets.right + spacing.lg,
          transform: [{ translateY: offset }],
        },
      ]}
    >
      <AppText variant="label" color="#FFFFFF" style={styles.message}>
        {shown.current}
      </AppText>
      {message && actionLabel && onAction ? (
        <Pressable
          testID="snackbar-action"
          onPress={onAction}
          accessibilityRole="button"
          hitSlop={8}
          style={styles.action}
        >
          <AppText
            variant="label"
            color={ACTION_COLOR}
            style={styles.actionText}
          >
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BACKGROUND,
    borderRadius: radius.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    minHeight: 52,
    boxShadow: '0px 10px 24px -8px rgba(0,0,0,0.5)',
  },
  message: { flex: 1, paddingVertical: spacing.md },
  action: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  actionText: { fontFamily: fontFamily.display },
});
