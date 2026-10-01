import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Codegen spec for the file-backed key/value store implemented in
 * android/.../nativemodules/KeyValueStoreModule.kt and ios/pokeapi/NativeModules/KeyValueFileStore.swift.
 */
export interface Spec extends TurboModule {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>('NativeKeyValueStore');
