export interface Page<TItem> {
  items: TItem[];
  totalCount: number;
  /** Offset for the following page, or null when this is the last one. */
  nextOffset: number | null;
}
