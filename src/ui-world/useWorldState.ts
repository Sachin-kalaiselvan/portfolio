import { useSyncExternalStore } from 'react';
import type { WorldState } from '../world/core/types';
import type { Store } from '../world/core/store';

const noop = () => () => {};

/** Subscribe to the world store (or nothing while it isn't running). */
export function useWorldState(store: Store<WorldState> | null): WorldState | null {
  return useSyncExternalStore(store ? store.subscribe : noop, () => (store ? store.get() : null), () => null);
}
