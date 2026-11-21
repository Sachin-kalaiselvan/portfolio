import { useSyncExternalStore } from 'react';

/**
 * Connects the page (Nav, case studies) to the world without importing it.
 * The world's code is only fetched once someone actually enters it.
 */
export interface Bridge {
  /** The world overlay is wanted. */
  open: boolean;
  /** Start at this case study's district. */
  spawnSlug: string | null;
  /** A one-line note shown on the page, e.g. why 3D stopped. */
  notice: string | null;
  /** Increments to ask a running world to respawn at spawnSlug. */
  request: number;
}

let state: Bridge = { open: false, spawnSlug: null, notice: null, request: 0 };
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const bridge = {
  get: () => state,
  set(patch: Partial<Bridge>) {
    state = { ...state, ...patch };
    emit();
  },
  subscribe(fn: () => void) {
    subs.add(fn);
    return () => subs.delete(fn);
  },
};

const SERVER: Bridge = { open: false, spawnSlug: null, notice: null, request: 0 };

export function useBridge() {
  return useSyncExternalStore(bridge.subscribe, bridge.get, () => SERVER);
}

export function enterWorld(spawnSlug: string | null = null) {
  bridge.set({ open: true, spawnSlug, notice: null, request: state.request + 1 });
}

export function leaveWorld(notice: string | null = null) {
  bridge.set({ open: false, spawnSlug: null, notice });
}
