import type { Spec } from '../../native/specs/NativeKeyValueStore';
import { AppError, ErrorCode } from '../errors';
import type { KeyValueStorage } from './KeyValueStorage.interface';

/** Adapter from the Kotlin/Swift TurboModule to the app's storage abstraction. */
export class NativeKeyValueStorage implements KeyValueStorage {
  constructor(private readonly nativeModule: Spec) {}

  getItem(key: string): Promise<string | null> {
    return this.guard(`read "${key}"`, () => this.nativeModule.getItem(key));
  }

  setItem(key: string, value: string): Promise<void> {
    return this.guard(`write "${key}"`, () =>
      this.nativeModule.setItem(key, value),
    );
  }

  removeItem(key: string): Promise<void> {
    return this.guard(`remove "${key}"`, () =>
      this.nativeModule.removeItem(key),
    );
  }

  clear(): Promise<void> {
    return this.guard('clear', () => this.nativeModule.clear());
  }

  private async guard<T>(operation: string, run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      throw new AppError(ErrorCode.STORAGE, `Storage failed to ${operation}`, {
        cause: error,
      });
    }
  }
}
