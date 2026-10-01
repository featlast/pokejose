import { useWindowDimensions } from 'react-native';
import { spacing } from '../theme';
import { useSafeAreaInsets } from './SafeArea';

export const GRID_GAP = spacing.md;
export const GRID_PADDING = spacing.lg;

const columnsForWidth = (width: number): number => {
  if (width >= 1000) {
    return 5;
  }
  if (width >= 760) {
    return 4;
  }
  if (width >= 540) {
    return 3;
  }
  return 2;
};

/** Responsive grid: column count and card width for the current window. */
export const useGridLayout = () => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const usableWidth = width - insets.left - insets.right - GRID_PADDING * 2;
  const columns = columnsForWidth(usableWidth);
  const itemWidth = Math.floor(
    (usableWidth - GRID_GAP * (columns - 1)) / columns,
  );
  return { columns, itemWidth };
};
