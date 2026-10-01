import type { DataOrigin } from '../enums';

/** Domain data plus provenance, so callers can react to offline/stale results. */
export interface Resource<TData> {
  data: TData;
  origin: DataOrigin;
}
