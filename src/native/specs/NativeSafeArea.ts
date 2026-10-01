import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type SafeAreaInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

/** Codegen spec for the native safe-area reader (values in dp / pt). */
export interface Spec extends TurboModule {
  getInsets(): Promise<SafeAreaInsets>;
}

export default TurboModuleRegistry.get<Spec>('NativeSafeArea');
