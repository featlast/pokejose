import { useWindowDimensions } from 'react-native';

type SkeletonCountInput = {
  availableHeight: number;
  itemHeight: number;
  gap: number;
  columns: number;
};

/** Enough placeholder cards to fill the visible area: full rows, plus a partial one. */
export const skeletonCountFor = ({
  availableHeight,
  itemHeight,
  gap,
  columns,
}: SkeletonCountInput): number => {
  if (itemHeight <= 0 || columns <= 0) {
    return 0;
  }
  const rows = Math.max(1, Math.ceil(availableHeight / (itemHeight + gap)));
  return rows * columns;
};

export const useSkeletonCount = (
  input: Omit<SkeletonCountInput, 'availableHeight'> & { offsetTop: number },
): number => {
  const { height } = useWindowDimensions();
  return skeletonCountFor({
    ...input,
    availableHeight: height - input.offsetTop,
  });
};
