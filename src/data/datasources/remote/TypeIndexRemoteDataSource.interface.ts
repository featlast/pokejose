import type { TypeIndexSnapshot } from '../TypeIndexSnapshot.types';

export interface TypeIndexRemoteDataSource {
  fetchTypeIndex(): Promise<TypeIndexSnapshot>;
}
