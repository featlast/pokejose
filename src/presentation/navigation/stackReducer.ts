import type { Route, RouteName, RootStackParamList } from './Navigation.types';

export type StackAction =
  | {
      type: 'PUSH';
      name: RouteName;
      params: RootStackParamList[RouteName];
      key: string;
    }
  | { type: 'POP' };

/** Pure stack transitions; the root route can never be popped. */
export const stackReducer = (stack: Route[], action: StackAction): Route[] => {
  switch (action.type) {
    case 'PUSH':
      return [
        ...stack,
        { key: action.key, name: action.name, params: action.params } as Route,
      ];
    case 'POP':
      return stack.length > 1 ? stack.slice(0, -1) : stack;
    default:
      return stack;
  }
};
