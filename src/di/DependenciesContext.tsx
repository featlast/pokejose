import React, { createContext, useContext } from 'react';
import type { PropsWithChildren } from 'react';
import type { AppDependencies } from './AppDependencies.types';

const DependenciesContext = createContext<AppDependencies | null>(null);

export const DependenciesProvider = ({
  dependencies,
  children,
}: PropsWithChildren<{ dependencies: AppDependencies }>) => (
  <DependenciesContext.Provider value={dependencies}>
    {children}
  </DependenciesContext.Provider>
);

export const useDependencies = (): AppDependencies => {
  const dependencies = useContext(DependenciesContext);
  if (!dependencies) {
    throw new Error(
      'useDependencies must be used inside <DependenciesProvider>',
    );
  }
  return dependencies;
};
