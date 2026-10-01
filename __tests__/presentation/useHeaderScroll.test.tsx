import React from 'react';
import { Platform } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { useHeaderScroll } from '../../src/presentation/hooks/useCollapsingHeader';

type HeaderScroll = ReturnType<typeof useHeaderScroll>;

const renderHeaderScroll = (height: number) => {
  let result!: HeaderScroll;
  const Probe = () => {
    result = useHeaderScroll(height);
    return null;
  };
  ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<Probe />);
  });
  return result;
};

describe('useHeaderScroll (iOS)', () => {
  it('runs on the iOS preset', () => {
    expect(Platform.OS).toBe('ios');
  });

  it('reserves the header space with padding, never with contentInset', () => {
    // Regression: UIRefreshControl rewrites contentInset.top (see useHeaderScroll).
    const scroll = renderHeaderScroll(126);

    expect(scroll.contentPaddingTop).toBe(126);
    expect(scroll.listProps).not.toHaveProperty('contentInset');
    expect(scroll.listProps).not.toHaveProperty('contentOffset');
    expect(scroll.listProps).toEqual({
      contentInsetAdjustmentBehavior: 'never',
    });
  });

  it('starts at offset 0 (the top) and resets there', () => {
    const scroll = renderHeaderScroll(126);
    const value = () =>
      (scroll.scrollY as unknown as { __getValue(): number }).__getValue();

    expect(value()).toBe(0);
    scroll.scrollY.setValue(500);
    scroll.reset();
    expect(value()).toBe(0);
  });
});
