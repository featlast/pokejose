/**
 * Integration test: real App tree (navigator, view models, use cases) wired
 * through the composition root with a fake repository.
 */

import React from 'react';
import { Animated, Appearance, BackHandler } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import type { ReactTestInstance } from 'react-test-renderer';
import App from '../App';
import { AppError, ErrorCode } from '../src/core/errors';
import { InMemoryKeyValueStorage } from '../src/core/storage/InMemoryKeyValueStorage';
import { createAppDependencies } from '../src/di/container';
import { DataOrigin, PokemonType } from '../src/domain/enums';
import type { PokemonDetail, Resource } from '../src/domain/models';
import type { PokemonRepository } from '../src/domain/repositories/PokemonRepository.interface';
import type { PokemonSearchIndexRepository } from '../src/domain/repositories/PokemonSearchIndexRepository.interface';
import type { PokemonTypeIndexRepository } from '../src/domain/repositories/PokemonTypeIndexRepository.interface';
import {
  bulbasaurDetail,
  flushPromises,
  makePage,
  makeSummary,
  resource,
} from './fixtures/pokemon.fixtures';

/**
 * The Jest preset mocks the native animated module, so native-driver animations
 * never report completion. Finish them on the next tick instead.
 */
const completeAnimationsOnNextTick = () =>
  jest.spyOn(Animated, 'timing').mockImplementation(
    (value, config) =>
      ({
        start: (callback?: (result: { finished: boolean }) => void) => {
          setTimeout(() => {
            (value as Animated.Value).setValue(config.toValue as number);
            callback?.({ finished: true });
          }, 0);
        },
        stop: () => undefined,
        reset: () => undefined,
      } as unknown as Animated.CompositeAnimation),
  );

const firstTwenty = Array.from({ length: 20 }, (_, i) => i + 1);

const createRepository = (
  overrides: Partial<jest.Mocked<PokemonRepository>> = {},
): jest.Mocked<PokemonRepository> => ({
  getPokemonPage: jest.fn().mockResolvedValue(
    resource({
      ...makePage(firstTwenty, 20),
      items: firstTwenty.map(id =>
        id === 1 ? makeSummary(1, 'bulbasaur') : makeSummary(id),
      ),
    }),
  ),
  getPokemonDetail: jest.fn().mockResolvedValue(resource(bulbasaurDetail)),
  ...overrides,
});

type Fakes = {
  typeIndexRepository?: PokemonTypeIndexRepository;
  searchIndexRepository?: PokemonSearchIndexRepository;
  storage?: InMemoryKeyValueStorage;
};

/** Every repository is faked, so the test never reaches the network or disk. */
const renderApp = async (repository: PokemonRepository, fakes: Fakes = {}) => {
  const typeIndexRepository: PokemonTypeIndexRepository =
    fakes.typeIndexRepository ?? {
      getTypeIndex: jest
        .fn()
        .mockResolvedValue(
          resource({ 1: [PokemonType.GRASS, PokemonType.POISON] }),
        ),
    };
  const searchIndexRepository: PokemonSearchIndexRepository =
    fakes.searchIndexRepository ?? {
      getSearchIndex: jest
        .fn()
        .mockResolvedValue(
          resource([
            makeSummary(1, 'bulbasaur'),
            makeSummary(4, 'charmander'),
            makeSummary(25, 'pikachu'),
          ]),
        ),
    };
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <App
        dependencies={createAppDependencies({
          repository,
          typeIndexRepository,
          searchIndexRepository,
          storage: fakes.storage ?? new InMemoryKeyValueStorage(),
        })}
      />,
    );
    await flushPromises();
  });
  return renderer;
};

const byTestId = (renderer: ReactTestRenderer.ReactTestRenderer, id: string) =>
  renderer.root.findAll(
    (node: ReactTestInstance) =>
      node.props.testID === id && typeof node.type !== 'string',
  );

/** Concatenated content of every host <Text>, i.e. what the user can read. */
const visibleText = (renderer: ReactTestRenderer.ReactTestRenderer): string =>
  renderer.root
    .findAll((node: ReactTestInstance) => (node.type as unknown) === 'Text')
    .flatMap(node => node.children)
    .filter((child): child is string => typeof child === 'string')
    .join(' ');

/** Lets data promises and next-tick animations (see above) settle. */
const settle = () => new Promise<void>(resolve => setTimeout(resolve, 10));

/** Updates are applied when an act() scope exits, so typing and waiting need separate scopes. */
const typeAndWaitForSearch = async (
  renderer: ReactTestRenderer.ReactTestRenderer,
  text: string,
) => {
  await ReactTestRenderer.act(async () => {
    byTestId(renderer, 'search-input')[0].props.onChangeText(text);
  });
  await ReactTestRenderer.act(
    () => new Promise<void>(resolve => setTimeout(resolve, 300)),
  );
};

const press = async (node: ReactTestInstance) => {
  await ReactTestRenderer.act(async () => {
    node.props.onPress();
    await settle();
  });
};

describe('App', () => {
  let mounted: ReactTestRenderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    completeAnimationsOnNextTick();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await ReactTestRenderer.act(async () => mounted?.unmount());
    mounted = null;
  });

  it('shows the first 20 Pokémon with name and image', async () => {
    const repository = createRepository();
    const renderer = (mounted = await renderApp(repository));

    expect(repository.getPokemonPage).toHaveBeenCalledWith(0, 20, undefined);
    expect(byTestId(renderer, 'pokemon-card-1')).not.toHaveLength(0);
    expect(byTestId(renderer, 'pokemon-card-20')).not.toHaveLength(0);
    expect(visibleText(renderer)).toContain('Bulbasaur');
  });

  it('navigates to the detail screen and back', async () => {
    const repository = createRepository();
    const renderer = (mounted = await renderApp(repository));

    await press(byTestId(renderer, 'pokemon-card-1')[0]);

    expect(repository.getPokemonDetail).toHaveBeenCalledWith(1, undefined);
    expect(byTestId(renderer, 'pokemon-detail-content')).not.toHaveLength(0);
    const tree = visibleText(renderer);
    expect(tree).toContain('Overgrow');
    expect(tree).toContain('6.9 kg');

    await press(byTestId(renderer, 'header-back')[0]);
    expect(byTestId(renderer, 'pokemon-detail-content')).toHaveLength(0);
  });

  it('shows a friendly error and retries', async () => {
    const repository = createRepository({
      getPokemonPage: jest
        .fn()
        .mockRejectedValueOnce(new AppError(ErrorCode.NETWORK, 'offline'))
        .mockResolvedValue(resource(makePage([1, 2]))),
    });
    const renderer = (mounted = await renderApp(repository));

    expect(visibleText(renderer)).toContain('Sin conexión');

    await press(byTestId(renderer, 'pokemon-list-error-action')[0]);

    expect(byTestId(renderer, 'pokemon-card-2')).not.toHaveLength(0);
  });

  it('warns the user when showing offline (stale) data', async () => {
    const repository = createRepository({
      getPokemonPage: jest
        .fn()
        .mockResolvedValue(resource(makePage([1]), DataOrigin.STALE_CACHE)),
    });
    const renderer = (mounted = await renderApp(repository));

    expect(byTestId(renderer, 'offline-banner')).not.toHaveLength(0);
  });

  it('shows the empty state when the API returns no Pokémon', async () => {
    const repository = createRepository({
      getPokemonPage: jest
        .fn()
        .mockResolvedValue(resource(makePage([], null, 0))),
    });
    const renderer = (mounted = await renderApp(repository));

    expect(byTestId(renderer, 'pokemon-list-empty')).not.toHaveLength(0);
  });

  it('keeps every loaded page when a pull-to-refresh fails offline', async () => {
    const getPokemonPage = jest
      .fn()
      .mockResolvedValueOnce(resource(makePage(firstTwenty, 20)))
      .mockResolvedValueOnce(resource(makePage([21, 22], 22)))
      .mockRejectedValueOnce(new AppError(ErrorCode.NETWORK, 'offline'));
    const renderer = (mounted = await renderApp(
      createRepository({ getPokemonPage }),
    ));
    const list = () => byTestId(renderer, 'pokemon-list')[0];

    await ReactTestRenderer.act(async () => {
      list().props.onEndReached();
      await settle();
    });
    expect(byTestId(renderer, 'pokemon-card-22')).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      list().props.refreshControl.props.onRefresh();
      await settle();
    });

    expect(getPokemonPage).toHaveBeenLastCalledWith(0, 20, {
      forceRefresh: true,
      allowStaleFallback: false,
    });
    expect(byTestId(renderer, 'pokemon-card-22')).not.toHaveLength(0);
    expect(byTestId(renderer, 'refresh-error-banner')).not.toHaveLength(0);
  });

  it('plays the launch splash over the list, then removes it', async () => {
    let finishSplash!: (result: { finished: boolean }) => void;
    jest.spyOn(Animated, 'timing').mockImplementation(
      () =>
        ({
          start: (callback?: (result: { finished: boolean }) => void) => {
            // Other fades (ribbons, images) start without a completion callback.
            if (callback) {
              finishSplash = callback;
            }
          },
          stop: () => undefined,
          reset: () => undefined,
        } as unknown as Animated.CompositeAnimation),
    );
    const repository = createRepository();
    const renderer = (mounted = await renderApp(repository));

    // The first page is requested while the splash is still playing.
    expect(byTestId(renderer, 'animated-splash')).not.toHaveLength(0);
    expect(repository.getPokemonPage).toHaveBeenCalledTimes(1);

    await ReactTestRenderer.act(async () => finishSplash({ finished: true }));
    expect(byTestId(renderer, 'animated-splash')).toHaveLength(0);
    expect(byTestId(renderer, 'pokemon-card-1')).not.toHaveLength(0);
  });

  it('goes back with the Android hardware back button', async () => {
    const addListener = jest.spyOn(BackHandler, 'addEventListener');
    const renderer = (mounted = await renderApp(createRepository()));

    await press(byTestId(renderer, 'pokemon-card-1')[0]);
    expect(byTestId(renderer, 'pokemon-detail-content')).not.toHaveLength(0);

    const onBackPress =
      addListener.mock.calls[addListener.mock.calls.length - 1][1];
    let handled = false;
    await ReactTestRenderer.act(async () => {
      handled =
        onBackPress({ type: 'hardwareBackPress', timeStamp: 0 }) === true;
      await settle();
    });

    expect(handled).toBe(true);
    expect(byTestId(renderer, 'pokemon-detail-content')).toHaveLength(0);
  });

  it('shows a diagonal ribbon with the primary type once the type index arrives', async () => {
    const renderer = (mounted = await renderApp(createRepository()));

    expect(byTestId(renderer, 'type-ribbon-grass')).not.toHaveLength(0);
    // Pokémon the index does not know simply have no ribbon.
    const card2 = byTestId(renderer, 'pokemon-card-2')[0];
    expect(
      card2.findAll(node => node.props.testID?.startsWith?.('type-ribbon')),
    ).toHaveLength(0);
    expect(
      byTestId(renderer, 'pokemon-card-1')[0].props.accessibilityLabel,
    ).toContain('tipo Planta');
  });

  it('still renders the list when the type index fails', async () => {
    const renderer = (mounted = await renderApp(createRepository(), {
      typeIndexRepository: {
        getTypeIndex: jest
          .fn()
          .mockRejectedValue(new AppError(ErrorCode.NETWORK, 'offline')),
      },
    }));

    expect(byTestId(renderer, 'pokemon-card-1')).not.toHaveLength(0);
    expect(byTestId(renderer, 'type-ribbon-grass')).toHaveLength(0);
  });

  it('searches by name after the debounce and goes back to the list when cleared', async () => {
    const renderer = (mounted = await renderApp(createRepository()));
    await typeAndWaitForSearch(renderer, 'pika');

    expect(byTestId(renderer, 'search-results')).not.toHaveLength(0);
    expect(visibleText(renderer)).toContain('Pikachu');
    expect(visibleText(renderer)).toContain('1 resultados');

    await press(byTestId(renderer, 'search-clear')[0]);
    await ReactTestRenderer.act(
      () => new Promise<void>(resolve => setTimeout(resolve, 300)),
    );
    expect(byTestId(renderer, 'search-results')).toHaveLength(0);
    expect(byTestId(renderer, 'pokemon-list')).not.toHaveLength(0);
  });

  it('shows an empty state when nothing matches the search', async () => {
    const renderer = (mounted = await renderApp(createRepository()));

    await typeAndWaitForSearch(renderer, 'zzz');

    expect(byTestId(renderer, 'search-empty')).not.toHaveLength(0);
  });

  it('cycles the theme with its own icon for each option', async () => {
    const setColorScheme = jest.spyOn(Appearance, 'setColorScheme');
    const storage = new InMemoryKeyValueStorage();
    const renderer = (mounted = await renderApp(createRepository(), {
      storage,
    }));
    const toggle = () => byTestId(renderer, 'theme-toggle')[0];
    const icon = () => byTestId(renderer, 'theme-toggle-icon')[0].props.source;

    expect(toggle().props.accessibilityLabel).toBe('Tema: Sistema');
    const systemIcon = icon();
    await press(toggle());

    expect(toggle().props.accessibilityLabel).toBe('Tema: Claro');
    expect(setColorScheme).toHaveBeenLastCalledWith('light');
    const lightIcon = icon();
    expect(lightIcon).not.toBe(systemIcon);

    await press(toggle());
    expect(toggle().props.accessibilityLabel).toBe('Tema: Oscuro');
    expect(setColorScheme).toHaveBeenLastCalledWith('dark');
    expect(icon()).not.toBe(lightIcon);

    // The choice lasts for the session only (FR-210): nothing is written to disk.
    await expect(storage.getItem('settings:theme')).resolves.toBeNull();
  });

  it('always starts on the system theme, even if an old choice was stored', async () => {
    const setColorScheme = jest.spyOn(Appearance, 'setColorScheme');
    const storage = new InMemoryKeyValueStorage();
    await storage.setItem('settings:theme', 'dark');

    const renderer = (mounted = await renderApp(createRepository(), {
      storage,
    }));

    expect(byTestId(renderer, 'theme-toggle')[0].props.accessibilityLabel).toBe(
      'Tema: Sistema',
    );
    expect(setColorScheme).not.toHaveBeenCalled();
  });

  it('shows a loading state while the search index downloads', async () => {
    const renderer = (mounted = await renderApp(createRepository(), {
      searchIndexRepository: {
        getSearchIndex: jest.fn(() => new Promise(() => undefined)),
      },
    }));

    await typeAndWaitForSearch(renderer, 'pika');

    expect(byTestId(renderer, 'search-loading')).not.toHaveLength(0);
  });

  it('shows a friendly error when the search index cannot load, and retries', async () => {
    const getSearchIndex = jest
      .fn()
      .mockRejectedValueOnce(new AppError(ErrorCode.NETWORK, 'offline'))
      .mockResolvedValue(resource([makeSummary(25, 'pikachu')]));
    const renderer = (mounted = await renderApp(createRepository(), {
      searchIndexRepository: { getSearchIndex },
    }));

    await typeAndWaitForSearch(renderer, 'pika');
    expect(byTestId(renderer, 'search-error')).not.toHaveLength(0);

    await press(byTestId(renderer, 'search-error-action')[0]);
    expect(byTestId(renderer, 'search-results')).not.toHaveLength(0);
  });

  it('clears the search immediately, without waiting for the debounce', async () => {
    const renderer = (mounted = await renderApp(createRepository()));
    await typeAndWaitForSearch(renderer, 'pika');

    await ReactTestRenderer.act(async () => {
      byTestId(renderer, 'search-clear')[0].props.onPress();
    });

    expect(byTestId(renderer, 'search-results')).toHaveLength(0);
  });

  it('retries a failed type index on pull-to-refresh', async () => {
    const getTypeIndex = jest
      .fn()
      .mockRejectedValueOnce(new AppError(ErrorCode.NETWORK, 'offline'))
      .mockResolvedValue(resource({ 1: [PokemonType.GRASS] }));
    const renderer = (mounted = await renderApp(createRepository(), {
      typeIndexRepository: { getTypeIndex },
    }));
    expect(byTestId(renderer, 'type-ribbon-grass')).toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      byTestId(
        renderer,
        'pokemon-list',
      )[0].props.refreshControl.props.onRefresh();
      await settle();
    });

    expect(byTestId(renderer, 'type-ribbon-grass')).not.toHaveLength(0);
  });

  it('never flashes the detail skeleton when the detail loads instantly (cache)', async () => {
    const renderer = (mounted = await renderApp(createRepository()));

    await ReactTestRenderer.act(async () => {
      byTestId(renderer, 'pokemon-card-1')[0].props.onPress();
    });
    expect(byTestId(renderer, 'pokemon-detail-loading')).toHaveLength(0);

    await ReactTestRenderer.act(() => settle());
    expect(byTestId(renderer, 'pokemon-detail-loading')).toHaveLength(0);
    expect(byTestId(renderer, 'pokemon-detail-content')).not.toHaveLength(0);
  });

  it('shows the detail skeleton only once a load takes longer than 150 ms', async () => {
    let resolveDetail!: (value: Resource<PokemonDetail>) => void;
    const renderer = (mounted = await renderApp(
      createRepository({
        getPokemonDetail: jest.fn(
          (_id: number) =>
            new Promise<Resource<PokemonDetail>>(
              resolve => (resolveDetail = resolve),
            ),
        ),
      }),
    ));
    const wait = (ms: number) =>
      ReactTestRenderer.act(
        () => new Promise<void>(resolve => setTimeout(resolve, ms)),
      );

    await ReactTestRenderer.act(async () => {
      byTestId(renderer, 'pokemon-card-1')[0].props.onPress();
    });
    await wait(80);
    expect(byTestId(renderer, 'pokemon-detail-loading')).toHaveLength(0);

    await wait(120);
    expect(byTestId(renderer, 'pokemon-detail-loading')).not.toHaveLength(0);

    await ReactTestRenderer.act(async () => {
      resolveDetail(resource(bulbasaurDetail));
    });
    await wait(350);
    expect(byTestId(renderer, 'pokemon-detail-loading')).toHaveLength(0);
    expect(byTestId(renderer, 'pokemon-detail-content')).not.toHaveLength(0);
  });
});
