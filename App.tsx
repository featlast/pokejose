import React, { useCallback, useState } from 'react';
import { StatusBar } from 'react-native';
import type { AppDependencies } from './src/di/AppDependencies.types';
import { createAppDependencies } from './src/di/container';
import { DependenciesProvider } from './src/di/DependenciesContext';
import { AnimatedSplash } from './src/presentation/components';
import { SafeAreaProvider } from './src/presentation/hooks/SafeArea';
import { ReduceMotionProvider } from './src/presentation/hooks/useReduceMotion';
import { ThemeProvider } from './src/presentation/theme';
import { StackNavigator } from './src/presentation/navigation';
import { screens, sharedElements } from './src/presentation/screens';

type AppProps = {
  /** Injected in tests; production builds the real graph once. */
  dependencies?: AppDependencies;
  /** Tests that don't exercise the launch animation can turn it off. */
  showSplash?: boolean;
};

const App = ({ dependencies, showSplash = true }: AppProps) => {
  const [appDependencies] = useState(
    () => dependencies ?? createAppDependencies(),
  );
  const [splashVisible, setSplashVisible] = useState(showSplash);
  const hideSplash = useCallback(() => setSplashVisible(false), []);

  return (
    <SafeAreaProvider>
      <ReduceMotionProvider>
        <DependenciesProvider dependencies={appDependencies}>
          <ThemeProvider>
            {/* Headers are always a saturated color, so light status bar content fits both themes. */}
            <StatusBar barStyle="light-content" />
            <StackNavigator
              screens={screens}
              initialRouteName="PokemonList"
              sharedElements={sharedElements}
            />
            {/* Drawn over the navigator so the first page loads while it plays. */}
            {splashVisible && <AnimatedSplash onFinish={hideSplash} />}
          </ThemeProvider>
        </DependenciesProvider>
      </ReduceMotionProvider>
    </SafeAreaProvider>
  );
};

export default App;
