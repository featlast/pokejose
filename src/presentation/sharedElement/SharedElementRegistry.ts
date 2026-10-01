import { Animated } from 'react-native';
import { SharedElementRole } from '../enums/SharedElementRole.enum';
import type { Rect } from './SharedElement.types';

/** Minimal slice of a host view needed to measure it. */
export type MeasurableNode = {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
};

/** One mounted element; the same key may be mounted more than once (list + search). */
export type SharedElementEntry = {
  node: MeasurableNode | null;
  hasLayout: boolean;
};

const DEFAULT_MEASURE_TIMEOUT_MS = 150;

const idOf = (key: string, role: SharedElementRole) => `${role}:${key}`;

const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
): Promise<T> =>
  new Promise(resolve => {
    const timer = setTimeout(() => resolve(fallback), timeoutMs);
    promise.then(value => {
      clearTimeout(timer);
      resolve(value);
    });
  });

/**
 * Tracks mounted shared elements by key and role, measures them and hides them
 * while their overlay copy is flying. No React here: it is plain, testable logic.
 */
export class SharedElementRegistry {
  private readonly entries = new Map<string, SharedElementEntry[]>();
  private readonly opacities = new Map<string, Animated.Value>();
  private readonly layoutListeners = new Map<string, Set<() => void>>();
  /** Element the user interacted with, preferred over later mounts with the same key. */
  private readonly active = new Map<string, SharedElementEntry>();
  private visibleTop = 0;

  register(
    key: string,
    role: SharedElementRole,
    entry: SharedElementEntry,
  ): () => void {
    const id = idOf(key, role);
    this.entries.set(id, [...(this.entries.get(id) ?? []), entry]);
    if (entry.hasLayout) {
      this.notifyLayout(key, role);
    }
    return () => {
      if (this.active.get(id) === entry) {
        this.active.delete(id);
      }
      const remaining = (this.entries.get(id) ?? []).filter(e => e !== entry);
      if (remaining.length > 0) {
        this.entries.set(id, remaining);
      } else {
        this.entries.delete(id);
      }
    };
  }

  /** Called by the element once it has been laid out (so it can be measured). */
  notifyLayout(key: string, role: SharedElementRole): void {
    const listeners = this.layoutListeners.get(idOf(key, role));
    listeners?.forEach(listener => listener());
    listeners?.clear();
  }

  /** Opacity the element renders with; 0 while its overlay copy is flying. */
  opacityFor(key: string, role: SharedElementRole): Animated.Value {
    const id = idOf(key, role);
    let value = this.opacities.get(id);
    if (!value) {
      value = new Animated.Value(1);
      this.opacities.set(id, value);
    }
    return value;
  }

  setHidden(key: string, role: SharedElementRole, hidden: boolean): void {
    this.opacityFor(key, role).setValue(hidden ? 0 : 1);
  }

  /**
   * Marks the element the user tapped, so the flight starts from (and returns to)
   * that exact view even if another one with the same key is mounted, e.g. the
   * same Pokémon in the paged list under the search results.
   */
  markActive(
    key: string,
    role: SharedElementRole,
    entry: SharedElementEntry,
  ): void {
    this.active.set(idOf(key, role), entry);
  }

  /** Top edge of the area where sources are visible (below the list's header). */
  setVisibleTop(top: number): void {
    this.visibleTop = top;
  }

  getVisibleTop(): number {
    return this.visibleTop;
  }

  /** The tapped element if still mounted, else the most recently mounted one. */
  private current(key: string, role: SharedElementRole) {
    const id = idOf(key, role);
    const list = this.entries.get(id);
    const active = this.active.get(id);
    if (active && list?.includes(active)) {
      return active;
    }
    return list?.[list.length - 1] ?? null;
  }

  /**
   * Frame of the element in window coordinates, or null when it is not mounted,
   * not laid out, has no size, or the platform does not answer in time.
   */
  measure(
    key: string,
    role: SharedElementRole,
    timeoutMs = DEFAULT_MEASURE_TIMEOUT_MS,
  ): Promise<Rect | null> {
    const entry = this.current(key, role);
    const node = entry?.node;
    if (!entry?.hasLayout || !node) {
      return Promise.resolve(null);
    }
    const measured = new Promise<Rect | null>(resolve =>
      node.measureInWindow((x, y, width, height) =>
        resolve(width > 0 && height > 0 ? { x, y, width, height } : null),
      ),
    );
    return withTimeout(measured, timeoutMs, null);
  }

  /** Resolves true once an element for key/role is mounted and laid out. */
  waitForLayout(
    key: string,
    role: SharedElementRole,
    timeoutMs: number,
  ): Promise<boolean> {
    if (this.current(key, role)?.hasLayout) {
      return Promise.resolve(true);
    }
    const id = idOf(key, role);
    const laidOut = new Promise<boolean>(resolve => {
      const listeners = this.layoutListeners.get(id) ?? new Set();
      listeners.add(() => resolve(true));
      this.layoutListeners.set(id, listeners);
    });
    return withTimeout(laidOut, timeoutMs, false);
  }
}
