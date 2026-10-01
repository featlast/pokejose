import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from '../../src/presentation/hooks/SafeArea';
import type { Spec } from '../../src/native/specs/NativeSafeArea';

const Probe = () => {
  const insets = useSafeAreaInsets();
  return <Text>{`${insets.top},${insets.bottom}`}</Text>;
};

const render = async (reader: Spec) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider reader={reader}>
        <Probe />
      </SafeAreaProvider>,
    );
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });
  return renderer;
};

const textOf = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findByType(Text).props.children;

describe('SafeAreaProvider', () => {
  it('provides the insets measured by the native module', async () => {
    const reader = {
      getInsets: jest
        .fn()
        .mockResolvedValue({ top: 59, right: 0, bottom: 34, left: 0 }),
    } as unknown as Spec;

    const renderer = await render(reader);

    expect(textOf(renderer)).toBe('59,34');
    await ReactTestRenderer.act(async () => renderer.unmount());
  });

  it('falls back and retries when the native module is not ready yet', async () => {
    const reader = {
      getInsets: jest
        .fn()
        .mockRejectedValueOnce(new Error('E_SAFE_AREA_UNAVAILABLE'))
        .mockResolvedValue({ top: 47, right: 0, bottom: 34, left: 0 }),
    } as unknown as Spec;

    const renderer = await render(reader);
    expect(textOf(renderer)).toBe('20,0');

    await ReactTestRenderer.act(
      () => new Promise<void>(resolve => setTimeout(resolve, 300)),
    );
    expect(textOf(renderer)).toBe('47,34');
    await ReactTestRenderer.act(async () => renderer.unmount());
  });
});
