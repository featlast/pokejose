import { createContext, useContext } from 'react';
import type { Navigation } from './Navigation.types';

export const NavigationContext = createContext<Navigation | null>(null);

export const useNavigation = (): Navigation => {
  const navigation = useContext(NavigationContext);
  if (!navigation) {
    throw new Error('useNavigation must be used inside <StackNavigator>');
  }
  return navigation;
};
