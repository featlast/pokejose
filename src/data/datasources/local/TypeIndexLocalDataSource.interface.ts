import type { CachedValue } from '../../cache/CacheEntry.types';
import type { TypeIndexSnapshot } from '../TypeIndexSnapshot.types';

export interface TypeIndexLocalDataSource {
  getTypeIndex(): Promise<CachedValue<TypeIndexSnapshot> | null>;
  saveTypeIndex(snapshot: TypeIndexSnapshot): Promise<void>;
}
