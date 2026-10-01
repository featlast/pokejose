import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { GetPokemonPageUseCase } from '../../src/domain/usecases/GetPokemonPageUseCase';
import { useMinimumDuration } from '../../src/presentation/hooks/useMinimumDuration';
import { skeletonCountFor } from '../../src/presentation/hooks/useSkeletonCount';
import { usePokemonListViewModel } from '../../src/presentation/screens/PokemonList/usePokemonListViewModel';
import { makePage, resource } from '../fixtures/pokemon.fixtures';

describe('skeletonCountFor', () => {
  it('fills the viewport with whole rows (including a partial last row)', () => {
    expect(
      skeletonCountFor({
        availableHeight: 700,
        itemHeight: 200,
        gap: 12,
        columns: 2,
      }),
    ).toBe(8);
    expect(
      skeletonCountFor({
        availableHeight: 700,
        itemHeight: 200,
        gap: 12,
        columns: 4,
      }),
    ).toBe(16);
  });

  it('always shows at least one row and guards invalid sizes', () => {
    expect(
      skeletonCountFor({
        availableHeight: 0,
        itemHeight: 200,
        gap: 0,
        columns: 3,
      }),
    ).toBe(3);
    expect(
      skeletonCountFor({
        availableHeight: 700,
        itemHeight: 0,
        gap: 0,
        columns: 2,
      }),
    ).toBe(0);
  });
});

describe('useMinimumDuration', () => {
  let visible = false;
  const Probe = ({ active }: { active: boolean }) => {
    visible = useMinimumDuration(active, { delayMs: 150, minVisibleMs: 300 });
    return null;
  };

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const render = () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<Probe active />);
    });
    return renderer;
  };
  const advance = (ms: number) =>
    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(ms);
    });

  it('never shows the indicator for loads shorter than the delay', () => {
    const renderer = render();
    advance(100);
    ReactTestRenderer.act(() => renderer.update(<Probe active={false} />));
    advance(1000);
    expect(visible).toBe(false);
  });

  it('keeps the indicator for the minimum time once shown', () => {
    const renderer = render();
    advance(150);
    expect(visible).toBe(true);

    advance(50);
    ReactTestRenderer.act(() => renderer.update(<Probe active={false} />));
    advance(200);
    expect(visible).toBe(true);
    advance(60);
    expect(visible).toBe(false);
  });
});

describe('usePokemonListViewModel.prefetchNext', () => {
  it('fetches the next page ahead of time once and warms its images', async () => {
    const repository = {
      getPokemonPage: jest
        .fn()
        .mockResolvedValueOnce(resource(makePage([1, 2], 2)))
        .mockResolvedValueOnce(resource(makePage([3, 4], 4))),
      getPokemonDetail: jest.fn(),
    };
    const prefetch = jest.fn();
    // Stable instance, as the DI container provides in the app.
    const getPage = new GetPokemonPageUseCase(repository, 2);
    let viewModel!: ReturnType<typeof usePokemonListViewModel>;
    const Probe = () => {
      viewModel = usePokemonListViewModel(getPage, prefetch);
      return null;
    };

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<Probe />);
    });
    await ReactTestRenderer.act(async () => {
      viewModel.prefetchNext();
      viewModel.prefetchNext();
    });

    expect(repository.getPokemonPage).toHaveBeenCalledTimes(2);
    expect(repository.getPokemonPage).toHaveBeenLastCalledWith(2, 2, undefined);
    expect(prefetch).toHaveBeenCalledWith([
      'https://img/3.png',
      'https://img/4.png',
    ]);
    // Prefetching warms the cache; it does not append items by itself.
    expect(viewModel.state.items).toHaveLength(2);
  });
});

describe('usePokemonListViewModel: prefetch + load more', () => {
  it('reuses the in-flight prefetch instead of requesting the page twice', async () => {
    let resolveNext!: (value: unknown) => void;
    const repository = {
      getPokemonPage: jest
        .fn()
        .mockResolvedValueOnce(resource(makePage([1, 2], 2)))
        .mockImplementationOnce(
          () => new Promise(resolve => (resolveNext = resolve)),
        ),
      getPokemonDetail: jest.fn(),
    };
    const getPage = new GetPokemonPageUseCase(repository, 2);
    let viewModel!: ReturnType<typeof usePokemonListViewModel>;
    const Probe = () => {
      viewModel = usePokemonListViewModel(getPage, jest.fn());
      return null;
    };
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<Probe />);
    });

    await ReactTestRenderer.act(async () => {
      viewModel.prefetchNext();
      viewModel.loadMore();
    });
    await ReactTestRenderer.act(async () => {
      resolveNext(resource(makePage([3, 4], 4)));
    });

    expect(repository.getPokemonPage).toHaveBeenCalledTimes(2);
    expect(viewModel.state.items.map(item => item.id)).toEqual([1, 2, 3, 4]);
  });
});
