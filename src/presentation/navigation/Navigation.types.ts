import type { ComponentType } from 'react';
import type { SharedElementSpec } from '../sharedElement/SharedElement.types';

/** Every route and the params it requires. Adding a screen starts here. */
export type RootStackParamList = {
  PokemonList: undefined;
  PokemonDetail: { id: number; name: string; imageUrl: string };
};

export type RouteName = keyof RootStackParamList;

/** Discriminated union: narrowing on `name` narrows `params`. */
export type Route<TName extends RouteName = RouteName> = {
  [K in TName]: { key: string; name: K; params: RootStackParamList[K] };
}[TName];

type ParamsArg<TName extends RouteName> =
  RootStackParamList[TName] extends undefined
    ? []
    : [params: RootStackParamList[TName]];

export interface Navigation {
  navigate<TName extends RouteName>(
    name: TName,
    ...params: ParamsArg<TName>
  ): void;
  goBack(): void;
  canGoBack(): boolean;
}

export type ScreenProps<TName extends RouteName> = {
  route: Route<TName>;
  navigation: Navigation;
};

export type ScreenRegistry = {
  [K in RouteName]: ComponentType<ScreenProps<K>>;
};

/**
 * Per-route shared element: given the pushed route, what it shares with the
 * screen below (see sharedElement/). Routes without an entry just slide.
 */
export type SharedElementConfig = {
  [K in RouteName]?: (route: Route<K>) => SharedElementSpec | null;
};
